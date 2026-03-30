import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// ✅ Axios 인터셉터: 모든 요청에 로컬 스토리지의 토큰을 자동으로 포함
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    // 백엔드 Spring Security 설정에 맞춰 Bearer 접두사 추가
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function MainPage() {
  const SERVER_URL = "http://52.79.237.156:8090";
  const navigate = useNavigate();

  const [currentPos, setCurrentPos] = useState({ lat: 36.9103, lon: 127.1332 });
  const [mapObj, setMapObj] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedLandmarks, setSavedLandmarks] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    // 1️⃣ 로그인 체크: 토큰이 없으면 즉시 로그인 페이지로 강제 이동
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요한 서비스입니다.");
      navigate('/login', { replace: true });
      return;
    }

    // 2️⃣ 카카오맵 초기화
    const container = document.getElementById('map');
    const options = {
      center: new window.kakao.maps.LatLng(currentPos.lat, currentPos.lon),
      level: 3
    };
    const kakaoMap = new window.kakao.maps.Map(container, options);
    setMapObj(kakaoMap);

    // 3️⃣ 현재 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        setCurrentPos({ lat, lon });
        const myLoc = new window.kakao.maps.LatLng(lat, lon);
        kakaoMap.setCenter(myLoc);
        new window.kakao.maps.Marker({ map: kakaoMap, position: myLoc });
      });
    }
  }, [navigate]); // navigate 의존성 추가

  // 내 목록 불러오기
  const fetchAndShowSavedLandmarks = async () => {
    try {
      const response = await axios.get(`${SERVER_URL}/api/v1/landmarks`);
      setSavedLandmarks(response.data);
      setIsSidebarOpen(true);
      setAiResult(null);

      markers.forEach(m => m.setMap(null));
      const newMarkers = response.data.map(place => {
        const pos = new window.kakao.maps.LatLng(place.latitude, place.longitude);
        return new window.kakao.maps.Marker({ map: mapObj, position: pos, title: place.name });
      });
      setMarkers(newMarkers);
    } catch (error) {
      // 토큰 만료 등의 사유로 401/403 에러 발생 시 처리
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.clear();
        navigate('/login');
      } else {
        alert("목록을 불러오지 못했습니다.");
      }
    }
  };

  // AI 추천 받기
  const handleAIRecommendation = () => {
    if (isLoading) return;
    setIsLoading(true);
    setIsSidebarOpen(true);

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch('관광명소', async (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const placeDetails = data.slice(0, 5).map(p => `- ${p.place_name}`).join("\n");
        try {
          const res = await axios.post(`${SERVER_URL}/api/v1/ai/recommend`, {
            places: placeDetails,
            userQuery: "주변 명소를 추천해줘"
          });
          setAiResult(res.data.answer);
        } catch {
          setAiResult("AI 추천을 가져오는데 실패했습니다.");
        } finally {
          setIsLoading(false);
        }
      }
    }, { location: new window.kakao.maps.LatLng(currentPos.lat, currentPos.lon), radius: 2000 });
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await axios.post(`${SERVER_URL}/api/auth/logout`);
    } catch (e) {
      console.error("Logout request failed", e);
    } finally {
      localStorage.clear(); // 토큰 및 유저 정보 삭제
      navigate("/login");
    }
  };

  return (
    <div style={styles.container}>
      <div id="map" style={styles.map}></div>

      {/* 상단 액션바 */}
      <div style={styles.topOverlay}>
        <button onClick={() => navigate(-1)} style={styles.circleBtn}>‹</button>
        <div style={styles.searchBar}>
          <input placeholder="어디로 떠나볼까요?" style={styles.searchInput} />
          <button onClick={handleAIRecommendation} style={styles.aiBtn}>
            {isLoading ? "분석중..." : "AI 추천"}
          </button>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>Log out</button>
      </div>

      {/* 우측 컨트롤러 */}
      <div style={styles.rightControls}>
        <button onClick={() => alert('현재 위치로 이동')} style={styles.sideControlBtn}>🎯</button>
        <button onClick={() => {}} style={styles.sideControlBtn}>+</button>
        <button onClick={() => {}} style={styles.sideControlBtn}>-</button>
      </div>

      {/* 하단 플로팅 메뉴 */}
      <div style={styles.bottomNav}>
        <button onClick={() => {}} style={styles.navItem}>📍 장소저장</button>
        <button onClick={fetchAndShowSavedLandmarks} style={styles.navItem}>📂 내 목록</button>
      </div>

      {/* 사이드 패널 */}
      <div style={{...styles.sidePanel, transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)'}}>
        <button onClick={() => setIsSidebarOpen(false)} style={styles.closePanelBtn}>×</button>
        <div style={styles.panelContent}>
          {isLoading ? (
            <div style={styles.loadingSkeleton}>AI가 명소를 분석하고 있습니다...</div>
          ) : (
            <>
              {aiResult && (
                <div>
                  <h3 style={styles.panelTitle}>AI 추천 리포트</h3>
                  <div style={styles.aiText}>{aiResult}</div>
                </div>
              )}
              {savedLandmarks.length > 0 && !aiResult && (
                <div>
                  <h3 style={styles.panelTitle}>저장된 장소</h3>
                  {savedLandmarks.map((item, idx) => (
                    <div key={idx} style={styles.landmarkItem}>
                      <strong>{item.name}</strong>
                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ... 스타일 정의는 동일하게 유지 ...
const styles = {
  container: { width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#fff' },
  map: { width: '100%', height: '100%', zIndex: 1 },
  topOverlay: { position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '15px', zIndex: 10 },
  circleBtn: { width: '45px', height: '45px', borderRadius: '50%', border: 'none', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  searchBar: { flex: 1, height: '50px', backgroundColor: '#fff', borderRadius: '25px', display: 'flex', alignItems: 'center', padding: '0 5px 0 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', maxWidth: '500px' },
  searchInput: { border: 'none', flex: 1, outline: 'none', fontSize: '16px', color: '#333' },
  aiBtn: { height: '40px', padding: '0 20px', borderRadius: '20px', border: 'none', background: 'linear-gradient(135deg, #007bff, #00c6ff)', color: '#fff', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
  logoutBtn: { padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: 'rgba(255,255,255,0.9)', color: '#666', fontWeight: '500', cursor: 'pointer' },
  rightControls: { position: 'absolute', right: '20px', top: '100px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 10 },
  sideControlBtn: { width: '40px', height: '40px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontSize: '18px' },
  bottomNav: { position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', zIndex: 10 },
  navItem: { padding: '12px 24px', borderRadius: '30px', border: 'none', backgroundColor: '#1a1a1a', color: '#fff', fontWeight: '600', boxShadow: '0 8px 20px rgba(0,0,0,0.2)', cursor: 'pointer', transition: 'transform 0.2s' },
  sidePanel: { position: 'absolute', top: 0, left: 0, width: '350px', height: '100%', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', boxShadow: '4px 0 20px rgba(0,0,0,0.1)', zIndex: 20, transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)', padding: '60px 25px 25px' },
  closePanelBtn: { position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'none', fontSize: '28px', cursor: 'pointer', color: '#999' },
  panelTitle: { fontSize: '22px', fontWeight: '700', marginBottom: '20px', color: '#1a1a1a' },
  aiText: { lineHeight: '1.6', color: '#444', whiteSpace: 'pre-wrap', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '12px' },
  landmarkItem: { padding: '15px', borderBottom: '1px solid #eee', marginBottom: '10px' },
  loadingSkeleton: { textAlign: 'center', marginTop: '50px', color: '#007bff', fontWeight: '600', animation: 'pulse 1.5s infinite' }
};

export default MainPage;