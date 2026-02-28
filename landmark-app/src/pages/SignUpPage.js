import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SignUpPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');

    // 이메일 인증 관련 상태
    const [verificationCode, setVerificationCode] = useState('');
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    const navigate = useNavigate();

    // 1. 이메일 인증번호 전송
    const handleSendVerification = async () => {
        if (!email) {
            alert("이메일을 입력해주세요.");
            return;
        }
        try {
            // 백엔드 API 호출 (POST /api/auth/email-send?email=...)
            await axios.post(`http://localhost:8090/api/auth/email-send?email=${email}`);
            alert("인증번호가 이메일로 전송되었습니다. 확인해주세요.");
            setIsEmailSent(true);
        } catch (error) {
            console.error("이메일 전송 실패:", error);
            alert("이메일 전송에 실패했습니다. 이메일 주소를 확인해주세요.");
        }
    };

    // 2. 이메일 인증번호 확인
    const handleVerifyCode = async () => {
        if (!verificationCode) {
            alert("인증번호를 입력해주세요.");
            return;
        }
        try {
            // 백엔드 API 호출 (POST /api/auth/email-verify?email=...&code=...)
            await axios.post(`http://localhost:8090/api/auth/email-verify?email=${email}&code=${verificationCode}`);
            alert("이메일 인증이 완료되었습니다!");
            setIsEmailVerified(true);
        } catch (error) {
            console.error("인증 실패:", error);
            alert("인증번호가 일치하지 않거나 만료되었습니다.");
        }
    };

    // 3. 회원가입 요청
    const handleSignUp = async (e) => {
        e.preventDefault();

        if (!isEmailVerified) {
            alert("이메일 인증을 먼저 완료해주세요.");
            return;
        }

        // 유효성 검사
        if (username.length < 4 || username.length > 20) {
            alert("아이디는 4~20자 사이여야 합니다.");
            return;
        }
        if (nickname.length < 4 || nickname.length > 20) {
            alert("닉네임은 4~20자 사이여야 합니다.");
            return;
        }

        try {
            const response = await axios.post('http://localhost:8090/api/users/signup', {
                username: username,
                password: password,
                nickname: nickname,
                email: email,
                authCode: "VERIFIED_USER" // 인증 완료된 사용자임을 표시 (백엔드 로직에 따라 수정 필요할 수 있음)
            });

            if (response.status === 200 || response.status === 201) {
                alert('회원가입이 완료되었습니다! 로그인해주세요.');
                navigate('/login');
            }
        } catch (error) {
            console.error('회원가입 실패:', error);
            if (error.response) {
                if (error.response.data && error.response.data.errors) {
                     const errorMsg = Object.values(error.response.data.errors).join('\n');
                     alert(`회원가입 실패:\n${errorMsg}`);
                } else {
                    alert(`회원가입 실패: ${error.response.data.message || error.response.data || '오류가 발생했습니다.'}`);
                }
            } else {
                alert('서버와 연결할 수 없습니다.');
            }
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formContainer}>
                <h2 style={styles.title}>회원가입</h2>
                <form onSubmit={handleSignUp}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="username" style={styles.label}>아이디 (4~20자)</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={styles.input}
                            required
                            minLength={4}
                            maxLength={20}
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
                            required
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="nickname" style={styles.label}>닉네임 (4~20자)</label>
                        <input
                            type="text"
                            id="nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            style={styles.input}
                            required
                            minLength={4}
                            maxLength={20}
                        />
                    </div>

                    {/* 이메일 입력 및 인증 버튼 */}
                    <div style={styles.inputGroup}>
                        <label htmlFor="email" style={styles.label}>이메일</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ ...styles.input, flex: 1 }}
                                required
                                disabled={isEmailVerified} // 인증 완료 시 수정 불가
                            />
                            <button
                                type="button"
                                onClick={handleSendVerification}
                                disabled={isEmailVerified}
                                style={{ ...styles.smallButton, backgroundColor: isEmailVerified ? '#ccc' : '#4285F4' }}
                            >
                                {isEmailVerified ? "인증됨" : "인증번호 전송"}
                            </button>
                        </div>
                    </div>

                    {/* 인증번호 입력 (이메일 전송 후 표시) */}
                    {isEmailSent && !isEmailVerified && (
                        <div style={styles.inputGroup}>
                            <label htmlFor="verificationCode" style={styles.label}>인증번호</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    id="verificationCode"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    style={{ ...styles.input, flex: 1 }}
                                    placeholder="인증번호 6자리"
                                />
                                <button
                                    type="button"
                                    onClick={handleVerifyCode}
                                    style={styles.smallButton}
                                >
                                    확인
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        style={{ ...styles.button, backgroundColor: isEmailVerified ? '#4285F4' : '#ccc', cursor: isEmailVerified ? 'pointer' : 'not-allowed' }}
                        disabled={!isEmailVerified}
                    >
                        가입하기
                    </button>
                </form>
                <div style={styles.footer}>
                    <p>이미 계정이 있으신가요? <Link to="/login" style={styles.link}>로그인</Link></p>
                </div>
            </div>
        </div>
    );
};

// 스타일 정의
const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f0f2f5',
    },
    formContainer: {
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
    },
    title: {
        marginBottom: '24px',
        color: '#333',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '24px',
    },
    inputGroup: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        color: '#555',
        fontWeight: '500',
    },
    input: {
        width: '100%',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '16px',
        boxSizing: 'border-box',
    },
    button: {
        width: '100%',
        padding: '14px',
        backgroundColor: '#4285F4',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px',
        transition: 'background-color 0.2s',
    },
    smallButton: {
        padding: '0 15px',
        backgroundColor: '#4285F4',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },
    footer: {
        marginTop: '20px',
        textAlign: 'center',
        color: '#777',
        fontSize: '14px',
    },
    link: {
        color: '#4285F4',
        textDecoration: 'none',
        fontWeight: 'bold',
    },
};

export default SignUpPage;