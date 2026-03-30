import axios from 'axios';

const apiClient = axios.create({
    // 민혁님의 AWS 인스턴스 주소
    baseURL: 'http://52.79.237.156:8090',
});

// 요청 인터셉터: 모든 API 요청 직전에 토큰을 장착함
apiClient.interceptors.request.use(
    (config) => {
        // 💡 중요: 로그인 시 'accessToken'으로 저장했는지 'token'으로 했는지 확인하세요!
        // 둘 다 대응하도록 작성했습니다.
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            // 개발자 도구(F12) 콘솔에서 토큰이 나가는지 확인용
            console.log("🚀 [API Request] 토큰 포함 전송됨");
        } else {
            console.warn("⚠️ [API Request] 전송할 토큰이 없습니다!");
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터: 서버의 응답을 가로채서 에러 처리
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // 401(인증 없음) 또는 403(권한 없음/토큰 만료) 처리
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.error("❌ [API Error] 인증 실패:", error.response.status);

            // 저장된 모든 인증 정보 삭제
            localStorage.removeItem('token');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('username');

            alert('세션이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;