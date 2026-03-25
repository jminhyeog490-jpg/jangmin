import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// ✅ 요청 인터셉터 (토큰 자동 추가)
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ 응답 인터셉터 (동시 로그인 감지)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      alert("다른 곳에서 로그인되어 로그아웃됩니다.");
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

function MainPage() {
  const SERVER_URL = "http://52.79.237.156:8090";

  const [currentPos, setCurrentPos] = useState({ lat: 36.9103, lon: 127.1332 });
  const [mapObj, setMapObj] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const [savedLandmarks, setSavedLandmarks] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [markers, setMarkers] = useState([]);

  const navigate = useNavigate();

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

  // ✅ 저장된 장소 조회
  const fetchAndShowSavedLandmarks = async () => {
    try {
      const response = await axios.get(`${SERVER_URL}/api/v1/landmarks`);
      const data = response.data;

      setSavedLandmarks(data);
      setShowSaved(true);

      markers.forEach(m => m.setMap(null));

      const newMarkers = data.map(place => {
        const pos = new window.kakao.maps.LatLng(place.latitude, place.longitude);

        return new window.kakao.maps.Marker({
          map: mapObj,
          position: pos,
          title: place.name
        });
      });

      setMarkers(newMarkers);
    } catch (error) {
      alert("저장된 장소 불러오기 실패");
    }
  };

  // ✅ AI 추천
  const handleAIRecommendation = () => {
    if (isLoading) return;

    setIsLoading(true);
    setAiResult(null);

    const ps = new window.kakao.maps.services.Places();

    ps.keywordSearch('관광명소', async (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const placeDetails = data.slice(0, 5).map(p =>
          `- ${p.place_name} (${p.address_name})`
        ).join("\n");

        try {
          const res = await axios.post(`${SERVER_URL}/api/v1/ai/recommend`, {
            places: placeDetails,
            userQuery: customPrompt || "추천해줘"
          });

          setAiResult(res.data.answer);
        } catch (e) {
          alert("AI 실패");
        } finally {
          setIsLoading(false);
        }
      }
    }, {
      location: new window.kakao.maps.LatLng(currentPos.lat, currentPos.lon),
      radius: 2000
    });
  };

  // ✅ 위치 저장
  const handleSaveLocation = async () => {
    const name = prompt("장소 이름");
    if (!name) return;

    try {
      await axios.post(`${SERVER_URL}/api/v1/landmarks/register`, {
        name,
        description: "설명 없음",
        latitude: currentPos.lat,
        longitude: currentPos.lon,
        distance: 0.0
      });

      alert("저장 완료");
      fetchAndShowSavedLandmarks();
    } catch {
      alert("저장 실패");
    }
  };

  // ✅ 로그아웃
  const handleLogout = async () => {
    try {
      await axios.post(`${SERVER_URL}/api/auth/logout`);
    } catch {
      console.log("서버 로그아웃 실패 (무시)");
    } finally {
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <button onClick={() => navigate(-1)}>뒤로가기</button>

      <button onClick={handleAIRecommendation}>
        {isLoading ? "로딩중..." : "AI 추천"}
      </button>

      <button onClick={handleSaveLocation}>저장</button>
      <button onClick={fetchAndShowSavedLandmarks}>목록</button>
      <button onClick={handleLogout}>로그아웃</button>

      <div id="map" style={{ width: '100%', height: '100%' }}></div>

      {aiResult && <div>{aiResult}</div>}
    </div>
  );
}

export default MainPage;