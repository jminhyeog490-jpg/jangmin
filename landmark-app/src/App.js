import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import MainPage from './pages/MainPage';
import BoardPage from './pages/BoardPage';
import ChatPage from './pages/ChatPage';

// 로그인 여부를 확인하는 간단한 함수
const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
};

// 로그인이 필요한 페이지를 감싸는 컴포넌트
const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
};

// 로그인하면 접근할 수 없는 페이지를 감싸는 컴포넌트
const PublicRoute = ({ children }) => {
    return !isAuthenticated() ? children : <Navigate to="/main" />;
};

function App() {
    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login'; // 새로고침하며 이동
    };

    return (
        <Router>
            <Header isAuthenticated={isAuthenticated()} onLogout={handleLogout} />
            <Routes>
                {/* 로그인/회원가입 경로는 로그인 안 한 사용자만 접근 가능 */}
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />

                {/* 메인, 게시판, 채팅 경로는 로그인한 사용자만 접근 가능 */}
                <Route path="/main" element={<PrivateRoute><MainPage /></PrivateRoute>} />
                <Route path="/board" element={<PrivateRoute><BoardPage /></PrivateRoute>} />
                <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />

                {/* 기본 경로는 로그인 상태에 따라 리다이렉트 */}
                <Route path="/" element={<Navigate to={isAuthenticated() ? "/main" : "/login"} />} />

                {/* 일치하는 경로가 없을 때 */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

// 모든 페이지 상단에 표시될 헤더
const Header = ({ isAuthenticated, onLogout }) => {
    // MainPage에는 자체 헤더가 있으므로 렌더링하지 않음
    const location = window.location.pathname;
    if (location === '/main') {
        return null;
    }

    return (
        <nav style={styles.header}>
            <Link to="/" style={styles.logo}>Jangmin App</Link>
            <div>
                {isAuthenticated ? (
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
    logo: {
        fontWeight: 'bold',
        fontSize: '20px',
        color: '#333',
        textDecoration: 'none',
    },
    navLink: {
        marginLeft: '20px',
        textDecoration: 'none',
        color: '#555',
        fontWeight: '500',
    },
    logoutButton: {
        marginLeft: '20px',
        padding: '8px 15px',
        backgroundColor: '#ff4d4f',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    }
};

export default App;