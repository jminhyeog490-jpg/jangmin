import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://52.79.237.156:8090',
});

// ✅ 요청 인터셉터
apiClient.interceptors.request.use(
    (config) => {
        // 🔥 accessToken 하나만 사용 (중요)
        const token = localStorage.getItem('accessToken');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log("🚀 [API Request] 토큰 포함 전송됨");
        } else {
            console.warn("⚠️ [API Request] 토큰 없음");
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ 응답 인터셉터
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.error("❌ [API Error] 인증 실패:", error.response.status);

            // 🔥 accessToken 기준으로만 삭제
            localStorage.removeItem('accessToken');
            localStorage.removeItem('username');

            alert('세션이 만료되었습니다. 다시 로그인해주세요.');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;