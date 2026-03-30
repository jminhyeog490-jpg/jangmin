import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import VanillaTilt from 'vanilla-tilt'; // ✅ 역동적인 3D 효과를 위한 라이브러리

// ✅ axios 인터셉터 설정 (유지)
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

    // ✅ DOM 요소 접근을 위한 Ref
    const cardRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            navigate('/main');
        }

        // ✅ 1. 마우스 틸트 효과 적용 (입체감)
        if (cardRef.current) {
            VanillaTilt.init(cardRef.current, {
                max: 5,        // 최대 기울기 각도
                speed: 1000,   // 연결 속도
                glare: true,   // 은은한 반사광 효과
                "max-glare": 0.2,
                gyroscope: true // 모바일 대응
            });
        }

        // ✅ 2. 마그네틱 버튼 효과 (hover 시 마우스 따라가기)
        const handleMouseMove = (e) => {
            if (!buttonRef.current) return;
            const btn = buttonRef.current;
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // 버튼 내용물만 움직여서 마그네틱 효과 연출
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

        // 클린업 함수
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
        try {
            const response = await axios.post('http://52.79.237.156:8090/api/auth/login', {
                username: username,
                password: password,
            });
            let token = response.headers['authorization'] || response.data.accessToken;
            if (token) {
                localStorage.setItem('accessToken', token.startsWith('Bearer ') ? token.substring(7) : token);
                localStorage.setItem('username', username);
                navigate('/main');
            }
        } catch (error) {
            alert("정보를 다시 확인해주세요.");
        }
    };

    return (
        <div style={styles.container}>
            {/* 상단 네비게이션 */}
            <div style={styles.navBar}>
                <button onClick={handleBack} style={styles.backButton}>‹ Back</button>
            </div>

            {/* ✅ 3D 틸트 효과가 적용된 카드 (ref 연결) */}
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
                        {/* ✅ 역동적인 언더라인 애니메이션 */}
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

                    {/* ✅ 마그네틱 효과가 적용된 버튼 (ref 연결) */}
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

            {/* ✅ CSS 애니메이션 정의 (Keyframes) */}
            <style>
                {`
                    /* 페이지 로드 애니메이션 */
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    /* 입력창 포커스 애니메이션 */
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

// 💎 스타일 정의 (깔끔 & 역동적)
const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#ffffff', // ✅ 흰색 배경 유지
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
        transition: 'all 0.3s',
    },
    formCard: {
        padding: '60px 50px',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        // ✅ 더 부드럽고 몽환적인 그림자 (깔끔함 강조)
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '460px',
        boxSizing: 'border-box',
        textAlign: 'center',
        // ✅ 로드 애니메이션 적용
        animation: 'fadeInUp 0.8s ease-out forwards',
        transformStyle: 'preserve-3d', // 3D 효과 필수
        willChange: 'transform',
    },
    header: { marginBottom: '50px' },
    title: {
        margin: '0 0 10px 0',
        color: '#1a1a1a',
        fontWeight: '700',
        fontSize: '34px',
        letterSpacing: '-1.5px',
        transform: 'translateZ(30px)', // 입체감 부여
    },
    subtitle: {
        margin: 0,
        color: '#888',
        fontSize: '16px',
        fontWeight: '400',
        transform: 'translateZ(20px)',
    },
    form: { display: 'flex', flexDirection: 'column' },
    inputGroup: {
        marginBottom: '35px',
        position: 'relative', // 하이라이트 위치용
        transform: 'translateZ(15px)',
    },
    // ✅ 세련된 언더라인 스타일 입력창
    underlineInput: {
        width: '100%',
        padding: '12px 0',
        border: 'none',
        borderBottom: '2px solid #eaeaea',
        backgroundColor: 'transparent',
        fontSize: '16px',
        color: '#333',
        transition: 'all 0.3s',
        boxSizing: 'border-box',
    },
    // ✅ 포커스 시 퍼져나가는 라인
    inputHighlight: {
        position: 'absolute',
        bottom: 0,
        left: '50%', // 중앙에서 시작
        width: '0%', // 처음엔 안보임
        height: '2px',
        backgroundColor: '#1a1a1a', // 시크한 블랙 포인트
        transition: 'all 0.4s ease',
    },
    btnWrapper: {
        marginTop: '20px',
        perspective: '1000px', // 버튼 입체감용
    },
    // ✅ 역동적인 블랙 버튼
    dynamicButton: {
        width: '100%',
        padding: '18px',
        backgroundColor: '#1a1a1a', // 깔끔한 블랙
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '17px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        transition: 'transform 0.1s ease-out, box-shadow 0.3s', // transform은 스크립트가 제어
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