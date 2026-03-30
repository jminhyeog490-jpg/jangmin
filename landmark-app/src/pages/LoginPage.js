import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// ✅ axios 인터셉터 설정
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = "Bearer " + token;
    }
    return config;
});

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            navigate('/main');
        }
    }, [navigate]);

    const handleBack = () => {
        navigate(-1);
    };

    // ✅ 중첩된 부분 제거 및 에러 로직 강화
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://52.79.237.156:8090/api/auth/login', {
                username: username,
                password: password,
            });

            let token = response.headers['authorization']
                || response.data.accessToken
                || response.data.token;

            if (token) {
                const pureToken = token.startsWith('Bearer ')
                    ? token.substring(7).trim()
                    : token.trim();

                localStorage.setItem('accessToken', pureToken);
                localStorage.setItem('username', username);

                alert("로그인에 성공했습니다!");
                navigate('/main');
            }
        } catch (error) {
            console.error('로그인 실패 상세:', error);

            // ✅ 서버에서 온 에러 메시지 추출 (다양한 형태 대응)
            const serverErrorMsg = error.response?.data?.message
                                || (typeof error.response?.data === 'string' ? error.response.data : null)
                                || "아이디 또는 비밀번호가 일치하지 않습니다.";

            // 1. 중복 로그인 메시지 체크
            if (serverErrorMsg.includes("이미 다른 기기") || serverErrorMsg.includes("로그인 중")) {
                alert(`⚠️ 중복 로그인 제한:\n${serverErrorMsg}`);
            }
            // 2. 그 외 일반적인 로그인 실패
            else {
                alert(serverErrorMsg);
            }
        }
    };

    return (
        <div style={styles.container}>
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
                            placeholder="아이디를 입력하세요"
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
                            placeholder="비밀번호를 입력하세요"
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
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5', position: 'relative' },
    navBar: { position: 'absolute', top: 0, left: 0, width: '100%', padding: '20px', boxSizing: 'border-box' },
    backButton: { backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#333', fontWeight: 'bold', padding: '10px' },
    formContainer: { padding: '40px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
    title: { marginBottom: '24px', color: '#333', textAlign: 'center', fontWeight: 'bold', fontSize: '24px' },
    inputGroup: { marginBottom: '20px' },
    label: { display: 'block', marginBottom: '8px', color: '#555', fontWeight: '500' },
    input: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', boxSizing: 'border-box' },
    button: { width: '100%', padding: '14px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
    footer: { marginTop: '20px', textAlign: 'center', color: '#777', fontSize: '14px' },
    link: { color: '#4285F4', textDecoration: 'none', fontWeight: 'bold' },
};

export default LoginPage;