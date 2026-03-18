import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try{
            const response = await axios.post('http://52.79.237.156:8090/api/auth/login', {
                username: username,
                password: password,
            });

            console.log('응답 데이터:', response.data);
            console.log('응답 헤더:', response.headers);

            // 2. 토큰 추출 (우선순위: 헤더 -> 바디 순서)
            let token = response.headers['authorization'];

            if (!token && response.data && response.data.accessToken) {
                token = response.data.accessToken;
            }

            // 3. 토큰이 존재할 경우 처리
            if (token) {
                const pureToken = token.startsWith('Bearer ') ? token.substring(7).trim() : token.trim();
                localStorage.setItem('token', pureToken);
                localStorage.setItem('username', username);

                alert("로그인에 성공했습니다!");
                navigate('/main');
                window.location.reload();
            } else {
                alert("로그인 성공했으나 서버로부터 토큰을 받지 못했습니다.");
            }

        } catch (error) {
            console.error('로그인 실패 상세:', error);
            if (error.response) {
                alert(`로그인 실패: ${error.response.data.message || '아이디 또는 비밀번호를 확인하세요.'}`);
            } else {
                alert('서버와 연결할 수 없습니다.');
            }
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formContainer}>
                <h2 style={styles.title}>로그인</h2>
                {}
                <form onSubmit={handleLogin}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="username" style={styles.label}>아이디</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={styles.input}
                            autoComplete="username"
                            required
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="password" style={styles.label}>비밀번호</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            autoComplete="current-password"
                            required
                        />
                    </div>
                    <button type="submit" style={styles.button}>로그인</button>
                </form>
                <div style={styles.footer}>
                    <p>계정이 없으신가요? <Link to="/signup" style={styles.link}>회원가입</Link></p>
                </div>
            </div>
        </div>
    );
};

// 스타일 정의 (변경 없음)
const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' },
    formContainer: { padding: '40px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
    title: { marginBottom: '24px', color: '#333', textAlign: 'center', fontWeight: 'bold', fontSize: '24px' },
    inputGroup: { marginBottom: '20px' },
    label: { display: 'block', marginBottom: '8px', color: '#555', fontWeight: '500' },
    input: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', boxSizing: 'border-box' },
    button: { width: '100%', padding: '14px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', transition: 'background-color 0.2s' },
    footer: { marginTop: '20px', textAlign: 'center', color: '#777', fontSize: '14px' },
    link: { color: '#4285F4', textDecoration: 'none', fontWeight: 'bold' },
};

export default LoginPage;