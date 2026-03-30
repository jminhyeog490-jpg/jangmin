import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// ✅ Axios 설정 (기존 로직 유지)
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken"); // 키값 확인 필요 (LoginPage와 통일)
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
    const container = document.getElementById('map');
    const options = {
      center: new window.kakao.maps.LatLng(currentPos.lat, currentPos.lon),
      level: 3
    };
    const kakaoMap = new window.kakao.maps.Map(container, options);
    setMapObj(kakaoMap);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        setCurrentPos({ lat, lon });
        const myLoc = new window.kakao.maps.LatLng(lat, lon);
        kakaoMap.setCenter(myLoc);
        new window.kakao.maps.Marker({ map: kakaoMap, position: myLoc });
      });
    }
  }, []);

  const fetchAndShowSavedLandmarks = async () => {
    try {
      const response = await axios.get(`${SERVER_URL}/api/v1/landmarks`);
      setSavedLandmarks(response.data);
      setIsSidebarOpen(true);
      setAiResult(null); // AI 결과창과 분리

      markers.forEach(m => m.setMap(null));
      const newMarkers = response.data.map(place => {
        const pos = new window.kakao.maps.LatLng(place.latitude, place.longitude);
        return new window.kakao.maps.Marker({ map: mapObj, position: pos, title: place.name });
      });
      setMarkers(newMarkers);
    } catch {
      alert("목록을 불러오지 못했습니다.");
    }
  };

  const handleAIRecommendation = () => {
    if (isLoading) return;
    setIsLoading(true);
    setIsSidebarOpen(true); // 결과창 보여주기 위해 사이드바 오픈

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

  const handleLogout = async () => {
    try { await axios.post(`${SERVER_URL}/api/auth/logout`); }
    finally { localStorage.clear(); navigate("/login"); }
  };

  return (
    <div style={styles.container}>
      {/* 맵 배경 */}
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

      {/* 사이드 패널 (결과 창) */}
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

const styles = {
  container: { width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#fff' },
  map: { width: '100%', height: '100%', zIndex: 1 },

  // 상단 레이아웃
  topOverlay: {
    position: 'absolute', top: '20px', left: '20px', right: '20px',
    display: 'flex', alignItems: 'center', gap: '15px', zIndex: 10
  },
  circleBtn: {
    width: '45px', height: '45px', borderRadius: '50%', border: 'none',
    backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    fontSize: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  searchBar: {
    flex: 1, height: '50px', backgroundColor: '#fff', borderRadius: '25px',
    display: 'flex', alignItems: 'center', padding: '0 5px 0 20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)', maxWidth: '500px'
  },
  searchInput: { border: 'none', flex: 1, outline: 'none', fontSize: '16px', color: '#333' },
  aiBtn: {
    height: '40px', padding: '0 20px', borderRadius: '20px', border: 'none',
    background: 'linear-gradient(135deg, #007bff, #00c6ff)', color: '#fff',
    fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s'
  },
  logoutBtn: {
    padding: '10px 20px', borderRadius: '10px', border: 'none',
    backgroundColor: 'rgba(255,255,255,0.9)', color: '#666', fontWeight: '500', cursor: 'pointer'
  },

  // 우측 컨트롤
  rightControls: {
    position: 'absolute', right: '20px', top: '100px',
    display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 10
  },
  sideControlBtn: {
    width: '40px', height: '40px', backgroundColor: '#fff', border: '1px solid #eee',
    borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontSize: '18px'
  },

  // 하단 네비
  bottomNav: {
    position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: '12px', zIndex: 10
  },
  navItem: {
    padding: '12px 24px', borderRadius: '30px', border: 'none',
    backgroundColor: '#1a1a1a', color: '#fff', fontWeight: '600',
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)', cursor: 'pointer', transition: 'transform 0.2s'
  },

  // 사이드 패널
  sidePanel: {
    position: 'absolute', top: 0, left: 0, width: '350px', height: '100%',
    backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
    boxShadow: '4px 0 20px rgba(0,0,0,0.1)', zIndex: 20,
    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)', padding: '60px 25px 25px'
  },
  closePanelBtn: {
    position: 'absolute', top: '20px', right: '20px', border: 'none',
    background: 'none', fontSize: '28px', cursor: 'pointer', color: '#999'
  },
  panelTitle: { fontSize: '22px', fontWeight: '700', marginBottom: '20px', color: '#1a1a1a' },
  aiText: { lineHeight: '1.6', color: '#444', whiteSpace: 'pre-wrap', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '12px' },
  landmarkItem: {
    padding: '15px', borderBottom: '1px solid #eee', marginBottom: '10px'
  },
  loadingSkeleton: {
    textAlign: 'center', marginTop: '50px', color: '#007bff',
    fontWeight: '600', animation: 'pulse 1.5s infinite'
  }
};

export default MainPage;