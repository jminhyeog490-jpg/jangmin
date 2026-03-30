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

    // ✅ 인증 정보 가져오기 (키 이름 accessToken 확인)
    const currentUsername = localStorage.getItem('username')?.trim();
    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        fetchRooms();
        // 언마운트 시 연결 종료
        return () => {
            if (stompClient.current) stompClient.current.disconnect();
        };
    }, []);

    // 1. 채팅방 목록 불러오기
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

    // 2. 채팅방 생성
    const handleCreateRoom = async () => {
        if (!newRoomTitle.trim()) return;
        try {
            await apiClient.post('/api/chat/rooms', { title: newRoomTitle });
            setNewRoomTitle('');
            fetchRooms(); // 생성 후 목록 갱신
        } catch (error) {
            console.error('채팅방 생성 실패:', error);
        }
    };

    // 3. 채팅방 입장
    const handleEnterRoom = (room) => {
        setCurrentRoom(room);
        setMessages([]);
        connectStomp(room.id);
    };

    // 4. 채팅방 퇴장
    const handleLeaveRoom = () => {
        if (stompClient.current) {
            stompClient.current.disconnect(() => {
                console.log("Disconnected");
            });
        }
        setCurrentRoom(null);
        fetchRooms();
    };

    // 5. STOMP 연결 (인증 헤더 추가)
    const connectStomp = (roomId) => {
        const socket = new SockJS(`${SERVER_URL}/ws-chat`);
        stompClient.current = Stomp.over(socket);
        stompClient.current.debug = null; // 콘솔 로그 지우기

        // ✅ Spring Security가 WebSocket 연결을 허용하도록 토큰 전달
        const headers = {
            Authorization: `Bearer ${token}`
        };

        stompClient.current.connect(headers, () => {
            // 구독 (서버에서 메시지 받기)
            stompClient.current.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                const receivedMessage = JSON.parse(message.body);
                if(!receivedMessage.createdAt) receivedMessage.createdAt = new Date().toISOString();
                setMessages((prev) => [...prev, receivedMessage]);
            });
        }, (error) => {
            console.error("STOMP Connection Error:", error);
            alert("채팅 연결에 실패했습니다.");
        });
    };

    // 6. 메시지 전송
    const handleSendMessage = () => {
        if (!newMessage.trim() || !stompClient.current?.connected || !currentRoom) return;

        const message = {
            roomId: currentRoom.id,
            content: newMessage,
            sender: currentUsername,
            type: 'TALK',
            createdAt: new Date().toISOString()
        };

        // ✅ 전송 시에도 헤더에 토큰 포함
        const headers = {
            Authorization: `Bearer ${token}`
        };

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
                    {rooms.length === 0 ? (
                        <div style={{textAlign: 'center', color: '#ccc', marginTop: '50px'}}>채팅방이 없습니다.</div>
                    ) : (
                        rooms.map(room => (
                            <div key={room.id} className="room-card" style={styles.roomCard} onClick={() => handleEnterRoom(room)}>
                                <div style={styles.roomAvatar}>{room.title.substring(0,1)}</div>
                                <div style={styles.roomInfo}>
                                    <div style={styles.roomTitle}>{room.title}</div>
                                    <div style={styles.roomMeta}>{room.userCount || 0}명이 대화 중</div>
                                </div>
                                <div style={styles.roomArrow}>〉</div>
                            </div>
                        ))
                    )}
                </div>
                <style>{`
                    .room-card:active { background-color: #f0f0f0; transform: scale(0.98); }
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

// 스타일 (기존 유지)
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