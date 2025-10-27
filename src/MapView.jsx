import { MapContainer, TileLayer, WMSTileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import L from "leaflet";
import Compass from "./components/Compass";
import DangerZoneOverlay from "./components/DangerZoneOverlay";
import MissingPersonMap from "./components/MissingPersonMap";
import { analyzeDangerZones } from "./services/dangerPredictionService";
import { fetchRoadCCTV } from "./data/publicCCTV";
import { getRoute } from "./utils/mapUtils";
import { createUserMarkerIcon, createOtherUserMarkerIcon, createEmergencyIcon } from "./utils/markerIcons";
import { DEFAULT_CENTER, MAP_TYPES, SAFEMAP_TOKEN } from "./constants/mapConfig";
import { useMapState } from "./hooks/useMapState";

// 지도 중심 업데이트 컴포넌트
function MapUpdater({
  currentLocation,
  locations,
  currentUserId,
  setMapCenter,
  setMapBounds,
  setMapInstance,
  onMapClick,
}) {
  const map = useMap();

  useEffect(() => {
    if (onMapClick) {
      let touchTimer = null;
      let touchMoved = false;

      const handleTouchStart = (e) => {
        touchMoved = false;
        touchTimer = setTimeout(() => {
          if (!touchMoved && e.latlng) {
            onMapClick(e);
          }
        }, 500);
      };

      const handleTouchMove = () => {
        touchMoved = true;
        if (touchTimer) clearTimeout(touchTimer);
      };

      const handleTouchEnd = () => {
        if (touchTimer) clearTimeout(touchTimer);
      };

      map.on('contextmenu', onMapClick);
      map.on('touchstart', handleTouchStart);
      map.on('touchmove', handleTouchMove);
      map.on('touchend', handleTouchEnd);

      return () => {
        map.off('contextmenu', onMapClick);
        map.off('touchstart', handleTouchStart);
        map.off('touchmove', handleTouchMove);
        map.off('touchend', handleTouchEnd);
      };
    }
  }, [map, onMapClick]);

  useEffect(() => {
    if (setMapInstance) {
      setMapInstance(map);
    }
  }, [map, setMapInstance]);

  useEffect(() => {
    const otherUserLocations = locations.filter(
      (loc) => loc.userId !== currentUserId
    );
    const bounds = map.getBounds();

    if (otherUserLocations.length > 0) {
      const latestLocation = otherUserLocations[otherUserLocations.length - 1];
      if (!bounds.contains([latestLocation.lat, latestLocation.lng])) {
        map.setView([latestLocation.lat, latestLocation.lng], map.getZoom());
        setMapCenter([latestLocation.lat, latestLocation.lng]);
      }
    } else if (
      currentLocation &&
      !bounds.contains([currentLocation.lat, currentLocation.lng])
    ) {
      map.setView([currentLocation.lat, currentLocation.lng], map.getZoom());
      setMapCenter([currentLocation.lat, currentLocation.lng]);
    }
  }, [currentLocation, locations, currentUserId, map, setMapCenter]);

  useEffect(() => {
    const handleMoveEnd = () => {
      const center = map.getCenter();
      setMapCenter([center.lat, center.lng]);
      setMapBounds(map.getBounds());
    };

    map.on("moveend", handleMoveEnd);
    setMapBounds(map.getBounds());

    return () => map.off("moveend", handleMoveEnd);
  }, [map, setMapCenter, setMapBounds]);

  return null;
}

function MapView({
  locations,
  currentLocation,
  currentUserId,
  isTracking,
  myLocationHistory,
  isRegistered,
}) {
  const mapState = useMapState(isTracking);
  const { mapType, setMapType, showEmergency, setShowEmergency, showTraffic, setShowTraffic, 
    showCrimeZones, setShowCrimeZones, showSecurityFacilities, setShowSecurityFacilities,
    showEmergencyBells, setShowEmergencyBells, showWomenSafety, setShowWomenSafety, 
    showChildCrimeZones, setShowChildCrimeZones, showMurderStats, setShowMurderStats, 
    showCCTV, setShowCCTV, showMissingPersons, setShowMissingPersons, 
    showMapButtons, setShowMapButtons } = mapState;
  const [missingPersonStatus, setMissingPersonStatus] = useState("");
  const [cctvStatus, setCctvStatus] = useState("");
  const [selectedCCTV, setSelectedCCTV] = useState(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [cctvList, setCctvList] = useState([]);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapBounds, setMapBounds] = useState(null);
  const [emergencyLocations, setEmergencyLocations] = useState({
    hospitals: [],
    police: [],
    stations: [],
  });
  const [showDangerZones, setShowDangerZones] = useState(false);
  const [dangerAnalysis, setDangerAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);

  // 실제 응급시설 API 호출
  const fetchEmergencyFacilities = useCallback(async () => {
    if (!mapBounds || !showEmergency) return;

    try {
      const bounds = mapBounds;
      const south = bounds.getSouth();
      const west = bounds.getWest();
      const north = bounds.getNorth();
      const east = bounds.getEast();

      const query = `[out:json][timeout:25];(node["amenity"="hospital"](${south},${west},${north},${east});node["amenity"="police"](${south},${west},${north},${east});node["amenity"="fire_station"](${south},${west},${north},${east}););out geom;`;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });

      if (response.ok) {
        const data = await response.json();
        const hospitals = [];
        const police = [];
        const stations = [];

        data.elements.forEach((element) => {
          if (element.tags) {
            const facility = {
              name: element.tags.name || "이름 없음",
              lat: element.lat,
              lng: element.lon,
              address:
                element.tags["addr:full"] ||
                element.tags["addr:street"] ||
                "주소 정보 없음",
              phone:
                element.tags.phone ||
                element.tags["contact:phone"] ||
                "전화번호 없음",
              emergency: element.tags.emergency || "",
              operator: element.tags.operator || "",
              opening_hours: element.tags.opening_hours || "운영시간 정보 없음",
            };

            if (element.tags.amenity === "hospital") {
              hospitals.push(facility);
            } else if (element.tags.amenity === "police") {
              police.push(facility);
            } else if (element.tags.amenity === "fire_station") {
              stations.push(facility);
            }
          }
        });

        setEmergencyLocations({ hospitals, police, stations });
      }
    } catch (error) {
      console.error("응급시설 데이터 로드 실패:", error);
    }
  }, [mapBounds, showEmergency]);

  useEffect(() => {
    fetchEmergencyFacilities();
  }, [fetchEmergencyFacilities, mapType]);

  useEffect(() => {
    const loadCCTV = async () => {
      if (showCCTV && mapBounds) {
        setCctvStatus('📹 CCTV 로드 중...');
        console.log('현재 지도 영역:', {
          서: mapBounds.getWest().toFixed(4),
          동: mapBounds.getEast().toFixed(4),
          남: mapBounds.getSouth().toFixed(4),
          북: mapBounds.getNorth().toFixed(4)
        });
        const data = await fetchRoadCCTV(mapBounds);
        console.log(`${data.length}개 CCTV 로드 완료`);
        setCctvList(data);
        if (data.length === 0) {
          setCctvStatus('현재 지도 영역에 CCTV가 없습니다.');
          setTimeout(() => {
            setCctvStatus('');
            setShowCCTV(false);
          }, 2000);
        } else {
          setCctvStatus('');
        }
      } else {
        setCctvList([]);
        setCctvStatus('');
      }
    };
    loadCCTV();
  }, [showCCTV]);

  // HLS.js 초기화
  useEffect(() => {
    if (!selectedCCTV || !selectedCCTV.streamUrl || !videoRef.current) return;

    const video = videoRef.current;
    const url = selectedCCTV.streamUrl;
    console.log('CCTV 스트림 로드:', url);

    if (window.Hls && window.Hls.isSupported()) {
      console.log('HLS.js 사용');
      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        debug: false
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS 매니페스트 파싱 성공');
        video.play().catch(e => console.log('재생 실패:', e));
      });
      hls.on(window.Hls.Events.ERROR, (event, data) => {
        console.error('HLS 에러:', data.type, data.details, data.fatal);
        if (data.fatal) {
          switch(data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              console.error('네트워크 에러 - 재시도');
              hls.startLoad();
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              console.error('미디어 에러 - 복구 시도');
              hls.recoverMediaError();
              break;
            default:
              console.error('복구 불가능한 에러');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('네이티브 HLS 사용 (Safari)');
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.log('재생 실패:', e));
      });
    } else {
      console.error('HLS 지원되지 않는 브라우저');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedCCTV]);

  // AI 위험 지역 분석
  const analyzeCurrentDanger = useCallback(async () => {
    if (!currentLocation || !isTracking || !showDangerZones) {
      return;
    }

    setIsAnalyzing(true);

    try {
      const result = await analyzeDangerZones({
        locationHistory: myLocationHistory || [],
        currentLocation,
        timestamp: new Date(),
        emergencyFacilities: emergencyLocations,
        hasCrimeZoneData: showCrimeZones,
        hasSecurityFacilities: showSecurityFacilities,
        hasEmergencyBells: showEmergencyBells,
        hasWomenSafetyData: showWomenSafety,
      });

      if (result.success) {
        setDangerAnalysis(result.data);
        setAnalysisError(null);

        // 음성 알림 (전체 위험도가 medium 이상일 때)
        if (result.data.overallRiskLevel === "high") {
          console.log("⚠️ 높은 위험도 감지:", result.data);
        } else if (result.data.overallRiskLevel === "medium") {
          console.log("⚡ 중간 위험도 감지:", result.data);
        }
      } else {
        // API 키 없거나 에러 발생 시에도 기본 정보 표시
        if (result.error === "OpenAI API key not configured") {
          console.warn(
            "💡 OpenAI API 키가 설정되지 않았습니다. 기본 안전 정보를 표시합니다."
          );
          console.info(
            "API 키 설정 방법: .env 파일에 VITE_OPENAI_API_KEY=your_key 추가"
          );
          setAnalysisError("API 키 없음 (기본 정보 사용)");
        } else {
          console.warn("위험 분석 실패:", result.error);
          setAnalysisError(result.error);
        }
        setDangerAnalysis(result.data); // 기본 안전 정보 사용
      }
    } catch (error) {
      console.error("위험 분석 오류:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    currentLocation,
    isTracking,
    showDangerZones,
    myLocationHistory,
    emergencyLocations,
  ]);

  // 위험 지역 토글 시에만 초기 분석 실행 (위치 변경 시 재실행 안 함)
  useEffect(() => {
    if (showDangerZones && isTracking && currentLocation) {
      analyzeCurrentDanger();
    }
  }, [showDangerZones]); // analyzeCurrentDanger 의존성 제거하여 위치 변경 시 재실행 방지

  // 위치 추적 중지 시 위험도 예측 초기화
  useEffect(() => {
    const handleClearDangerAnalysis = () => {
      setDangerAnalysis(null);
      setShowDangerZones(false);
      setShowSafetyTips(false);
      setAnalysisError(null);
    };

    const handleResetMissingPersons = () => {
      setShowMissingPersons(false);
    };

    window.addEventListener("clearDangerAnalysis", handleClearDangerAnalysis);
    window.addEventListener("resetMissingPersons", handleResetMissingPersons);
    return () => {
      window.removeEventListener("clearDangerAnalysis", handleClearDangerAnalysis);
      window.removeEventListener("resetMissingPersons", handleResetMissingPersons);
    };
  }, []);

  // 10분마다 위험 분석 업데이트 (추적 중일 때만)
  useEffect(() => {
    if (!showDangerZones || !isTracking) return;

    const interval = setInterval(() => {
      analyzeCurrentDanger();
    }, 600000); // 10분(600초)마다 업데이트

    return () => clearInterval(interval);
  }, [showDangerZones, isTracking, analyzeCurrentDanger]);



  const handleMapClick = useCallback(async (e) => {
    if (measureMode) {
      setMeasurePoints(prev => [...prev, { lat: e.latlng.lat, lng: e.latlng.lng }]);
      return;
    }
    
    if (!currentLocation || !isTracking) return;
    
    const destination = { lat: e.latlng.lat, lng: e.latlng.lng };
    setDestinationMarker(destination);
    
    const route = await getRoute(currentLocation, destination, dangerAnalysis?.dangerZones || []);
    if (route) {
      setRouteCoordinates(route.coords);
      setRouteInfo({
        distance: (route.distance / 1000).toFixed(2),
        duration: Math.round(route.duration / 60),
        safety: route.safety
      });
    }
  }, [currentLocation, isTracking, dangerAnalysis, measureMode]);

  const clearRoute = useCallback(() => {
    setDestinationMarker(null);
    setRouteCoordinates(null);
    setRouteInfo(null);
  }, []);

  const toggleMeasureMode = useCallback(() => {
    setMeasureMode(prev => !prev);
    setMeasurePoints([]);
  }, []);

  const calculateTotalDistance = useCallback(() => {
    if (measurePoints.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < measurePoints.length - 1; i++) {
      const R = 6371000;
      const dLat = (measurePoints[i + 1].lat - measurePoints[i].lat) * Math.PI / 180;
      const dLng = (measurePoints[i + 1].lng - measurePoints[i].lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(measurePoints[i].lat * Math.PI / 180) * Math.cos(measurePoints[i + 1].lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      total += R * c;
    }
    return total;
  }, [measurePoints]);

  useEffect(() => {
    if (!isTracking) {
      clearRoute();
    }
  }, [isTracking, clearRoute]);



  return (
    <div style={{ position: "relative" }}>
      {/* 동작하는 나침판 */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          zIndex: 999,
        }}
      >
        <Compass />
      </div>

      {/* 내 위치로 버튼 */}
      {isTracking && currentLocation && mapInstance && (
        <button
          onClick={() => {
            mapInstance.setView([currentLocation.lat, currentLocation.lng], 16);
          }}
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            zIndex: 999,
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "2px solid rgba(255, 255, 255, 0.9)",
            background: "rgba(255, 255, 255, 0.95)",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.2rem",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = "0 3px 8px rgba(0, 0, 0, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.3)";
          }}
          title="내 위치로"
        >
          <span style={{ color: "#3b82f6" }}>📍</span>
        </button>
      )}

      {/* 길찾기 안내 */}
      {isTracking && !destinationMarker && !measureMode && (
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 999,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            padding: "4px 10px",
            borderRadius: 4,
            color: "rgba(255, 255, 255, 0.9)",
            fontSize: "0.7rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            backdropFilter: "blur(4px)",
            whiteSpace: "nowrap",
          }}
        >
          📍 길게 누르기 / 우클릭으로 길찾기
        </div>
      )}

      {/* 거리 측정 안내 */}
      {measureMode && (
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 999,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            padding: "8px 12px",
            borderRadius: 6,
            color: "#fff",
            fontSize: "0.85rem",
            boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: "center",
          }}
        >
          <div>📏 클릭하여 거리 측정</div>
          {measurePoints.length > 0 && (
            <div style={{ fontSize: "0.75rem", color: "#3b82f6" }}>
              {measurePoints.length}개 지점 • {(calculateTotalDistance() / 1000).toFixed(2)}km
            </div>
          )}
          <button
            onClick={() => setMeasurePoints([])}
            style={{
              marginTop: 4,
              padding: "4px 8px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: "0.7rem"
            }}
          >
            초기화
          </button>
        </div>
      )}

      {/* 경로 정보 표시 */}
      {routeInfo && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10000,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            padding: "6px 12px",
            borderRadius: 6,
            border: routeInfo.safety?.intersects 
              ? "1px solid #ef4444" 
              : "1px solid #3b82f6",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            gap: 8,
            alignItems: "center",
            maxWidth: "90vw",
          }}
        >
          <div style={{ color: "#fff", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
            🚶 {routeInfo.distance}km · {routeInfo.duration}분
            {routeInfo.safety?.intersects && (
              <span style={{ color: "#fbbf24", marginLeft: 4 }}>⚠️{routeInfo.safety.count}</span>
            )}
            {!routeInfo.safety?.intersects && showDangerZones && (
              <span style={{ color: "#10b981", marginLeft: 4 }}>✅</span>
            )}
          </div>
          <button
            onClick={clearRoute}
            style={{
              background: "transparent",
              color: "#ef4444",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: "1rem",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* AI 위험 분석 버튼 (지도 버튼 왼쪽) */}
      {showMapButtons && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "46px",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <button
            className={`map-type-btn ${showDangerZones ? "active" : ""}`}
            onClick={() => setShowDangerZones(!showDangerZones)}
            disabled={!isTracking}
            title={isTracking ? "AI 위험 분석 토글" : "위치 추적을 시작하세요"}
          >
            🤖
          </button>

          {/* 안전 팁 알림 버튼 */}
          {showDangerZones && dangerAnalysis && (
            <button
              className={`map-type-btn ${showSafetyTips ? "active" : ""}`}
              onClick={() => setShowSafetyTips(!showSafetyTips)}
              title="안전 팁 보기"
              style={{
                backgroundColor:
                  dangerAnalysis.overallRiskLevel === "high"
                    ? "rgba(255, 51, 51, 0.9)"
                    : dangerAnalysis.overallRiskLevel === "medium"
                    ? "rgba(255, 136, 0, 0.9)"
                    : "rgba(255, 100, 100, 0.85)",
              }}
            >
              💡
            </button>
          )}

          {/* 여성밤길치안안전 버튼 */}
          <button
            className={`map-type-btn ${showWomenSafety ? "active" : ""}`}
            onClick={() => setShowWomenSafety(!showWomenSafety)}
            disabled={!isRegistered}
            title={isRegistered ? "밤길치안안전" : "로그인이 필요합니다"}
          >
            🌙
          </button>

          {/* 어린이대상범죄주의구간 버튼 */}
          <button
            className={`map-type-btn ${showChildCrimeZones ? "active" : ""}`}
            onClick={() => setShowChildCrimeZones(!showChildCrimeZones)}
            disabled={!isRegistered}
            title={isRegistered ? "어린이대상범죄주의구간" : "로그인이 필요합니다"}
          >
            ⚠️
          </button>

          {/* 치안사고통계(살인) 버튼 */}
          <button
            className={`map-type-btn ${showMurderStats ? "active" : ""}`}
            onClick={() => setShowMurderStats(!showMurderStats)}
            disabled={!isRegistered}
            title={isRegistered ? "치안사고통계(살인)" : "로그인이 필요합니다"}
          >
            🔪
          </button>

          <button
            className={`map-type-btn ${showCCTV ? "active" : ""}`}
            onClick={() => {
              const newState = !showCCTV;
              setShowCCTV(newState);
              if (!newState) setCctvList([]);
            }}
            disabled={!isRegistered}
            title={isRegistered ? "도로 CCTV" : "로그인이 필요합니다"}
          >
            📹
          </button>

          {/* 실종자 정보 버튼 */}
          <button
            className={`map-type-btn ${showMissingPersons ? "active" : ""}`}
            onClick={() => setShowMissingPersons(!showMissingPersons)}
            disabled={!isRegistered || !isTracking || missingPersonStatus.includes("로딩")}
            title={
              !isRegistered
                ? "로그인이 필요합니다"
                : !isTracking
                ? "위치 추적을 먼저 시작하세요"
                : "실종자 정보"
            }
          >
            🔍
          </button>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <button
          className="map-type-btn"
          onClick={() => setShowMapButtons(!showMapButtons)}
          title="메뉴"
        >
          ☰
        </button>
        {showMapButtons && (
          <>
            <button
              className="map-type-btn active"
              onClick={() => {
                const types = ["street", "satellite", "detailed", "terrain"];
                const currentIndex = types.indexOf(mapType);
                const nextIndex = (currentIndex + 1) % types.length;
                setMapType(types[nextIndex]);
              }}
              title={
                mapType === "street" ? "일반 지도" :
                mapType === "satellite" ? "위성 지도" :
                mapType === "detailed" ? "상세 지도" : "지형 지도"
              }
            >
              {mapType === "street" ? "🗺️" :
               mapType === "satellite" ? "🛰️" :
               mapType === "detailed" ? "🏢" : "⛰️"}
            </button>
            <button
              className={`map-type-btn ${showEmergency ? "active" : ""}`}
              onClick={() => setShowEmergency(!showEmergency)}
              disabled={!isRegistered}
              title={isRegistered ? "응급시설" : "로그인이 필요합니다"}
            >
              🚨
            </button>
            <button
              className={`map-type-btn ${showTraffic ? "active" : ""}`}
              onClick={() => setShowTraffic(!showTraffic)}
              disabled={!isRegistered}
              title={isRegistered ? "주요시설" : "로그인이 필요합니다"}
            >
              🏘️
            </button>
            <button
              className={`map-type-btn ${showEmergencyBells ? "active" : ""}`}
              onClick={() => setShowEmergencyBells(!showEmergencyBells)}
              disabled={!isRegistered}
              title={isRegistered ? "비상벨" : "로그인이 필요합니다"}
            >
              🔔
            </button>
            <button
              className={`map-type-btn ${measureMode ? "active" : ""}`}
              onClick={toggleMeasureMode}
              title="거리 측정"
            >
              📏
            </button>
          </>
        )}
      </div>

      {/* 안전 팁 팝업 */}
      {showDangerZones && dangerAnalysis && showSafetyTips && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "70px",
            zIndex: 10000,
            backgroundColor: "rgba(42, 42, 42, 0.98)",
            padding: "16px",
            borderRadius: "8px",
            border:
              "2px solid " +
              (dangerAnalysis.overallRiskLevel === "high"
                ? "#ff3333"
                : dangerAnalysis.overallRiskLevel === "medium"
                ? "#ff8800"
                : "#00ff88"),
            maxWidth: "320px",
            maxHeight: "400px",
            overflowY: "auto",
            boxShadow: "0 6px 12px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: "bold",
                color:
                  dangerAnalysis.overallRiskLevel === "high"
                    ? "#ff3333"
                    : dangerAnalysis.overallRiskLevel === "medium"
                    ? "#ff8800"
                    : "#00ff88",
              }}
            >
              {isAnalyzing
                ? "🔄 분석 중..."
                : dangerAnalysis.overallRiskLevel === "high"
                ? "⚠️ 높은 주의 필요"
                : dangerAnalysis.overallRiskLevel === "medium"
                ? "⚡ 주의 필요"
                : "✅ 안전"}
            </div>
            <button
              onClick={() => setShowSafetyTips(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#aaa",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "0 4px",
              }}
            >
              ✕
            </button>
          </div>

          {analysisError && (
            <div
              style={{
                fontSize: "0.75rem",
                color: "#ffaa00",
                backgroundColor: "rgba(255, 170, 0, 0.1)",
                padding: "6px 10px",
                borderRadius: "4px",
                marginBottom: "12px",
                border: "1px solid rgba(255, 170, 0, 0.3)",
              }}
            >
              💡 {analysisError}
            </div>
          )}

          <div style={{ fontSize: "0.9rem", color: "#cccccc" }}>
            <strong style={{ color: "#fff", fontSize: "1rem" }}>안전 팁</strong>
            <ul
              style={{
                margin: "8px 0",
                paddingLeft: "20px",
                listStyle: "none",
              }}
            >
              {dangerAnalysis.safetyTips?.map((tip, idx) => (
                <li
                  key={idx}
                  style={{
                    marginBottom: "8px",
                    lineHeight: "1.5",
                    paddingLeft: "8px",
                    borderLeft:
                      "3px solid " +
                      (dangerAnalysis.overallRiskLevel === "high"
                        ? "#ff3333"
                        : dangerAnalysis.overallRiskLevel === "medium"
                        ? "#ff8800"
                        : "#00ff88"),
                  }}
                >
                  • {tip}
                </li>
              ))}
            </ul>
          </div>

          {dangerAnalysis.dangerZones?.length > 0 && (
            <div
              style={{
                fontSize: "0.85rem",
                color: "#aaa",
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid #555",
              }}
            >
              📍 {dangerAnalysis.dangerZones.length}개 주의 지역이 지도에
              표시되었습니다
            </div>
          )}
        </div>
      )}

      {/* CCTV 상태 표시 */}
      {cctvStatus && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10000,
            backgroundColor: "rgba(42, 42, 42, 0.95)",
            padding: "12px 20px",
            borderRadius: "8px",
            border: "2px solid #ff6600",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
            color: "#ff6600",
            fontSize: "0.95rem",
            fontWeight: "bold",
            maxWidth: "400px",
            textAlign: "center",
          }}
        >
          {cctvStatus}
        </div>
      )}

      {/* 실종자 정보 상태 표시 */}
      {missingPersonStatus && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10000,
            backgroundColor: "rgba(42, 42, 42, 0.95)",
            padding: "12px 20px",
            borderRadius: "8px",
            border: "2px solid #ffd700",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
            color: "#ffd700",
            fontSize: "0.95rem",
            fontWeight: "bold",
            maxWidth: "400px",
            textAlign: "center",
          }}
        >
          {missingPersonStatus}
        </div>
      )}

      {/* AI 분석 로딩 오버레이 */}
      {isAnalyzing && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10001,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            padding: "24px 32px",
            borderRadius: "8px",
            border: "2px solid #ffd700",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <div className="spinner"></div>
          <div style={{ color: "#ffd700", fontSize: "1rem", fontWeight: "bold" }}>
            🤖 AI 위험 분석 중...
          </div>
        </div>
      )}

      <MapContainer center={DEFAULT_CENTER} zoom={14} className="map-container">
        <MapUpdater
          currentLocation={currentLocation}
          locations={locations}
          currentUserId={currentUserId}
          setMapCenter={setMapCenter}
          setMapBounds={setMapBounds}
          setMapInstance={setMapInstance}
          onMapClick={handleMapClick}
        />
        <TileLayer
          key={mapType}
          url={MAP_TYPES[mapType].url}
          attribution={MAP_TYPES[mapType].attribution}
        />

        {/* 실시간 교통상황 레이어 */}
        {showTraffic && (
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=h@221097413,traffic&x={x}&y={y}&z={z}"
            attribution="Google Traffic"
            opacity={0.7}
          />
        )}

        {/* 범죄주의구간(성폭력) WMS 레이어 */}
        {showCrimeZones && (
          <WMSTileLayer
            key={`crime-zones-${mapType}`}
            url={`http://www.safemap.go.kr/openApiService/wms/getLayerData.do?apikey=${
              import.meta.env.VITE_SAFEMAP_TOKEN
            }`}
            layers="A2SM_CRMNLHSPOT_TOT"
            styles="A2SM_CrmnlHspot_Tot_Rape"
            format="image/png"
            transparent={true}
            attribution="안전지도 범죄주의구간"
            opacity={0.6}
          />
        )}

        {/* 치안시설 WMS 레이어 */}
        {showSecurityFacilities && (
          <WMSTileLayer
            key={`security-facilities-${mapType}`}
            url={`http://www.safemap.go.kr/openApiService/wms/getLayerData.do?apikey=${
              import.meta.env.VITE_SAFEMAP_TOKEN
            }`}
            layers="A2SM_CMMNPOI2"
            styles="A2SM_CmmnPoi2"
            format="image/png"
            transparent={true}
            attribution="안전지도 치안시설"
            opacity={0.7}
          />
        )}

        {/* 안전비상벨 WMS 레이어 */}
        {showEmergencyBells && (
          <WMSTileLayer
            key={`emergency-bells-${mapType}`}
            url={`http://www.safemap.go.kr/openApiService/wms/getLayerData.do?apikey=${
              import.meta.env.VITE_SAFEMAP_TOKEN
            }`}
            layers="A2SM_CMMNPOI_EMGBELL"
            styles="A2SM_CMMNPOI_EMGBELL"
            format="image/png"
            transparent={true}
            attribution="안전지도 안전비상벨"
            opacity={0.8}
          />
        )}

        {/* 여성밤길치안안전 WMS 레이어 */}
        {showWomenSafety && (
          <WMSTileLayer
            key={`women-safety-${mapType}`}
            url={`http://www.safemap.go.kr/openApiService/wms/getLayerData.do?apikey=${
              import.meta.env.VITE_SAFEMAP_TOKEN
            }`}
            layers="A2SM_CRMNLHSPOT_F1_TOT"
            styles="A2SM_OdblrCrmnlHspot_Tot_20_24"
            format="image/png"
            transparent={true}
            attribution="안전지도 여성밤길치안안전"
            opacity={0.6}
          />
        )}

        {/* 약자보호시설 WMS 레이어 (항상 표시) */}
        <WMSTileLayer
          key={`protection-facilities-${mapType}`}
          url={`http://www.safemap.go.kr/openApiService/wms/getLayerData.do?apikey=${
            import.meta.env.VITE_SAFEMAP_TOKEN
          }`}
          layers="A2SM_CMMNPOI"
          styles="A2SM_CMMNPOI_04"
          format="image/png"
          transparent={true}
          attribution="안전지도 약자보호시설"
          opacity={0.8}
        />

        {/* 어린이대상범죄주의구간 WMS 레이어 */}
        {showChildCrimeZones && (
          <WMSTileLayer
            key={`child-crime-zones-${mapType}`}
            url={`http://www.safemap.go.kr/openApiService/wms/getLayerData.do?apikey=${
              import.meta.env.VITE_SAFEMAP_TOKEN
            }`}
            layers="A2SM_ODBLRCRMNLHSPOT_KID"
            styles="A2SM_OdblrCrmnlHspot_Kid"
            format="image/png"
            transparent={true}
            attribution="안전지도 어린이대상범죄주의구간"
            opacity={0.6}
          />
        )}

        {/* 치안사고통계(살인) WMS 레이어 */}
        {showMurderStats && (
          <WMSTileLayer
            key={`murder-stats-${mapType}`}
            url={`http://www.safemap.go.kr/openApiService/wms/getLayerData.do?apikey=${
              import.meta.env.VITE_SAFEMAP_TOKEN
            }`}
            layers="A2SM_CRMNLSTATS"
            styles="A2SM_CrmnlStats_Murder"
            format="image/png"
            transparent={true}
            attribution="안전지도 치안사고통계(살인)"
            opacity={0.7}
          />
        )}

        {/* 이동 경로 표시 */}
        {myLocationHistory && myLocationHistory.length > 1 && isTracking && (
          <Polyline
            positions={myLocationHistory.map(loc => [loc.lat, loc.lng])}
            color="#000000"
            weight={3}
            opacity={0.8}
            pathOptions={{ lineCap: 'round', lineJoin: 'round' }}
          />
        )}

        {/* 현재 사용자 위치 */}
        {currentLocation && (
          <Marker
            position={[currentLocation.lat, currentLocation.lng]}
            icon={createUserMarkerIcon()}
          >
            <Popup>
              <strong>내 위치 ({currentUserId})</strong>
              <br />
              위도: {currentLocation.lat.toFixed(6)}
              <br />
              경도: {currentLocation.lng.toFixed(6)}
            </Popup>
          </Marker>
        )}

        {/* 다른 사용자들의 현재 위치만 표시 */}
        {useMemo(() => {
          // 각 사용자의 최신 위치만 추출
          const latestLocations = new Map();
          locations.forEach((location) => {
            if (location.userId !== currentUserId) {
              latestLocations.set(location.userId, location);
            }
          });

          return Array.from(latestLocations.values()).map((location) => (
            <Marker
              key={`current-${location.userId}`}
              position={[location.lat, location.lng]}
              icon={createOtherUserMarkerIcon()}
              zIndexOffset={1000}
            >
              <Popup>
                <strong>{location.userId} (현재 위치)</strong>
                <br />
                위도: {location.lat.toFixed(6)}
                <br />
                경도: {location.lng.toFixed(6)}
                <br />
                시간: {new Date(location.timestamp).toLocaleString()}
              </Popup>
            </Marker>
          ));
        }, [locations, currentUserId])}

        {/* 응급시설 마커 */}
        {showEmergency && (
          <>
            {emergencyLocations.hospitals.map((hospital, index) => (
              <Marker
                key={`hospital-${index}-${hospital.lat}-${hospital.lng}`}
                position={[hospital.lat, hospital.lng]}
                icon={createEmergencyIcon("🏥", "#ff4444", 16)}
                zIndexOffset={500}
              >
                <Popup>
                  <strong>🏥 {hospital.name}</strong>
                  <br />
                  <div style={{ fontSize: "0.9em", marginTop: "4px" }}>
                    <div>📍 {hospital.address}</div>
                    <div>📞 {hospital.phone}</div>
                    <div>🕐 {hospital.opening_hours}</div>
                    {hospital.operator && <div>🏢 {hospital.operator}</div>}
                    <div style={{ marginTop: "4px", color: "#999" }}>
                      위도: {hospital.lat.toFixed(6)}, 경도:{" "}
                      {hospital.lng.toFixed(6)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {emergencyLocations.police.map((station, index) => (
              <Marker
                key={`police-${index}-${station.lat}-${station.lng}`}
                position={[station.lat, station.lng]}
                icon={createEmergencyIcon("🚔", "#4444ff", 16)}
                zIndexOffset={500}
              >
                <Popup>
                  <strong>🚔 {station.name}</strong>
                  <br />
                  <div style={{ fontSize: "0.9em", marginTop: "4px" }}>
                    <div>📍 {station.address}</div>
                    <div>📞 {station.phone}</div>
                    <div>🕐 {station.opening_hours}</div>
                    {station.operator && <div>🏢 {station.operator}</div>}
                    <div style={{ marginTop: "4px", color: "#999" }}>
                      위도: {station.lat.toFixed(6)}, 경도:{" "}
                      {station.lng.toFixed(6)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {emergencyLocations.stations.map((station, index) => (
              <Marker
                key={`station-${index}-${station.lat}-${station.lng}`}
                position={[station.lat, station.lng]}
                icon={createEmergencyIcon("🛡️", "#00aa44", 14)}
                zIndexOffset={400}
              >
                <Popup>
                  <strong>🛡️ {station.name}</strong>
                  <br />
                  <div style={{ fontSize: "0.9em", marginTop: "4px" }}>
                    <div>📍 {station.address}</div>
                    <div>📞 {station.phone}</div>
                    <div>🕐 {station.opening_hours}</div>
                    {station.operator && <div>🏢 {station.operator}</div>}
                    <div style={{ marginTop: "4px", color: "#999" }}>
                      위도: {station.lat.toFixed(6)}, 경도:{" "}
                      {station.lng.toFixed(6)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}

        {/* AI 위험 지역 오버레이 */}
        {showDangerZones && dangerAnalysis && (
          <DangerZoneOverlay dangerZones={dangerAnalysis.dangerZones} />
        )}

        {/* 실종자 정보 마커 */}
        <MissingPersonMap 
          showMissingPersons={showMissingPersons} 
          onStatusChange={setMissingPersonStatus}
          currentLocation={currentLocation}
        />

        {/* 경로 표시 */}
        {routeCoordinates && (
          <Polyline
            positions={routeCoordinates}
            color="#3b82f6"
            weight={4}
            opacity={0.7}
            pathOptions={{ lineCap: 'round', lineJoin: 'round' }}
          />
        )}

        {/* 거리 측정 선 */}
        {measureMode && measurePoints.length > 1 && (
          <Polyline
            positions={measurePoints.map(p => [p.lat, p.lng])}
            color="#3b82f6"
            weight={4}
            opacity={0.9}
            pathOptions={{ lineCap: 'round', lineJoin: 'round' }}
          />
        )}

        {/* 거리 측정 마커 */}
        {measureMode && measurePoints.map((point, idx) => (
          <Marker
            key={`measure-${idx}`}
            position={[point.lat, point.lng]}
            icon={L.divIcon({
              html: `<div style="background: #3b82f6; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: white;">${idx + 1}</div>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            })}
            zIndexOffset={900}
          />
        ))}

        {/* 목적지 마커 */}
        {destinationMarker && (
          <Marker
            position={[destinationMarker.lat, destinationMarker.lng]}
            icon={L.divIcon({
              html: `<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 14px;">📍</div>`,
              className: "destination-marker",
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
            zIndexOffset={800}
          >
            <Popup>
              <strong>목적지</strong>
              {routeInfo && (
                <div style={{ marginTop: 8, fontSize: "0.9rem" }}>
                  <div>🚶 거리: {routeInfo.distance}km</div>
                  <div>⏱️ 시간: 약 {routeInfo.duration}분</div>
                  {routeInfo.safety?.intersects && (
                    <div style={{ marginTop: 4, color: "#f59e0b", fontWeight: "bold" }}>
                      ⚠️ 위험 지역 {routeInfo.safety.count}곳 통과
                    </div>
                  )}
                  {!routeInfo.safety?.intersects && showDangerZones && (
                    <div style={{ marginTop: 4, color: "#10b981", fontWeight: "bold" }}>
                      ✅ 안전한 경로
                    </div>
                  )}
                  <button
                    onClick={clearRoute}
                    style={{
                      marginTop: 8,
                      padding: "6px 12px",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: "0.85rem"
                    }}
                  >
                    경로 삭제
                  </button>
                </div>
              )}
            </Popup>
          </Marker>
        )}

        {/* CCTV 마커 */}
        {showCCTV && cctvList.map((cctv) => (
          <Marker
            key={cctv.id}
            position={[cctv.lat, cctv.lng]}
            icon={L.divIcon({
              html: `<div style="background: #ff6600; width: 22px; height: 22px; border-radius: 5px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 13px; transform: rotate(-15deg);">📹</div>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
              className: 'cctv-marker'
            })}
            zIndexOffset={600}
          >
            <Popup>
              <strong>📹 {cctv.name}</strong>
              <br />
              <div style={{ fontSize: "0.9em", marginTop: "4px" }}>
                <div>형식: {cctv.format || 'N/A'}</div>
                {cctv.resolution && <div>해상도: {cctv.resolution}</div>}
                <button
                  onClick={() => setSelectedCCTV(cctv)}
                  style={{ marginTop: "8px", padding: "6px 12px", background: "#ff6600", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.9em" }}
                >
                  실시간 보기
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {selectedCCTV && (
        <div className="modal-overlay" onClick={() => {
          if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
          }
          setSelectedCCTV(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ 
            maxWidth: "900px", 
            width: window.innerWidth <= 768 ? "95vw" : "auto",
            padding: 0, 
            overflow: "hidden" 
          }}>
            <div className="modal-header" style={{ padding: "12px 20px", margin: 0 }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>📹 {selectedCCTV.name}</h3>
              <button className="modal-close" onClick={() => {
                if (hlsRef.current) {
                  hlsRef.current.destroy();
                  hlsRef.current = null;
                }
                setSelectedCCTV(null);
              }}>×</button>
            </div>
            {selectedCCTV.streamUrl ? (
              <video
                ref={videoRef}
                controls
                autoPlay
                playsInline
                muted
                style={{ 
                  width: "100%", 
                  height: window.innerWidth <= 768 ? "50vh" : "500px", 
                  display: "block", 
                  background: "#000" 
                }}
              />
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#aaa" }}>
                <p>⚠️ 실시간 영상을 사용할 수 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MapView;
