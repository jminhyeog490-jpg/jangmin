import axios from 'axios';

// Axios 인스턴스 생성
const apiClient = axios.create({
    // 지금 사용 중인 AWS 퍼블릭 IP와 백엔드 포트(8090)를 적습니다.
    baseURL: 'http://52.79.237.156:8090'
});

// 요청 인터셉터 (Request Interceptor)
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터 (Response Interceptor) - 401 에러 처리
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            alert('세션이 만료되었습니다. 다시 로그인해주세요.');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;