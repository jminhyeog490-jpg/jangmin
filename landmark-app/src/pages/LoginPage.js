import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import VanillaTilt from 'vanilla-tilt';

// ✅ axios 인터셉터 설정 (모든 요청에 토큰 자동 포함)
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

    const cardRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        // 1️⃣ 이미 로그인 된 상태면 메인으로 즉시 이동 (무한 루프 방지)
        const token = localStorage.getItem("accessToken");
        if (token) {
            navigate('/main', { replace: true });
            return;
        }

        // Cleanup 시 참조를 잃지 않도록 변수에 할당
        const currentCard = cardRef.current;
        const currentBtn = buttonRef.current;

        // 2️⃣ 3D 틸트 효과 초기화
        if (currentCard) {
            VanillaTilt.init(currentCard, {
                max: 5,
                speed: 1000,
                glare: true,
                "max-glare": 0.2,
                gyroscope: true
            });
        }

        // 3️⃣ 마그네틱 버튼 효과 로직
        const handleMouseMove = (e) => {
            if (!currentBtn) return;
            const rect = currentBtn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            currentBtn.style.transform = `translate(${x * 0.3}px, ${y * 0.5}px)`;
        };

        const handleMouseLeave = () => {
            if (currentBtn) {
                currentBtn.style.transform = 'translate(0px, 0px)';
            }
        };

        if (currentBtn) {
            currentBtn.addEventListener('mousemove', handleMouseMove);
            currentBtn.addEventListener('mouseleave', handleMouseLeave);
        }

        // 4️⃣ 컴포넌트 언마운트 시 정리 (Cleanup)
        return () => {
            if (currentCard && currentCard.vanillaTilt) {
                currentCard.vanillaTilt.destroy();
            }
            if (currentBtn) {
                currentBtn.removeEventListener('mousemove', handleMouseMove);
                currentBtn.removeEventListener('mouseleave', handleMouseLeave);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // navigate 의존성을 제거하거나 []를 써서 마운트 시 한 번만 실행

    const handleBack = () => navigate(-1);

    const handleLogin = async (e) => {
        e.preventDefault();

        const loginData = {
            username: username.trim(),
            password: password.trim()
        };

        try {
            const response = await axios.post('http://52.79.237.156:8090/api/auth/login', loginData, {
                headers: { 'Content-Type': 'application/json' }
            });

            // 헤더와 데이터 양쪽에서 토큰 확인
            const token = response.headers['authorization'] ||
                          response.headers['Authorization'] ||
                          response.data.accessToken ||
                          response.data.token;

            if (token) {
                const pureToken = token.startsWith('Bearer ') ? token.substring(7) : token;
                localStorage.setItem('accessToken', pureToken);
                localStorage.setItem('username', username);

                // ✅ SPA 내비게이션을 위해 navigate 사용 (안될 경우 대비해 replace 적용)
                navigate('/main', { replace: true });
            } else {
                alert("로그인 응답에 토큰이 없습니다.");
            }
        } catch (error) {
            console.error("로그인 상세 에러:", error.response?.data);
            const msg = error.response?.data?.message || "아이디 또는 비밀번호를 확인해주세요.";
            alert(msg);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.navBar}>
                <button onClick={handleBack} style={styles.backButton}>‹ Back</button>
            </div>

            <div ref={cardRef} style={styles.formCard}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Welcome Back</h2>
                    <p style={styles.subtitle}>Let's continue your journey</p>
                </div>

                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={styles.underlineInput}
                            placeholder="Username"
                            required
                        />
                        <span style={styles.inputHighlight}></span>
                    </div>
                    <div style={styles.inputGroup}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.underlineInput}
                            placeholder="Password"
                            required
                        />
                        <span style={styles.inputHighlight}></span>
                    </div>

                    <div style={styles.btnWrapper}>
                        <button ref={buttonRef} type="submit" style={styles.dynamicButton}>
                            Login
                        </button>
                    </div>
                </form>

                <div style={styles.footer}>
                    <span style={styles.footerText}>New here?</span>
                    <Link to="/signup" style={styles.link}>Create Account</Link>
                </div>
            </div>

            <style>
                {`
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    input:focus ~ span {
                        width: 100% !important;
                        left: 0 !important;
                    }
                    input::placeholder {
                        color: #ccc;
                        transition: all 0.3s;
                    }
                    input:focus::placeholder {
                        opacity: 0;
                        transform: translateX(10px);
                    }
                `}
            </style>
        </div>
    );
};

// ... styles 객체는 기존과 동일 ...
const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#ffffff', position: 'relative', overflow: 'hidden', fontFamily: "'Poppins', sans-serif" },
    navBar: { position: 'absolute', top: 0, left: 0, width: '100%', padding: '30px 40px', boxSizing: 'border-box', zIndex: 10 },
    backButton: { backgroundColor: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#333', fontWeight: '500' },
    formCard: { padding: '60px 50px', backgroundColor: '#ffffff', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)', width: '100%', maxWidth: '460px', boxSizing: 'border-box', textAlign: 'center', animation: 'fadeInUp 0.8s ease-out forwards', transformStyle: 'preserve-3d', willChange: 'transform' },
    header: { marginBottom: '50px' },
    title: { margin: '0 0 10px 0', color: '#1a1a1a', fontWeight: '700', fontSize: '34px', letterSpacing: '-1.5px', transform: 'translateZ(30px)' },
    subtitle: { margin: 0, color: '#888', fontSize: '16px', transform: 'translateZ(20px)' },
    form: { display: 'flex', flexDirection: 'column' },
    inputGroup: { marginBottom: '35px', position: 'relative', transform: 'translateZ(15px)' },
    underlineInput: { width: '100%', padding: '12px 0', border: 'none', borderBottom: '2px solid #eaeaea', backgroundColor: 'transparent', fontSize: '16px', color: '#333', transition: 'all 0.3s', outline: 'none' },
    inputHighlight: { position: 'absolute', bottom: 0, left: '50%', width: '0%', height: '2px', backgroundColor: '#1a1a1a', transition: 'all 0.4s ease' },
    btnWrapper: { marginTop: '20px', perspective: '1000px' },
    dynamicButton: { width: '100%', padding: '18px', backgroundColor: '#1a1a1a', color: 'white', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', transition: 'box-shadow 0.3s', willChange: 'transform' },
    footer: { marginTop: '40px', fontSize: '15px', transform: 'translateZ(10px)' },
    footerText: { color: '#888' },
    link: { color: '#1a1a1a', textDecoration: 'none', fontWeight: '600', marginLeft: '8px' },
};

export default LoginPage;