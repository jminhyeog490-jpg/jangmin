import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import VanillaTilt from 'vanilla-tilt'; // ✅ npm install vanilla-tilt 필수

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

    const cardRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        // 이미 로그인 된 상태면 메인으로
        const token = localStorage.getItem("accessToken");
        if (token) {
            navigate('/main');
        }

        // 1. 3D 틸트 효과 초기화
        if (cardRef.current) {
            VanillaTilt.init(cardRef.current, {
                max: 5,
                speed: 1000,
                glare: true,
                "max-glare": 0.2,
                gyroscope: true
            });
        }

        // 2. 마그네틱 버튼 효과
        const handleMouseMove = (e) => {
            if (!buttonRef.current) return;
            const btn = buttonRef.current;
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.5}px)`;
        };

        const handleMouseLeave = () => {
            if (buttonRef.current) {
                buttonRef.current.style.transform = 'translate(0px, 0px)';
            }
        };

        const btn = buttonRef.current;
        if (btn) {
            btn.addEventListener('mousemove', handleMouseMove);
            btn.addEventListener('mouseleave', handleMouseLeave);
        }

        return () => {
            if (cardRef.current && cardRef.current.vanillaTilt) {
                cardRef.current.vanillaTilt.destroy();
            }
            if (btn) {
                btn.removeEventListener('mousemove', handleMouseMove);
                btn.removeEventListener('mouseleave', handleMouseLeave);
            }
        };
    }, [navigate]);

    const handleBack = () => navigate(-1);

    const handleLogin = async (e) => {
        e.preventDefault();

        // 400 에러 방지를 위한 데이터 정리
        const loginData = {
            username: username.trim(),
            password: password.trim()
        };

        try {
            const response = await axios.post('http://52.79.237.156:8090/api/auth/login', loginData, {
                headers: { 'Content-Type': 'application/json' }
            });

            // 토큰 추출 (다양한 경로 대응)
            const token = response.headers['authorization'] ||
                          response.headers['Authorization'] ||
                          response.data.accessToken ||
                          response.data.token;

            if (token) {
                const pureToken = token.startsWith('Bearer ') ? token.substring(7) : token;
                localStorage.setItem('accessToken', pureToken);
                localStorage.setItem('username', username);

                // ✅ 확실한 페이지 전환을 위해 location.assign 사용
                window.location.assign('/main');
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

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Poppins', sans-serif",
    },
    navBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        padding: '30px 40px',
        boxSizing: 'border-box',
        zIndex: 10,
    },
    backButton: {
        backgroundColor: 'transparent',
        border: 'none',
        fontSize: '16px',
        cursor: 'pointer',
        color: '#333',
        fontWeight: '500',
    },
    formCard: {
        padding: '60px 50px',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '460px',
        boxSizing: 'border-box',
        textAlign: 'center',
        animation: 'fadeInUp 0.8s ease-out forwards',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
    },
    header: { marginBottom: '50px' },
    title: {
        margin: '0 0 10px 0',
        color: '#1a1a1a',
        fontWeight: '700',
        fontSize: '34px',
        letterSpacing: '-1.5px',
        transform: 'translateZ(30px)',
    },
    subtitle: {
        margin: 0,
        color: '#888',
        fontSize: '16px',
        transform: 'translateZ(20px)',
    },
    form: { display: 'flex', flexDirection: 'column' },
    inputGroup: {
        marginBottom: '35px',
        position: 'relative',
        transform: 'translateZ(15px)',
    },
    underlineInput: {
        width: '100%',
        padding: '12px 0',
        border: 'none',
        borderBottom: '2px solid #eaeaea',
        backgroundColor: 'transparent',
        fontSize: '16px',
        color: '#333',
        transition: 'all 0.3s',
        outline: 'none',
    },
    inputHighlight: {
        position: 'absolute',
        bottom: 0,
        left: '50%',
        width: '0%',
        height: '2px',
        backgroundColor: '#1a1a1a',
        transition: 'all 0.4s ease',
    },
    btnWrapper: {
        marginTop: '20px',
        perspective: '1000px',
    },
    dynamicButton: {
        width: '100%',
        padding: '18px',
        backgroundColor: '#1a1a1a',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '17px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        transition: 'box-shadow 0.3s',
        willChange: 'transform',
    },
    footer: {
        marginTop: '40px',
        fontSize: '15px',
        transform: 'translateZ(10px)',
    },
    footerText: { color: '#888' },
    link: {
        color: '#1a1a1a',
        textDecoration: 'none',
        fontWeight: '600',
        marginLeft: '8px',
    },
};

export default LoginPage;