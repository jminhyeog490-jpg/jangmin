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

    // 로컬 스토리지 값을 가져올 때 확실히 처리
    const currentUsername = localStorage.getItem('username')?.trim();

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await apiClient.get('/api/chat/rooms');
            setRooms(response.data);
        } catch (error) {
            console.error('목록 불러오기 실패:', error);
        }
    };

    const handleCreateRoom = async () => {
        if (!newRoomTitle) return;
        try {
            await apiClient.post('/api/chat/rooms', { title: newRoomTitle });
            setNewRoomTitle('');
            fetchRooms();
        } catch (error) {
            console.error('채팅방 생성 실패:', error);
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
        stompClient.current.connect({}, () => {
            stompClient.current.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                const receivedMessage = JSON.parse(message.body);
                // 백엔드 BaseEntity 시간이 없을 경우를 대비해 현재 시간 할당
                if(!receivedMessage.createdAt) {
                    receivedMessage.createdAt = new Date().toISOString();
                }
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
        return date.toLocaleTimeString('ko-KR', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const ChatHeader = ({ title, onBackClick }) => (
        <div style={styles.navBar}>
            <button onClick={onBackClick} style={styles.backButton}>〈</button>
            <div style={{ fontWeight: 'bold', fontSize: '17px' }}>{title}</div>
            <div style={{ width: '40px' }}></div>
        </div>
    );

    if (!currentRoom) {
        return (
            <div style={styles.container}>
                <ChatHeader title="채팅 목록" onBackClick={() => navigate('/main')} />
                <div style={styles.createRoomArea}>
                    <input type="text" placeholder="방 제목 입력" value={newRoomTitle} onChange={(e) => setNewRoomTitle(e.target.value)} style={styles.input} />
                    <button onClick={handleCreateRoom} style={styles.button}>생성</button>
                </div>
                <div style={styles.roomList}>
                    {rooms.map(room => (
                        <div key={room.id} style={styles.roomCard} onClick={() => handleEnterRoom(room)}>
                            <div style={styles.roomTitle}>{room.title}</div>
                            <div style={styles.roomMeta}>{room.userCount || 0}명 참여 중</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <ChatHeader title={currentRoom.title} onBackClick={handleLeaveRoom} />
            <div style={styles.chatWindow}>
                {messages.map((msg, index) => {
                    // ⭐ 쏠림 현상 방지: 두 값이 일치하는지 콘솔에서 확인하세요
                    // console.log(`나: [${currentUsername}], 보낸이: [${msg.sender}]`);
                    const isMe = String(msg.sender).trim() === String(currentUsername).trim();

                    return (
                        <div key={index} style={isMe ? styles.myMessageWrapper : styles.otherMessageWrapper}>
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
            <div style={styles.inputArea}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    style={styles.chatInput}
                    placeholder="메시지를 입력하세요"
                />
                <button onClick={handleSendMessage} style={styles.sendButton}>전송</button>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', maxWidth: '500px', margin: '0 auto', backgroundColor: '#fff' },
    navBar: { height: '60px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 15px', backgroundColor: '#fff' },
    backButton: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' },

    createRoomArea: { padding: '15px', display: 'flex', gap: '8px', borderBottom: '1px solid #f5f5f5' },
    input: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' },
    button: { padding: '10px 15px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },

    roomList: { flex: 1, overflowY: 'auto', padding: '15px' },
    roomCard: { padding: '15px', borderBottom: '1px solid #f9f9f9', cursor: 'pointer' },
    roomTitle: { fontWeight: '600', fontSize: '16px' },
    roomMeta: { fontSize: '12px', color: '#999', marginTop: '4px' },

    chatWindow: { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: '#fff' },

    myMessageWrapper: { alignSelf: 'flex-end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
    otherMessageWrapper: { alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },

    myMessageRow: { display: 'flex', alignItems: 'flex-end', gap: '6px' },
    otherMessageRow: { display: 'flex', alignItems: 'flex-end', gap: '6px' },

    author: { fontSize: '12px', color: '#333', fontWeight: '500', marginBottom: '4px', marginLeft: '4px' },
    timeLabel: { fontSize: '10px', color: '#aaa', marginBottom: '2px' },

    myBubble: { padding: '10px 14px', backgroundColor: '#000', color: '#fff', borderRadius: '18px 18px 2px 18px', fontSize: '14px', maxWidth: '280px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    otherBubble: { padding: '10px 14px', backgroundColor: '#f0f0f0', color: '#333', borderRadius: '18px 18px 18px 2px', fontSize: '14px', maxWidth: '280px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },

    inputArea: { padding: '15px', display: 'flex', gap: '10px', borderTop: '1px solid #eee', backgroundColor: '#fff' },
    chatInput: { flex: 1, padding: '12px 15px', borderRadius: '25px', border: '1px solid #eee', backgroundColor: '#f9f9f9', outline: 'none' },
    sendButton: { padding: '10px 20px', color: '#000', border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer' }
};

export default ChatPage;