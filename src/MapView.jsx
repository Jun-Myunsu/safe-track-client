import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { useEffect } from 'react'
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
function MapUpdater({ currentLocation, locations, currentUserId }) {
  const map = useMap()
  
  useEffect(() => {
    // 공유받은 다른 사용자의 위치가 있으면 그 위치를 우선 표시
    const otherUserLocations = locations.filter(loc => loc.userId !== currentUserId)
    if (otherUserLocations.length > 0) {
      const latestLocation = otherUserLocations[otherUserLocations.length - 1]
      map.setView([latestLocation.lat, latestLocation.lng], 16)
    }
    // 공유받은 위치가 없고 내 위치가 있으면 내 위치로 이동
    else if (currentLocation) {
      map.setView([currentLocation.lat, currentLocation.lng], 16)
    }
  }, [currentLocation, locations, currentUserId, map])
  
  return null
}

function MapView({ locations, currentLocation, currentUserId, userPaths }) {
  // 기본 중심점 (광주 시청)
  const center = [35.1595, 126.8526]
    
  console.log('MapView - userPaths:', userPaths)
  console.log('MapView - locations:', locations)

  return (
    <MapContainer 
      center={center} 
      zoom={14} 
      className="map-container"
    >
      <MapUpdater currentLocation={currentLocation} locations={locations} currentUserId={currentUserId} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
    </MapContainer>
  )
}

export default MapView