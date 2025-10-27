// 지도 관련 유틸리티 함수들

/**
 * Haversine 공식을 사용한 정확한 거리 계산 (미터)
 */
export function getDistanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 경로가 위험 지역과 교차하는지 확인
 */
export function routeIntersectsDangerZone(routeCoords, dangerZones) {
  if (!dangerZones || dangerZones.length === 0) return { intersects: false, count: 0 };
  
  let intersectionCount = 0;
  const intersectedZones = [];
  
  for (const zone of dangerZones) {
    let zoneIntersected = false;
    
    for (let i = 0; i < routeCoords.length; i++) {
      const [lat, lng] = routeCoords[i];
      const distance = getDistanceInMeters(lat, lng, zone.lat, zone.lng);
      
      if (distance <= zone.radius) {
        zoneIntersected = true;
        break;
      }
      
      if (i < routeCoords.length - 1) {
        const [nextLat, nextLng] = routeCoords[i + 1];
        const midLat = (lat + nextLat) / 2;
        const midLng = (lng + nextLng) / 2;
        const midDistance = getDistanceInMeters(midLat, midLng, zone.lat, zone.lng);
        
        if (midDistance <= zone.radius) {
          zoneIntersected = true;
          break;
        }
      }
    }
    
    if (zoneIntersected) {
      intersectedZones.push(zone);
      intersectionCount++;
    }
  }
  
  return { intersects: intersectionCount > 0, count: intersectionCount, zones: intersectedZones };
}

/**
 * OSRM 길찾기 API 호출
 */
export async function getRoute(start, end, dangerZones = []) {
  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const safety = routeIntersectsDangerZone(coords, dangerZones);
      
      return {
        ...route,
        coords,
        safety
      };
    }
    return null;
  } catch (error) {
    console.error('경로 검색 실패:', error);
    return null;
  }
}
