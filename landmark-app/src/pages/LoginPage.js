import React, { useState, useEffect } from 'react'; // useEffect 추가
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// ✅ axios 인터셉터 (전역 설정: 요청 시 토큰 자동 포함)
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

    // ✅ [추가] 이미 로그인된 토큰이 로컬에 있다면 바로 메인으로 리다이렉트
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            navigate('/main');
        }
    }, [navigate]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // 1. 로그인 요청
            const response = await axios.post('http://52.79.237.156:8090/api/auth/login', {
                username: username,
                password: password,
            });

            // 2. 토큰 추출 (헤더 또는 바디)
            let token = response.headers['authorization']
                || response.data.accessToken
                || response.data.token;

            if (token) {
                const pureToken = token.startsWith('Bearer ')
                    ? token.substring(7).trim()
                    : token.trim();

                // ✅ 로컬 스토리지 저장 (키 통일)
                localStorage.setItem('accessToken', pureToken);
                localStorage.setItem('username', username);

                alert("로그인에 성공했습니다!");
                navigate('/main');
            } else {
                alert("로그인 성공했으나 토큰 정보가 없습니다.");
            }

        } catch (error) {
            console.error('로그인 실패 상세:', error);

            // ✅ [중복 로그인 방지 핵심] 서버에서 보낸 에러 메시지 처리
            // 백엔드 AuthService에서 IllegalStateException으로 던진 메시지를 띄웁니다.
            const serverError = error.response?.data?.message || error.response?.data;

            if (serverError && (serverError.includes("이미 다른 기기") || serverError.includes("로그인 중"))) {
                // 중복 로그인 차단 시 알림
                alert(`⚠️ 진입 불가: ${serverError}`);
            } else if (error.response?.status === 401 || error.response?.status === 400) {
                alert("아이디 또는 비밀번호가 일치하지 않습니다.");
            } else {
                alert(`로그인 오류: ${serverError || "서버와 연결할 수 없습니다."}`);
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

// ... (styles 객체는 기존과 동일하므로 생략)
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