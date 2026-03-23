import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    // 뒤로가기 함수
    const handleBack = () => {
        navigate(-1);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://52.79.237.156:8090/api/auth/login', {
                username: username,
                password: password,
            });

            let token = response.headers['authorization'] || response.data.accessToken || response.data.token;

            if (token) {
                const pureToken = token.startsWith('Bearer ') ? token.substring(7).trim() : token.trim();
                localStorage.clear();
                localStorage.setItem('token', pureToken);
                localStorage.setItem('username', username);

                alert("로그인에 성공했습니다!");
                navigate('/main');
            } else {
                alert("로그인 성공했으나 서버로부터 토큰을 받지 못했습니다.");
            }

        } catch (error) {
            console.error('로그인 실패 상세:', error);
            const errorMsg = error.response?.data?.message || '아이디 또는 비밀번호를 확인하세요.';
            alert(`로그인 실패: ${errorMsg}`);
        }
    };

    return (
        <div style={styles.container}>
            {/* 상단 네비게이션 영역 (뒤로가기 버튼) */}
            <div style={styles.navBar}>
                <button onClick={handleBack} style={styles.backButton}>〈</button>
            </div>

            <div style={styles.formContainer}>
                <h2 style={styles.title}>로그인</h2>
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

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f0f2f5',
        position: 'relative' // navBar 배치를 위해 추가
    },
    navBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        padding: '20px',
        boxSizing: 'border-box'
    },
    backButton: {
        backgroundColor: 'transparent',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: '#333',
        fontWeight: 'bold',
        padding: '10px'
    },
    formContainer: {
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
    },
    title: { marginBottom: '24px', color: '#333', textAlign: 'center', fontWeight: 'bold', fontSize: '24px' },
    inputGroup: { marginBottom: '20px' },
    label: { display: 'block', marginBottom: '8px', color: '#555', fontWeight: '500' },
    input: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', boxSizing: 'border-box' },
    button: { width: '100%', padding: '14px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', transition: 'background-color 0.2s' },
    footer: { marginTop: '20px', textAlign: 'center', color: '#777', fontSize: '14px' },
    link: { color: '#4285F4', textDecoration: 'none', fontWeight: 'bold' },
};

export default LoginPage;