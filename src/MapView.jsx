import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'

// 기본 마커 아이콘 설정
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// 사용자별 마커 색상
const createColoredIcon = (color) => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })
}

const userColors = {
  'user1': '#ff4444',
  'user2': '#44ff44', 
  'user3': '#4444ff',
  'user4': '#ffff44',
  'user5': '#ff44ff'
}

// 지도 중심 업데이트 컴포넌트
function MapUpdater({ currentLocation, locations, currentUserId, setMapCenter, setMapBounds }) {
  const map = useMap()
  
  useEffect(() => {
    // 공유받은 다른 사용자의 위치가 있으면 그 위치를 우선 표시
    const otherUserLocations = locations.filter(loc => loc.userId !== currentUserId)
    if (otherUserLocations.length > 0) {
      const latestLocation = otherUserLocations[otherUserLocations.length - 1]
      const bounds = map.getBounds()
      if (!bounds.contains([latestLocation.lat, latestLocation.lng])) {
        map.setView([latestLocation.lat, latestLocation.lng], map.getZoom())
        setMapCenter([latestLocation.lat, latestLocation.lng])
      }
    }
    // 공유받은 위치가 없고 내 위치가 있으면서 지도 밖에 있을 때만 이동
    else if (currentLocation) {
      const bounds = map.getBounds()
      if (!bounds.contains([currentLocation.lat, currentLocation.lng])) {
        map.setView([currentLocation.lat, currentLocation.lng], map.getZoom())
        setMapCenter([currentLocation.lat, currentLocation.lng])
      }
    }
  }, [currentLocation, locations, currentUserId, map, setMapCenter])
  
  useEffect(() => {
    const handleMoveEnd = () => {
      const center = map.getCenter()
      const bounds = map.getBounds()
      setMapCenter([center.lat, center.lng])
      setMapBounds(bounds)
    }
    
    map.on('moveend', handleMoveEnd)
    setMapBounds(map.getBounds())
    
    return () => map.off('moveend', handleMoveEnd)
  }, [map, setMapCenter, setMapBounds])
  
  return null
}

function MapView({ locations, currentLocation, currentUserId, userPaths, isTracking, myLocationHistory }) {
  // 기본 중심점 (광주 시청)
  const center = [35.1595, 126.8526]
  const [mapType, setMapType] = useState('street')
  const [showEmergency, setShowEmergency] = useState(false)
  const [mapCenter, setMapCenter] = useState(center)
  const [mapBounds, setMapBounds] = useState(null)
  const [emergencyLocations, setEmergencyLocations] = useState({ hospitals: [], police: [], stations: [] })
  const [myPath, setMyPath] = useState([])
  
  // 내 위치 히스토리로 경로 업데이트
  useEffect(() => {
    if (myLocationHistory && myLocationHistory.length > 1 && isTracking) {
      const pathCoords = myLocationHistory.map(loc => [loc.lat, loc.lng])
      setMyPath(pathCoords)
    } else if (!isTracking) {
      setMyPath([])
    }
  }, [myLocationHistory, isTracking])
  
  // 응급시설 표시 조건 (수동 토글만)
  const shouldShowEmergency = showEmergency
  
  // 실제 응급시설 API 호출
  useEffect(() => {
    if (!mapBounds || !shouldShowEmergency) return
    
    const fetchEmergencyFacilities = async () => {
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
    }
    
    fetchEmergencyFacilities()
  }, [mapBounds, shouldShowEmergency])
  

  
  const mapTypes = {
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
  }
    
  console.log('MapView - userPaths:', userPaths)
  console.log('MapView - locations:', locations)

  return (
    <div style={{ position: 'relative' }}>
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
      </div>
      <MapContainer
        center={center}
        zoom={14}
        className="map-container"
      >
        <MapUpdater currentLocation={currentLocation} locations={locations} currentUserId={currentUserId} setMapCenter={setMapCenter} setMapBounds={setMapBounds} />
        <TileLayer
          key={mapType}
          url={mapTypes[mapType].url}
          attribution={mapTypes[mapType].attribution}
        />
      
      {/* 현재 사용자 위치 */}
      {currentLocation && (
        <Marker 
          position={[currentLocation.lat, currentLocation.lng]}
          icon={L.divIcon({
            html: `<div style="background-color: #ff0000; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">나</div>`,
            className: 'current-user-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })}
        >
          <Popup>
            <strong>내 위치 ({currentUserId})</strong><br/>
            위도: {currentLocation.lat.toFixed(6)}<br/>
            경도: {currentLocation.lng.toFixed(6)}
          </Popup>
        </Marker>
      )}
      

      
      {/* 다른 사용자들의 현재 위치만 표시 */}
      {(() => {
        // 각 사용자의 최신 위치만 추출
        const latestLocations = new Map()
        locations.forEach(location => {
          if (location.userId !== currentUserId) {
            latestLocations.set(location.userId, location)
          }
        })
        
        return Array.from(latestLocations.values()).map((location) => {
          const color = userColors[location.userId] || '#666666'
          
          return (
            <Marker 
              key={`current-${location.userId}`}
              position={[location.lat, location.lng]}
              icon={L.divIcon({
                html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">${location.userId.charAt(0).toUpperCase()}</div>`,
                className: 'current-location-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })}
              zIndexOffset={1000}
            >
              <Popup>
                <strong>{location.userId} (현재 위치)</strong><br/>
                위도: {location.lat.toFixed(6)}<br/>
                경도: {location.lng.toFixed(6)}<br/>
                시간: {new Date(location.timestamp).toLocaleString()}
              </Popup>
            </Marker>
          )
        })
      })()}
      
      {/* 응급시설 마커 */}
      {shouldShowEmergency && (
        <>
          {emergencyLocations.hospitals.map((hospital, index) => (
            <Marker
              key={`hospital-${index}`}
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
              key={`police-${index}`}
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
              key={`station-${index}`}
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
      
      {/* 내 이동 경로 */}
      {myPath.length > 1 && (
        <Polyline
          positions={myPath}
          color="#ff0000"
          weight={3}
          opacity={0.8}
        />
      )}
      </MapContainer>
      

    </div>
  )
}

export default MapView