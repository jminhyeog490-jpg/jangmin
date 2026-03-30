import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SignUpPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    const navigate = useNavigate();

    const handleSendVerification = async () => {
        if (!email) { alert("이메일을 입력해주세요."); return; }
        try {
            await axios.post(`http://52.79.237.156:8090/api/auth/email-send?email=${email}`);
            alert("인증번호가 전송되었습니다.");
            setIsEmailSent(true);
        } catch (error) {
            alert("이메일 전송에 실패했습니다.");
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode) { alert("인증번호를 입력해주세요."); return; }
        try {
            await axios.post(`http://52.79.237.156:8090/api/auth/email-verify?email=${email}&code=${verificationCode}`);
            alert("인증 성공!");
            setIsEmailVerified(true);
        } catch (error) {
            alert("인증번호가 일치하지 않습니다.");
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!isEmailVerified) { alert("이메일 인증을 완료해주세요."); return; }

        try {
            const response = await axios.post('http://52.79.237.156:8090/api/users/signup', {
                username, password, nickname, email,
                authCode: "VERIFIED_USER"
            });
            if (response.status === 200 || response.status === 201) {
                alert('가입을 축하합니다!');
                navigate('/login');
            }
        } catch (error) {
            alert('회원가입 중 오류가 발생했습니다.');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formCard}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Create Account</h2>
                    <p style={styles.subtitle}>간편한 가입으로 서비스를 시작해보세요.</p>
                </div>

                <form onSubmit={handleSignUp} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>아이디</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={styles.input}
                            placeholder="4~20자 이내"
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>비밀번호</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            placeholder="안전한 비밀번호"
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>닉네임</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            style={styles.input}
                            placeholder="활동할 이름"
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>이메일 주소</label>
                        <div style={styles.row}>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ ...styles.input, flex: 1 }}
                                placeholder="example@mail.com"
                                disabled={isEmailVerified}
                                required
                            />
                            <button
                                type="button"
                                onClick={handleSendVerification}
                                disabled={isEmailVerified}
                                style={isEmailVerified ? styles.verifiedBtn : styles.actionBtn}
                            >
                                {isEmailVerified ? "✓" : "인증"}
                            </button>
                        </div>
                    </div>

                    {/* 인증번호 입력 필드 - 조건부 렌더링 애니메이션 */}
                    {isEmailSent && !isEmailVerified && (
                        <div style={{...styles.inputGroup, animation: 'slideDown 0.4s ease'}}>
                            <label style={styles.label}>인증번호 확인</label>
                            <div style={styles.row}>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    style={{ ...styles.input, flex: 1 }}
                                    placeholder="6자리 숫자"
                                />
                                <button type="button" onClick={handleVerifyCode} style={styles.confirmBtn}>확인</button>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!isEmailVerified}
                        style={{
                            ...styles.submitBtn,
                            backgroundColor: isEmailVerified ? '#1a1a1a' : '#eaeaea',
                            cursor: isEmailVerified ? 'pointer' : 'not-allowed',
                            transform: isEmailVerified ? 'translateY(0)' : 'none',
                            boxShadow: isEmailVerified ? '0 10px 20px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        가입 완료
                    </button>
                </form>

                <div style={styles.footer}>
                    <span style={styles.footerText}>이미 회원이신가요?</span>
                    <Link to="/login" style={styles.link}>로그인</Link>
                </div>
            </div>

            <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                input:focus { outline: none; border-color: #1a1a1a !important; background-color: #fff !important; }
                button:active { transform: scale(0.96); }
            `}</style>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: '-apple-system, sans-serif'
    },
    formCard: {
        width: '100%', maxWidth: '420px', padding: '50px 30px',
        backgroundColor: '#ffffff', borderRadius: '24px',
        boxShadow: '0 15px 50px rgba(0,0,0,0.05)', textAlign: 'center'
    },
    header: { marginBottom: '40px' },
    title: { fontSize: '28px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-1px', margin: '0 0 10px 0' },
    subtitle: { fontSize: '15px', color: '#888', margin: 0 },
    form: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
    inputGroup: { marginBottom: '20px' },
    label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#444' },
    input: {
        width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #f0f0f0',
        backgroundColor: '#f9f9f9', fontSize: '15px', transition: 'all 0.2s', boxSizing: 'border-box'
    },
    row: { display: 'flex', gap: '8px' },
    actionBtn: {
        padding: '0 18px', backgroundColor: '#1a1a1a', color: '#fff', border: 'none',
        borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
    },
    verifiedBtn: {
        padding: '0 18px', backgroundColor: '#e8f5e9', color: '#2e7d32', border: 'none',
        borderRadius: '12px', fontWeight: 'bold', fontSize: '18px'
    },
    confirmBtn: {
        padding: '0 18px', backgroundColor: '#fff', color: '#1a1a1a', border: '1px solid #1a1a1a',
        borderRadius: '12px', fontWeight: '600', cursor: 'pointer'
    },
    submitBtn: {
        marginTop: '20px', padding: '18px', border: 'none', borderRadius: '14px',
        color: '#fff', fontSize: '16px', fontWeight: '700', transition: 'all 0.3s'
    },
    footer: { marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #f5f5f5' },
    footerText: { color: '#999', fontSize: '14px' },
    link: { color: '#1a1a1a', fontWeight: '700', textDecoration: 'none', marginLeft: '8px', fontSize: '14px' }
};

export default SignUpPage;