import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const ChatPage = () => {
    const SERVER_URL = "http://52.79.237.156:8090";
    const [rooms, setRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [newRoomTitle, setNewRoomTitle] = useState('');

    const stompClient = useRef(null);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    const currentUsername = localStorage.getItem('username')?.trim();

    useEffect(() => { fetchRooms(); }, []);

    const fetchRooms = async () => {
        try {
            const response = await apiClient.get('/api/chat/rooms');
            setRooms(response.data);
        } catch (error) { console.error('목록 불러오기 실패:', error); }
    };

    const handleCreateRoom = async () => {
        if (!newRoomTitle) return;
        try {
            await apiClient.post('/api/chat/rooms', { title: newRoomTitle });
            setNewRoomTitle('');
            fetchRooms();
        } catch (error) { console.error('채팅방 생성 실패:', error); }
    };

    const handleEnterRoom = (room) => {
        setCurrentRoom(room);
        setMessages([]);
        connectStomp(room.id);
    };

    const handleLeaveRoom = () => {
        if (stompClient.current) stompClient.current.disconnect();
        setCurrentRoom(null);
        fetchRooms();
    };

    const connectStomp = (roomId) => {
        const socket = new SockJS(`${SERVER_URL}/ws-chat`);
        stompClient.current = Stomp.over(socket);
        // 디버그 로그 제거 (깔끔한 콘솔을 위해)
        stompClient.current.debug = null;
        stompClient.current.connect({}, () => {
            stompClient.current.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                const receivedMessage = JSON.parse(message.body);
                if(!receivedMessage.createdAt) receivedMessage.createdAt = new Date().toISOString();
                setMessages((prev) => [...prev, receivedMessage]);
            });
        });
    };

    const handleSendMessage = () => {
        if (!newMessage || !stompClient.current || !currentRoom) return;
        const message = {
            roomId: currentRoom.id,
            content: newMessage,
            sender: currentUsername,
            type: 'TALK',
            createdAt: new Date().toISOString()
        };
        stompClient.current.send("/pub/chat/message", {}, JSON.stringify(message));
        setNewMessage('');
    };

    const formatTime = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const ChatHeader = ({ title, onBackClick, subTitle }) => (
        <div style={styles.navBar}>
            <button onClick={onBackClick} style={styles.backButton}>〈</button>
            <div style={styles.headerTitleArea}>
                <div style={styles.headerMainTitle}>{title}</div>
                {subTitle && <div style={styles.headerSubTitle}>{subTitle}</div>}
            </div>
            <div style={{ width: '40px' }}></div>
        </div>
    );

    // [이미지: 실시간 채팅 UI 구조도]
    // 채팅 목록 화면
    if (!currentRoom) {
        return (
            <div style={styles.container}>
                <ChatHeader title="Messages" onBackClick={() => navigate('/main')} />
                <div style={styles.createRoomArea}>
                    <input
                        type="text"
                        placeholder="새로운 대화방 제목..."
                        value={newRoomTitle}
                        onChange={(e) => setNewRoomTitle(e.target.value)}
                        style={styles.roomInput}
                    />
                    <button onClick={handleCreateRoom} style={styles.createButton}>생성</button>
                </div>
                <div style={styles.roomList}>
                    {rooms.map(room => (
                        <div key={room.id} className="room-card" style={styles.roomCard} onClick={() => handleEnterRoom(room)}>
                            <div style={styles.roomAvatar}>{room.title.substring(0,1)}</div>
                            <div style={styles.roomInfo}>
                                <div style={styles.roomTitle}>{room.title}</div>
                                <div style={styles.roomMeta}>{room.userCount || 0}명이 대화 중</div>
                            </div>
                            <div style={styles.roomArrow}>〉</div>
                        </div>
                    ))}
                </div>
                <style>{`
                    .room-card:active { background-color: #f0f0f0; transform: scale(0.98); }
                    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                `}</style>
            </div>
        );
    }

    // 채팅창 화면
    return (
        <div style={styles.container}>
            <ChatHeader title={currentRoom.title} subTitle={`${messages.length} messages`} onBackClick={handleLeaveRoom} />
            <div style={styles.chatWindow}>
                {messages.map((msg, index) => {
                    const isMe = String(msg.sender).trim() === String(currentUsername).trim();
                    return (
                        <div key={index} style={{...styles.messageFadeIn, ...(isMe ? styles.myMessageWrapper : styles.otherMessageWrapper)}}>
                            {!isMe && <div style={styles.author}>{msg.sender}</div>}
                            <div style={isMe ? styles.myMessageRow : styles.otherMessageRow}>
                                {isMe && <span style={styles.timeLabel}>{formatTime(msg.createdAt)}</span>}
                                <div style={isMe ? styles.myBubble : styles.otherBubble}>
                                    {msg.content}
                                </div>
                                {!isMe && <span style={styles.timeLabel}>{formatTime(msg.createdAt)}</span>}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div style={styles.inputContainer}>
                <div style={styles.inputWrapper}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        style={styles.chatInput}
                        placeholder="메시지를 입력하세요..."
                    />
                    <button onClick={handleSendMessage} style={styles.sendButton}>
                        <div style={styles.sendIcon}>▲</div>
                    </button>
                </div>
            </div>
            <style>{`
                input:focus { outline: none; }
                @keyframes bubbleUp { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
};

const styles = {
    container: { display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', maxWidth: '500px', margin: '0 auto', backgroundColor: '#fff', position: 'relative' },
    navBar: { height: '70px', borderBottom: '1px solid #f2f2f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', backgroundColor: '#fff', zIndex: 10 },
    backButton: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#333' },
    headerTitleArea: { textAlign: 'center' },
    headerMainTitle: { fontWeight: '700', fontSize: '18px', color: '#1a1a1a' },
    headerSubTitle: { fontSize: '11px', color: '#00cc66', fontWeight: '600', marginTop: '2px' },

    createRoomArea: { padding: '20px', display: 'flex', gap: '10px' },
    roomInput: { flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#f8f8f8', fontSize: '14px' },
    createButton: { padding: '10px 20px', backgroundColor: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' },

    roomList: { flex: 1, overflowY: 'auto', padding: '0 20px' },
    roomCard: { display: 'flex', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #fcfcfc', cursor: 'pointer', transition: 'all 0.2s' },
    roomAvatar: { width: '45px', height: '45px', borderRadius: '15px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#555', marginRight: '15px' },
    roomInfo: { flex: 1 },
    roomTitle: { fontWeight: '600', fontSize: '16px', color: '#1a1a1a' },
    roomMeta: { fontSize: '13px', color: '#aaa', marginTop: '3px' },
    roomArrow: { color: '#ddd', fontSize: '12px' },

    chatWindow: { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fff' },
    messageFadeIn: { animation: 'bubbleUp 0.3s ease-out' },

    myMessageWrapper: { alignSelf: 'flex-end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '85%' },
    otherMessageWrapper: { alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '85%' },
    myMessageRow: { display: 'flex', alignItems: 'flex-end', gap: '8px' },
    otherMessageRow: { display: 'flex', alignItems: 'flex-end', gap: '8px' },

    author: { fontSize: '12px', color: '#888', fontWeight: '600', marginBottom: '5px', marginLeft: '4px' },
    timeLabel: { fontSize: '10px', color: '#ccc', minWidth: '50px', textAlign: 'right' },

    myBubble: { padding: '12px 16px', backgroundColor: '#1a1a1a', color: '#fff', borderRadius: '20px 20px 4px 20px', fontSize: '14px', lineHeight: '1.5', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
    otherBubble: { padding: '12px 16px', backgroundColor: '#f2f2f2', color: '#333', borderRadius: '20px 20px 20px 4px', fontSize: '14px', lineHeight: '1.5' },

    inputContainer: { padding: '20px', backgroundColor: '#fff' },
    inputWrapper: { display: 'flex', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: '25px', padding: '5px 5px 5px 20px', border: '1px solid #f0f0f0' },
    chatInput: { flex: 1, border: 'none', backgroundColor: 'transparent', padding: '10px 0', fontSize: '14px' },
    sendButton: { width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#1a1a1a', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' },
    sendIcon: { color: '#fff', fontSize: '14px', transform: 'rotate(0deg)' }
};

export default ChatPage;