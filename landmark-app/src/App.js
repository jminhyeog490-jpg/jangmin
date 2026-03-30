import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import MainPage from './pages/MainPage';
import BoardPage from './pages/BoardPage';
import ChatPage from './pages/ChatPage';

// ✅ 로그인 여부 확인: 키 이름을 'accessToken'으로 통일
const isAuthenticated = () => {
    return localStorage.getItem('accessToken') !== null;
};

// 로그인이 필요한 페이지 보호
const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

// 로그인된 사용자는 접근 불가 (로그인/회원가입 페이지)
const PublicRoute = ({ children }) => {
    return !isAuthenticated() ? children : <Navigate to="/main" replace />;
};

function App() {
    const handleLogout = () => {
        // ✅ 로그아웃 시 모든 인증 정보 삭제
        localStorage.removeItem('accessToken');
        localStorage.removeItem('username');
        window.location.href = '/login';
    };

    return (
        <Router>
            {/* Header를 Router 안으로 넣어 useLocation을 사용할 수 있게 함 */}
            <Header onLogout={handleLogout} />
            <Routes>
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />

                <Route path="/main" element={<PrivateRoute><MainPage /></PrivateRoute>} />
                <Route path="/board" element={<PrivateRoute><BoardPage /></PrivateRoute>} />
                <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />

                <Route path="/" element={<Navigate to={isAuthenticated() ? "/main" : "/login"} replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

// 상단 헤더 컴포넌트
const Header = ({ onLogout }) => {
    const location = useLocation(); // ✅ 경로 변경을 실시간으로 감지
    const isAuth = isAuthenticated();

    // MainPage(/main)는 자체 디자인이 있으므로 헤더를 숨김
    if (location.pathname === '/main') {
        return null;
    }

    return (
        <nav style={styles.header}>
            <Link to="/" style={styles.logo}>Jangmin App</Link>
            <div>
                {isAuth ? (
                    <>
                        <Link to="/main" style={styles.navLink}>지도</Link>
                        <Link to="/board" style={styles.navLink}>게시판</Link>
                        <Link to="/chat" style={styles.navLink}>채팅</Link>
                        <button onClick={onLogout} style={styles.logoutButton}>로그아웃</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={styles.navLink}>로그인</Link>
                        <Link to="/signup" style={styles.navLink}>회원가입</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

const styles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 20px',
        height: '60px',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
    },
    logo: { fontWeight: 'bold', fontSize: '20px', color: '#333', textDecoration: 'none' },
    navLink: { marginLeft: '20px', textDecoration: 'none', color: '#555', fontWeight: '500' },
    logoutButton: { marginLeft: '20px', padding: '8px 15px', backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default App;