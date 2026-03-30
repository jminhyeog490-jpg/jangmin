import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// ✅ Axios 인터셉터 설정
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
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
  const [recommendedPlaces, setRecommendedPlaces] = useState([]); // ✅ 내 목록 -> 추천 목록으로 변경
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [markers, setMarkers] = useState([]);

  const initMap = useCallback((lat, lon) => {
    const container = document.getElementById('map');
    if (!container) return;

    window.kakao.maps.load(() => {
      const options = {
        center: new window.kakao.maps.LatLng(lat, lon),
        level: 3
      };
      const kakaoMap = new window.kakao.maps.Map(container, options);
      setMapObj(kakaoMap);

      new window.kakao.maps.Marker({
        map: kakaoMap,
        position: new window.kakao.maps.LatLng(lat, lon)
      });
    });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요한 서비스입니다.");
      navigate('/login', { replace: true });
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lon } = position.coords;
          setCurrentPos({ lat, lon });
          initMap(lat, lon);
        },
        () => initMap(36.9103, 127.1332)
      );
    } else {
      initMap(36.9103, 127.1332);
    }
  }, [initMap, navigate]);

  // ✅ 추천 장소 목록 불러오기 (기존 내 목록 로직 활용)
  const fetchRecommendedPlaces = async () => {
    if (!mapObj) return;
    try {
      // 기존 API 엔드포인트를 사용하되 상태 저장소 이름을 변경함
      const response = await axios.get(`${SERVER_URL}/api/v1/landmarks`);
      setRecommendedPlaces(response.data);
      setIsSidebarOpen(true);
      setAiResult(null);

      markers.forEach(m => m.setMap(null));
      const newMarkers = response.data.map(place => {
        const pos = new window.kakao.maps.LatLng(place.latitude, place.longitude);
        return new window.kakao.maps.Marker({ map: mapObj, position: pos, title: place.name });
      });
      setMarkers(newMarkers);
    } catch (error) {
      alert("추천 목록을 불러오지 못했습니다.");
    }
  };

  const handleAIRecommendation = () => {
    if (isLoading || !mapObj) return;
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
          setAiResult("AI 분석에 실패했습니다.");
        } finally {
          setIsLoading(false);
        }
      }
    }, { location: new window.kakao.maps.LatLng(currentPos.lat, currentPos.lon), radius: 2000 });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // ✅ 카카오 길찾기 링크 생성 함수
  const getKakaoNaviLink = (name, lat, lon) => {
    return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lon}`;
  };

  return (
    <div style={styles.container}>
      <div id="map" style={styles.map}></div>

      {/* 상단 액션바 */}
      <div style={styles.topOverlay}>
        <div style={styles.searchBar}>
          <input placeholder="어디로 떠나볼까요?" style={styles.searchInput} />
          <button onClick={handleAIRecommendation} style={styles.aiBtn}>
            {isLoading ? "분석중..." : "AI 추천"}
          </button>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>로그아웃</button>
      </div>

      {/* 왼쪽 네비게이션 바로가기 (게시판/채팅) */}
      <div style={styles.leftNavButtons}>
        <button onClick={() => navigate('/board')} style={styles.navCircleBtn} title="게시판">📋</button>
        <button onClick={() => navigate('/chat')} style={styles.navCircleBtn} title="채팅방">💬</button>
      </div>

      {/* 우측 컨트롤러 */}
      <div style={styles.rightControls}>
        <button onClick={() => window.location.reload()} style={styles.sideControlBtn}>🎯</button>
        <button style={styles.sideControlBtn}>+</button>
        <button style={styles.sideControlBtn}>-</button>
      </div>

      {/* 하단 플로팅 메뉴 */}
      <div style={styles.bottomNav}>
        <button onClick={fetchRecommendedPlaces} style={styles.navItem}>✨ 추천 목록</button>
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
              {recommendedPlaces.length > 0 && !aiResult && (
                <div>
                  <h3 style={styles.panelTitle}>📍 추천 장소</h3>
                  {recommendedPlaces.map((item, idx) => (
                    <div key={idx} style={styles.landmarkItem}>
                      <div style={styles.itemInfo}>
                        <strong>{item.name}</strong>
                        <p style={styles.itemDesc}>{item.description}</p>
                      </div>
                      {/* ✅ 길찾기 버튼 추가 */}
                      <a
                        href={getKakaoNaviLink(item.name, item.latitude, item.longitude)}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.naviLink}
                      >
                        길찾기 ↗
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#fff' },
  map: { width: '100%', height: '100%', zIndex: 1 },
  topOverlay: { position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  searchBar: { flex: 1, height: '50px', backgroundColor: '#fff', borderRadius: '25px', display: 'flex', alignItems: 'center', padding: '0 5px 0 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', maxWidth: '500px' },
  searchInput: { border: 'none', flex: 1, outline: 'none', fontSize: '16px', color: '#333' },
  aiBtn: { height: '40px', padding: '0 20px', borderRadius: '20px', border: 'none', background: 'linear-gradient(135deg, #007bff, #00c6ff)', color: '#fff', fontWeight: '600', cursor: 'pointer' },
  logoutBtn: { marginLeft: '15px', padding: '10px 18px', borderRadius: '25px', border: 'none', backgroundColor: '#fff', color: '#ff4d4f', fontWeight: '600', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer' },

  // ✅ 왼쪽 네비게이션 버튼 스타일
  leftNavButtons: { position: 'absolute', left: '20px', top: '100px', display: 'flex', flexDirection: 'column', gap: '15px', zIndex: 10 },
  navCircleBtn: { width: '50px', height: '50px', borderRadius: '50%', border: 'none', backgroundColor: '#fff', fontSize: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'transform 0.2s' },

  rightControls: { position: 'absolute', right: '20px', top: '100px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 10 },
  sideControlBtn: { width: '40px', height: '40px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontSize: '18px' },
  bottomNav: { position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 },
  navItem: { padding: '14px 30px', borderRadius: '35px', border: 'none', backgroundColor: '#1a1a1a', color: '#fff', fontWeight: '700', boxShadow: '0 8px 25px rgba(0,0,0,0.3)', cursor: 'pointer' },
  sidePanel: { position: 'absolute', top: 0, left: 0, width: '360px', height: '100%', backgroundColor: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(10px)', boxShadow: '4px 0 20px rgba(0,0,0,0.1)', zIndex: 20, transition: 'transform 0.4s ease', padding: '70px 20px 20px' },
  closePanelBtn: { position: 'absolute', top: '25px', right: '20px', border: 'none', background: 'none', fontSize: '28px', cursor: 'pointer', color: '#999' },
  panelTitle: { fontSize: '24px', fontWeight: '800', marginBottom: '25px', color: '#111' },
  aiText: { lineHeight: '1.7', color: '#444', whiteSpace: 'pre-wrap', backgroundColor: '#f0f4f8', padding: '18px', borderRadius: '15px', fontSize: '15px' },

  // ✅ 추천 장소 아이템 스타일
  landmarkItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid #f0f0f0' },
  itemInfo: { flex: 1, paddingRight: '10px' },
  itemDesc: { fontSize: '14px', color: '#777', margin: '5px 0 0 0' },
  naviLink: { padding: '8px 12px', borderRadius: '8px', backgroundColor: '#fee500', color: '#3c1e1e', textDecoration: 'none', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' },

  loadingSkeleton: { textAlign: 'center', marginTop: '100px', color: '#007bff', fontWeight: '700' }
};

export default MainPage;