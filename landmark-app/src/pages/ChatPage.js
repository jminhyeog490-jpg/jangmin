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

    // 로컬 스토리지에서 유저네임 가져오기 (비교를 위해 trim 처리)
    const currentUsername = localStorage.getItem('username')?.trim() || "";
    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        fetchRooms();
        return () => {
            if (stompClient.current) stompClient.current.disconnect();
        };
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await apiClient.get('/api/chat/rooms');
            setRooms(response.data);
        } catch (error) {
            console.error('목록 불러오기 실패:', error);
            if (error.response?.status === 401) {
                alert("세션이 만료되었습니다. 다시 로그인해주세요.");
                navigate('/login');
            }
        }
    };

    const handleCreateRoom = async () => {
        if (!newRoomTitle.trim()) return;
        try {
            await apiClient.post('/api/chat/rooms', { title: newRoomTitle });
            setNewRoomTitle('');
            fetchRooms();
        } catch (error) {
            console.error('채팅방 생성 실패:', error);
            alert("채팅방 생성에 실패했습니다.");
        }
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
        stompClient.current.debug = () => {};

        const headers = { Authorization: `Bearer ${token}` };

        stompClient.current.connect(headers, () => {
            stompClient.current.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                const receivedMessage = JSON.parse(message.body);
                // 서버에서 시간이 안 올 경우를 대비한 기본값
                if(!receivedMessage.createdAt) receivedMessage.createdAt = new Date().toISOString();
                setMessages((prev) => [...prev, receivedMessage]);
            });
        }, (error) => {
            console.error("STOMP Connection Error:", error);
        });
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !stompClient.current?.connected || !currentRoom) return;

        const message = {
            roomId: currentRoom.id,
            content: newMessage,
            sender: currentUsername, // 서버가 받는 필드명
            type: 'TALK',
            createdAt: new Date().toISOString()
        };

        const headers = { Authorization: `Bearer ${token}` };
        stompClient.current.send("/pub/chat/message", headers, JSON.stringify(message));
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

    // 채팅방 목록 화면
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
                        <div key={room.id} style={styles.roomCard} onClick={() => handleEnterRoom(room)}>
                            <div style={styles.roomAvatar}>{room.title ? room.title.substring(0,1) : "R"}</div>
                            <div style={styles.roomInfo}>
                                <div style={styles.roomTitle}>{room.title}</div>
                            </div>
                            <div style={styles.roomArrow}>〉</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 채팅창 내부 화면
    return (
        <div style={styles.container}>
            <ChatHeader title={currentRoom.title} subTitle={`${messages.length} messages`} onBackClick={handleLeaveRoom} />
            <div style={styles.chatWindow}>
                {messages.map((msg, index) => {
                    // 서버에서 어떤 필드(sender 혹은 username)로 이름을 주든 대응하도록 수정
                    const senderName = msg.senderName|| msg.sender || msg.username || "익명";
                    const isMe = String(senderName).trim() === String(currentUsername).trim();

                    return (
                        <div key={index} style={{
                            ...styles.messageFadeIn,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start',
                            width: '100%',
                            marginBottom: '12px'
                        }}>
                            {!isMe && <div style={styles.author}>{senderName}</div>}

                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                gap: '8px',
                                flexDirection: isMe ? 'row' : 'row-reverse'
                            }}>
                                <span style={styles.timeLabel}>{formatTime(msg.createdAt)}</span>
                                <div style={isMe ? styles.myBubble : styles.otherBubble}>
                                    {msg.content}
                                </div>
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
                @keyframes bubbleUp { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
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
    roomCard: { display: 'flex', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #fcfcfc', cursor: 'pointer' },
    roomAvatar: { width: '45px', height: '45px', borderRadius: '15px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#555', marginRight: '15px' },
    roomInfo: { flex: 1 },
    roomTitle: { fontWeight: '600', fontSize: '16px', color: '#1a1a1a' },
    roomArrow: { color: '#ddd', fontSize: '12px' },
    chatWindow: { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' },
    messageFadeIn: { animation: 'bubbleUp 0.3s ease-out' },
    author: { fontSize: '12px', color: '#888', fontWeight: '600', marginBottom: '5px', marginLeft: '4px' },
    timeLabel: { fontSize: '10px', color: '#ccc', minWidth: '55px', textAlign: 'center' },
    myBubble: { padding: '12px 16px', backgroundColor: '#1a1a1a', color: '#fff', borderRadius: '20px 20px 4px 20px', fontSize: '14px', lineHeight: '1.5', maxWidth: '80%' },
    otherBubble: { padding: '12px 16px', backgroundColor: '#f2f2f2', color: '#333', borderRadius: '20px 20px 20px 4px', fontSize: '14px', lineHeight: '1.5', maxWidth: '80%' },
    inputContainer: { padding: '20px', backgroundColor: '#fff' },
    inputWrapper: { display: 'flex', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: '25px', padding: '5px 5px 5px 20px', border: '1px solid #f0f0f0' },
    chatInput: { flex: 1, border: 'none', backgroundColor: 'transparent', padding: '10px 0', fontSize: '14px' },
    sendButton: { width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#1a1a1a', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    sendIcon: { color: '#fff', fontSize: '14px' }
};

export default ChatPage;