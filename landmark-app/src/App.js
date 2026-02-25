import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [currentPos, setCurrentPos] = useState({ lat: 36.9103, lon: 127.1332 });
  const [mapObj, setMapObj] = useState(null);

  // UI 개선을 위한 추가 상태
  const [aiResult, setAiResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleAIRecommendation = () => {
    setAiResult(null); // 이전 결과 초기화
    setIsLoading(true); // 로딩 시작

    const ps = new window.kakao.maps.services.Places();

    ps.keywordSearch('맛집', async (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const placeNames = data.slice(0, 5).map(p => `${p.place_name}(${p.category_name})`).join(", ");

        try {
          const response = await axios.post(`http://localhost:8090/api/v1/ai/recommend`, {
            currentLocation: currentPos,
            places: placeNames,
            userQuery: "주변 랜드마크와 맛집을 분석해서 깔끔하게 추천해줘"
          });

          // 결과 저장
          setAiResult(response.data.answer);
        } catch (err) {
          console.error(err);
          alert("AI 서버 연결 실패! 보안 설정(CORS)이나 경로를 확인하세요.");
        } finally {
          setIsLoading(false); // 로딩 종료
        }
      } else {
        setIsLoading(false);
        alert("주변 장소 정보를 가져오지 못했습니다.");
      }
    }, { location: new window.kakao.maps.LatLng(currentPos.lat, currentPos.lon), radius: 1000 });
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 상단 버튼 바 */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 100, display: 'flex', gap: '10px' }}>
        <button onClick={handleAIRecommendation} style={buttonStyle("#4285F4", "white")}>
          {isLoading ? "🤖 분석 중..." : "✨ AI 주변 추천"}
        </button>
        <button onClick={() => alert("현재 위치 저장 기능")} style={buttonStyle("#fee500", "black")}>
          📍 내 위치 저장
        </button>
      </div>

      {/* AI 추천 결과 카드 (결과가 있을 때만 표시) */}
      {aiResult && (
        <div style={resultCardStyle}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#4285F4' }}>🤖 AI 가이드 추천</div>
          <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#333', whiteSpace: 'pre-wrap' }}>
            {aiResult}
          </div>
          <button onClick={() => setAiResult(null)} style={closeButtonStyle}>닫기</button>
        </div>
      )}

      {/* 로딩 애니메이션 (선택사항) */}
      {isLoading && (
        <div style={loaderOverlayStyle}>
          <div className="spinner">데이터 분석 중...</div>
        </div>
      )}

      <div id="map" style={{ width: '100%', height: '100%' }}></div>
    </div>
  );
}

// --- 스타일 정의 ---
const buttonStyle = (bg, color) => ({
  padding: '12px 20px', backgroundColor: bg, color: color, border: 'none', borderRadius: '30px',
  fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all 0.3s'
});

const resultCardStyle = {
  position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
  zIndex: 101, width: '90%', maxWidth: '400px', padding: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
  borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  border: '1px solid #eee'
};

const closeButtonStyle = {
  marginTop: '15px', width: '100%', padding: '8px', backgroundColor: '#eee',
  border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold'
};

const loaderOverlayStyle = {
  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 102, display: 'flex',
  justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold'
};

export default App;