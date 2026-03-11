import axios from 'axios';

// Axios 인스턴스 생성
const apiClient = axios.create({
    baseURL: 'http://localhost:8090',
     'https:https://master.d20nn13pyj5sjm.amplifyapp.com
});

// 요청 인터셉터 (Request Interceptor)
apiClient.interceptors.request.use(
    (config) => {
        // localStorage에서 토큰 가져오기
        const token = localStorage.getItem('token');

        // 토큰이 있으면 헤더에 추가
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        // 요청 에러 처리
        return Promise.reject(error);
    }
);

// 응답 인터셉터 (Response Interceptor) - 401 (Unauthorized) 에러 처리
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // 토큰이 유효하지 않거나 만료된 경우
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            alert('세션이 만료되었습니다. 다시 로그인해주세요.');
            window.location.href = '/login'; // 로그인 페이지로 리다이렉트
        }
        return Promise.reject(error);
    }
);

export default apiClient;