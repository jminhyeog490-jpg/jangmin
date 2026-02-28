import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api'; // axios 인스턴스
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const ChatPage = () => {
    const [rooms, setRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null); // 현재 선택된 방
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [newRoomTitle, setNewRoomTitle] = useState('');

    const stompClient = useRef(null);
    const messagesEndRef = useRef(null);

    // 1. 채팅방 목록 불러오기
    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await apiClient.get('/api/chat/rooms');
            setRooms(response.data);
        } catch (error) {
            console.error('채팅방 목록 불러오기 실패:', error);
        }
    };

    // 2. 채팅방 생성
    const handleCreateRoom = async () => {
        if (!newRoomTitle) return;
        try {
            await apiClient.post('/api/chat/rooms', { title: newRoomTitle }); // 백엔드 DTO에 맞춰 수정 필요할 수 있음 (String 그대로 보내는지 확인)
            setNewRoomTitle('');
            fetchRooms();
        } catch (error) {
            console.error('채팅방 생성 실패:', error);
            alert('채팅방 생성에 실패했습니다.');
        }
    };

    // 3. 채팅방 입장 (STOMP 연결)
    const handleEnterRoom = (room) => {
        setCurrentRoom(room);
        setMessages([]); // 이전 메시지 초기화 (실제로는 백엔드에서 불러와야 함)
        connectStomp(room.id);
    };

    // 4. 채팅방 나가기 (연결 종료)
    const handleLeaveRoom = () => {
        if (stompClient.current) {
            stompClient.current.disconnect();
        }
        setCurrentRoom(null);
        fetchRooms();
    };

    // STOMP 연결 함수
    const connectStomp = (roomId) => {
        const socket = new SockJS('http://localhost:8090/ws-chat');
        stompClient.current = Stomp.over(socket);

        stompClient.current.connect({}, () => {
            console.log('STOMP Connected');

            // 구독 (Subscribe)
            stompClient.current.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                const receivedMessage = JSON.parse(message.body);
                setMessages((prev) => [...prev, receivedMessage]);
            });

            // 입장 메시지 전송 (선택 사항)
            // stompClient.current.send("/pub/chat/enter", {}, JSON.stringify({ roomId: roomId, sender: localStorage.getItem('username') }));

        }, (error) => {
            console.error('STOMP Connection Error:', error);
        });
    };

    // 메시지 전송
    const handleSendMessage = () => {
        if (!newMessage || !stompClient.current || !currentRoom) return;

        const message = {
            roomId: currentRoom.id,
            content: newMessage,
            sender: localStorage.getItem('username') || 'Anonymous',
            type: 'TALK' // 메시지 타입 (TALK, ENTER, LEAVE 등)
        };

        stompClient.current.send("/pub/chat/message", {}, JSON.stringify(message));
        setNewMessage('');
    };

    // 스크롤 자동 이동
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    // --- 렌더링 ---

    // 채팅방 목록 화면
    if (!currentRoom) {
        return (
            <div style={styles.container}>
                <div style={styles.header}>
                    <h2>💬 채팅방 목록</h2>
                    <Link to="/main" style={styles.backLink}>← 메인으로 돌아가기</Link>
                </div>

                <div style={styles.createRoomArea}>
                    <input
                        type="text"
                        placeholder="새로운 방 제목"
                        value={newRoomTitle}
                        onChange={(e) => setNewRoomTitle(e.target.value)}
                        style={styles.input}
                    />
                    <button onClick={handleCreateRoom} style={styles.button}>방 만들기</button>
                </div>

                <div style={styles.roomList}>
                    {rooms.map(room => (
                        <div key={room.id} style={styles.roomCard} onClick={() => handleEnterRoom(room)}>
                            <div style={styles.roomTitle}>{room.title}</div>
                            <div style={styles.roomMeta}>참여자: {room.userCount || 0}명</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 채팅 화면
    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2>💬 {currentRoom.title}</h2>
                <button onClick={handleLeaveRoom} style={styles.backLink}>나가기</button>
            </div>

            <div style={styles.chatWindow}>
                {messages.map((msg, index) => (
                    <div key={index} style={msg.sender === localStorage.getItem('username') ? styles.myMessage : styles.otherMessage}>
                        <div style={styles.author}>{msg.sender}</div>
                        <div style={styles.messageBubble}>{msg.content}</div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div style={styles.inputArea}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    style={styles.input}
                    placeholder="메시지를 입력하세요..."
                />
                <button onClick={handleSendMessage} style={styles.sendButton}>전송</button>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '800px', margin: '0 auto', border: '1px solid #eee' },
    header: { padding: '10px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    backLink: { textDecoration: 'none', color: '#4285F4', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' },
    createRoomArea: { padding: '20px', display: 'flex', gap: '10px', borderBottom: '1px solid #eee' },
    roomList: { flex: 1, overflowY: 'auto', padding: '20px' },
    roomCard: { padding: '15px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px', cursor: 'pointer', transition: 'background-color 0.2s' },
    roomTitle: { fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' },
    roomMeta: { fontSize: '12px', color: '#777' },
    input: { flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ddd' },
    button: { padding: '10px 20px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },

    // 채팅 화면 스타일 (기존과 동일)
    chatWindow: { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
    myMessage: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    otherMessage: { alignSelf: 'flex-start', alignItems: 'flex-start' },
    author: { fontSize: '12px', color: '#777', marginBottom: '4px' },
    messageBubble: { padding: '10px 15px', borderRadius: '15px', maxWidth: '70%', backgroundColor: '#f0f0f0' },
    inputArea: { display: 'flex', padding: '10px', borderTop: '1px solid #eee' },
    sendButton: { padding: '10px 20px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', marginLeft: '10px' }
};

export default ChatPage;