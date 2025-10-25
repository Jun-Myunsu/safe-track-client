import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useEffect, useState, useMemo, useCallback } from 'react'
import L from 'leaflet'
import Compass from './components/Compass'
import DangerZoneOverlay from './components/DangerZoneOverlay'
import { analyzeDangerZones } from './services/dangerPredictionService'

// 기본 마커 아이콘 설정
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// 마커 아이콘 생성 함수
const createUserMarkerIcon = () => L.divIcon({
  html: `
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="background: linear-gradient(135deg, #ff6b6b, #ff3838); width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 3px 8px rgba(255, 59, 56, 0.4), 0 0 0 1px rgba(255, 59, 56, 0.2); display: flex; align-items: center; justify-content: center; position: relative; animation: pulse 2s infinite;">
        <span style="color: white; font-weight: bold; font-size: 10px; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">📍</span>
      </div>
      <div style="position: absolute; top: -1px; right: -1px; background: #00ff88; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.2);"></div>
    </div>
    <style>@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }</style>
  `,
  className: 'current-user-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
})

const createOtherUserMarkerIcon = () => L.divIcon({
  html: `
    <div style="background: linear-gradient(135deg, #ff5722, #d32f2f); width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(255, 193, 7, 0.4), 0 0 0 1px rgba(255, 235, 59, 0.3); display: flex; align-items: center; justify-content: center; animation: blink 1.5s ease-in-out infinite;">
      <span style="font-size: 12px;">🚶</span>
    </div>
    <style>@keyframes blink { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.1); } }</style>
  `,
  className: 'current-location-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

// 지도 중심 업데이트 컴포넌트
function MapUpdater({ currentLocation, locations, currentUserId, setMapCenter, setMapBounds, setMapInstance }) {
  const map = useMap()
  
  useEffect(() => {
    if (setMapInstance) {
      setMapInstance(map)
    }
  }, [map, setMapInstance])
  
  useEffect(() => {
    const otherUserLocations = locations.filter(loc => loc.userId !== currentUserId)
    const bounds = map.getBounds()
    
    if (otherUserLocations.length > 0) {
      const latestLocation = otherUserLocations[otherUserLocations.length - 1]
      if (!bounds.contains([latestLocation.lat, latestLocation.lng])) {
        map.setView([latestLocation.lat, latestLocation.lng], map.getZoom())
        setMapCenter([latestLocation.lat, latestLocation.lng])
      }
    } else if (currentLocation && !bounds.contains([currentLocation.lat, currentLocation.lng])) {
      map.setView([currentLocation.lat, currentLocation.lng], map.getZoom())
      setMapCenter([currentLocation.lat, currentLocation.lng])
    }
  }, [currentLocation, locations, currentUserId, map, setMapCenter])
  
  useEffect(() => {
    const handleMoveEnd = () => {
      const center = map.getCenter()
      setMapCenter([center.lat, center.lng])
      setMapBounds(map.getBounds())
    }
    
    map.on('moveend', handleMoveEnd)
    setMapBounds(map.getBounds())
    
    return () => map.off('moveend', handleMoveEnd)
  }, [map, setMapCenter, setMapBounds])
  
  return null
}

function MapView({ locations, currentLocation, currentUserId, isTracking, myLocationHistory }) {
  // 기본 중심점 (광주 시청)
  const center = [35.1595, 126.8526]
  const [mapType, setMapType] = useState('street')
  const [showEmergency, setShowEmergency] = useState(false)
  const [showTraffic, setShowTraffic] = useState(true)
  const [mapCenter, setMapCenter] = useState(center)
  const [mapBounds, setMapBounds] = useState(null)
  const [emergencyLocations, setEmergencyLocations] = useState({ hospitals: [], police: [], stations: [] })
  const [showDangerZones, setShowDangerZones] = useState(false)
  const [dangerAnalysis, setDangerAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState(null)
  const [showSafetyTips, setShowSafetyTips] = useState(false)
  const [mapInstance, setMapInstance] = useState(null)
  const [isMapRotating, setIsMapRotating] = useState(false)
  
  // 실제 응급시설 API 호출
  const fetchEmergencyFacilities = useCallback(async () => {
    if (!mapBounds || !showEmergency) return
    
    try {
      const bounds = mapBounds
      const south = bounds.getSouth()
      const west = bounds.getWest()
      const north = bounds.getNorth()
      const east = bounds.getEast()
      
      const query = `[out:json][timeout:25];(node["amenity"="hospital"](${south},${west},${north},${east});node["amenity"="police"](${south},${west},${north},${east});node["amenity"="fire_station"](${south},${west},${north},${east}););out geom;`
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      })
      
      if (response.ok) {
        const data = await response.json()
        const hospitals = []
        const police = []
        const stations = []
        
        data.elements.forEach(element => {
          if (element.tags) {
            const facility = {
              name: element.tags.name || '이름 없음',
              lat: element.lat,
              lng: element.lon
            }
            
            if (element.tags.amenity === 'hospital') {
              hospitals.push(facility)
            } else if (element.tags.amenity === 'police') {
              police.push(facility)
            } else if (element.tags.amenity === 'fire_station') {
              stations.push(facility)
            }
          }
        })
        
        setEmergencyLocations({ hospitals, police, stations })
      }
    } catch (error) {
      console.error('응급시설 데이터 로드 실패:', error)
    }
  }, [mapBounds, showEmergency])
  
  useEffect(() => {
    fetchEmergencyFacilities()
  }, [fetchEmergencyFacilities])

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
        emergencyFacilities: emergencyLocations
      });

      if (result.success) {
        setDangerAnalysis(result.data);
        setAnalysisError(null);

        // 음성 알림 (전체 위험도가 medium 이상일 때)
        if (result.data.overallRiskLevel === 'high') {
          console.log('⚠️ 높은 위험도 감지:', result.data);
        } else if (result.data.overallRiskLevel === 'medium') {
          console.log('⚡ 중간 위험도 감지:', result.data);
        }
      } else {
        // API 키 없거나 에러 발생 시에도 기본 정보 표시
        if (result.error === 'OpenAI API key not configured') {
          console.warn('💡 OpenAI API 키가 설정되지 않았습니다. 기본 안전 정보를 표시합니다.');
          console.info('API 키 설정 방법: .env 파일에 VITE_OPENAI_API_KEY=your_key 추가');
          setAnalysisError('API 키 없음 (기본 정보 사용)');
        } else {
          console.warn('위험 분석 실패:', result.error);
          setAnalysisError(result.error);
        }
        setDangerAnalysis(result.data); // 기본 안전 정보 사용
      }
    } catch (error) {
      console.error('위험 분석 오류:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentLocation, isTracking, showDangerZones, myLocationHistory, emergencyLocations]);

  // 위험 지역 토글 시에만 초기 분석 실행 (위치 변경 시 재실행 안 함)
  useEffect(() => {
    if (showDangerZones && isTracking && currentLocation) {
      analyzeCurrentDanger();
    }
  }, [showDangerZones]); // analyzeCurrentDanger 의존성 제거하여 위치 변경 시 재실행 방지

  // 위치 추적 중지 시 위험도 예측 초기화
  useEffect(() => {
    const handleClearDangerAnalysis = () => {
      setDangerAnalysis(null)
      setShowDangerZones(false)
      setShowSafetyTips(false)
      setAnalysisError(null)
    }

    window.addEventListener('clearDangerAnalysis', handleClearDangerAnalysis)
    return () => window.removeEventListener('clearDangerAnalysis', handleClearDangerAnalysis)
  }, [])

  // 5분마다 위험 분석 업데이트 (추적 중일 때만)
  useEffect(() => {
    if (!showDangerZones || !isTracking) return;

    const interval = setInterval(() => {
      analyzeCurrentDanger();
    }, 300000); // 5분(300초)마다 업데이트

    return () => clearInterval(interval);
  }, [showDangerZones, isTracking, analyzeCurrentDanger])
  
  const mapTypes = useMemo(() => ({
    street: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
    },
    detailed: {
      url: 'https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    terrain: {
      url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
    }
  }), [])

  return (
    <div style={{ position: 'relative' }}>
      {/* 동작하는 나침판 */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        zIndex: 999
      }}>
        <Compass />
      </div>
      
      {/* AI 위험 분석 버튼 (지도 버튼 왼쪽) */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '46px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <button
          className={`map-type-btn ${showDangerZones ? 'active' : ''}`}
          onClick={() => setShowDangerZones(!showDangerZones)}
          disabled={!isTracking}
          title={isTracking ? 'AI 위험 분석 토글' : '위치 추적을 시작하세요'}
        >
          🤖
        </button>

        {/* 안전 팁 알림 버튼 */}
        {showDangerZones && dangerAnalysis && (
          <button
            className={`map-type-btn ${showSafetyTips ? 'active' : ''}`}
            onClick={() => setShowSafetyTips(!showSafetyTips)}
            title="안전 팁 보기"
            style={{
              backgroundColor: dangerAnalysis.overallRiskLevel === 'high' ? 'rgba(255, 51, 51, 0.9)' :
                             dangerAnalysis.overallRiskLevel === 'medium' ? 'rgba(255, 136, 0, 0.9)' : 'rgba(255, 100, 100, 0.85)'
            }}
          >
            💡
          </button>
        )}
      </div>

      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <button
          className={`map-type-btn ${mapType === 'street' ? 'active' : ''}`}
          onClick={() => setMapType('street')}
        >
          🗺️
        </button>
        <button
          className={`map-type-btn ${mapType === 'satellite' ? 'active' : ''}`}
          onClick={() => setMapType('satellite')}
        >
          🛰️
        </button>
        <button
          className={`map-type-btn ${mapType === 'detailed' ? 'active' : ''}`}
          onClick={() => setMapType('detailed')}
        >
          🏢
        </button>
        <button
          className={`map-type-btn ${mapType === 'terrain' ? 'active' : ''}`}
          onClick={() => setMapType('terrain')}
        >
          ⛰️
        </button>
        <button
          className={`map-type-btn ${showEmergency ? 'active' : ''}`}
          onClick={() => setShowEmergency(!showEmergency)}
        >
          🚨
        </button>
        <button
          className={`map-type-btn ${showTraffic ? 'active' : ''}`}
          onClick={() => setShowTraffic(!showTraffic)}
        >
          🚗
        </button>
      </div>

      {/* 안전 팁 팝업 */}
      {showDangerZones && dangerAnalysis && showSafetyTips && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '70px',
          zIndex: 10000,
          backgroundColor: 'rgba(42, 42, 42, 0.98)',
          padding: '16px',
          borderRadius: '8px',
          border: '2px solid ' + (dangerAnalysis.overallRiskLevel === 'high' ? '#ff3333' :
                                  dangerAnalysis.overallRiskLevel === 'medium' ? '#ff8800' : '#00ff88'),
          maxWidth: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          boxShadow: '0 6px 12px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: dangerAnalysis.overallRiskLevel === 'high' ? '#ff3333' :
                     dangerAnalysis.overallRiskLevel === 'medium' ? '#ff8800' : '#00ff88'
            }}>
              {isAnalyzing ? '🔄 분석 중...' :
               dangerAnalysis.overallRiskLevel === 'high' ? '⚠️ 높은 주의 필요' :
               dangerAnalysis.overallRiskLevel === 'medium' ? '⚡ 주의 필요' : '✅ 안전'}
            </div>
            <button
              onClick={() => setShowSafetyTips(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#aaa',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '0 4px'
              }}
            >
              ✕
            </button>
          </div>

          {analysisError && (
            <div style={{
              fontSize: '0.75rem',
              color: '#ffaa00',
              backgroundColor: 'rgba(255, 170, 0, 0.1)',
              padding: '6px 10px',
              borderRadius: '4px',
              marginBottom: '12px',
              border: '1px solid rgba(255, 170, 0, 0.3)'
            }}>
              💡 {analysisError}
            </div>
          )}

          <div style={{ fontSize: '0.9rem', color: '#cccccc' }}>
            <strong style={{ color: '#fff', fontSize: '1rem' }}>안전 팁</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', listStyle: 'none' }}>
              {dangerAnalysis.safetyTips?.map((tip, idx) => (
                <li key={idx} style={{
                  marginBottom: '8px',
                  lineHeight: '1.5',
                  paddingLeft: '8px',
                  borderLeft: '3px solid ' + (dangerAnalysis.overallRiskLevel === 'high' ? '#ff3333' :
                                              dangerAnalysis.overallRiskLevel === 'medium' ? '#ff8800' : '#00ff88')
                }}>
                  • {tip}
                </li>
              ))}
            </ul>
          </div>

          {dangerAnalysis.dangerZones?.length > 0 && (
            <div style={{
              fontSize: '0.85rem',
              color: '#aaa',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #555'
            }}>
              📍 {dangerAnalysis.dangerZones.length}개 주의 지역이 지도에 표시되었습니다
            </div>
          )}
        </div>
      )}
      <MapContainer
        center={center}
        zoom={14}
        className="map-container"
      >
        <MapUpdater 
          currentLocation={currentLocation} 
          locations={locations} 
          currentUserId={currentUserId} 
          setMapCenter={setMapCenter} 
          setMapBounds={setMapBounds}
          setMapInstance={setMapInstance}
        />
        <TileLayer
          key={mapType}
          url={mapTypes[mapType].url}
          attribution={mapTypes[mapType].attribution}
        />
        
        {/* 실시간 교통상황 레이어 */}
        {showTraffic && (
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=h@221097413,traffic&x={x}&y={y}&z={z}"
            attribution="Google Traffic"
            opacity={0.7}
          />
        )}
      
        {/* 현재 사용자 위치 */}
        {currentLocation && (
          <Marker 
            position={[currentLocation.lat, currentLocation.lng]}
            icon={createUserMarkerIcon()}
          >
            <Popup>
              <strong>내 위치 ({currentUserId})</strong><br/>
              위도: {currentLocation.lat.toFixed(6)}<br/>
              경도: {currentLocation.lng.toFixed(6)}
            </Popup>
          </Marker>
        )}
        
        {/* 다른 사용자들의 현재 위치만 표시 */}
        {useMemo(() => {
          // 각 사용자의 최신 위치만 추출
          const latestLocations = new Map()
          locations.forEach(location => {
            if (location.userId !== currentUserId) {
              latestLocations.set(location.userId, location)
            }
          })
          
          return Array.from(latestLocations.values()).map((location) => (
            <Marker 
              key={`current-${location.userId}`}
              position={[location.lat, location.lng]}
              icon={createOtherUserMarkerIcon()}
              zIndexOffset={1000}
            >
              <Popup>
                <strong>{location.userId} (현재 위치)</strong><br/>
                위도: {location.lat.toFixed(6)}<br/>
                경도: {location.lng.toFixed(6)}<br/>
                시간: {new Date(location.timestamp).toLocaleString()}
              </Popup>
            </Marker>
          ))
        }, [locations, currentUserId])}
        
        {/* 응급시설 마커 */}
        {showEmergency && (
          <>
            {emergencyLocations.hospitals.map((hospital, index) => (
              <Marker
                key={`hospital-${hospital.lat}-${hospital.lng}`}
                position={[hospital.lat, hospital.lng]}
                icon={L.divIcon({
                  html: `<div style="background-color: #ff4444; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 8px;">🏥</div>`,
                  className: 'emergency-marker',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })}
                zIndexOffset={500}
              >
                <Popup>
                  <strong>🏥 {hospital.name}</strong><br/>
                  병원<br/>
                  위도: {hospital.lat.toFixed(6)}<br/>
                  경도: {hospital.lng.toFixed(6)}
                </Popup>
              </Marker>
            ))}
            
            {emergencyLocations.police.map((station, index) => (
              <Marker
                key={`police-${station.lat}-${station.lng}`}
                position={[station.lat, station.lng]}
                icon={L.divIcon({
                  html: `<div style="background-color: #4444ff; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 8px;">🚔</div>`,
                  className: 'emergency-marker',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })}
                zIndexOffset={500}
              >
                <Popup>
                  <strong>🚔 {station.name}</strong><br/>
                  경찰서<br/>
                  위도: {station.lat.toFixed(6)}<br/>
                  경도: {station.lng.toFixed(6)}
                </Popup>
              </Marker>
            ))}
            
            {emergencyLocations.stations.map((station, index) => (
              <Marker
                key={`station-${station.lat}-${station.lng}`}
                position={[station.lat, station.lng]}
                icon={L.divIcon({
                  html: `<div style="background-color: #00aa44; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 7px;">🛡️</div>`,
                  className: 'emergency-marker',
                  iconSize: [14, 14],
                  iconAnchor: [7, 7]
                })}
                zIndexOffset={400}
              >
                <Popup>
                  <strong>🛡️ {station.name}</strong><br/>
                  파출소<br/>
                  위도: {station.lat.toFixed(6)}<br/>
                  경도: {station.lng.toFixed(6)}
                </Popup>
              </Marker>
            ))}
          </>
        )}

        {/* AI 위험 지역 오버레이 */}
        {showDangerZones && dangerAnalysis && (
          <DangerZoneOverlay dangerZones={dangerAnalysis.dangerZones} />
        )}
      </MapContainer>
    </div>
  )
}

export default MapView