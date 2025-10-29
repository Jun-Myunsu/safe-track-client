// ITS 돌발정보 API 호출 함수 (프론트엔드 직접 호출)
export const fetchRoadEvents = async (bounds) => {
  try {
    const apiKey = import.meta.env.VITE_ITS_API_KEY;
    if (!apiKey) {
      console.error('VITE_ITS_API_KEY 환경변수가 설정되지 않았습니다.');
      console.info('프론트엔드 .env 파일에 VITE_ITS_API_KEY=your_key 를 추가하세요.');
      return [];
    }

    // 지도 중심 기준 5km 반경
    const centerLat = (bounds.getNorth() + bounds.getSouth()) / 2;
    const centerLng = (bounds.getEast() + bounds.getWest()) / 2;
    const latDiff = 0.045; // 약 5km
    const lngDiff = 0.045; // 약 5km

    const params = new URLSearchParams({
      apiKey,
      type: 'all',
      eventType: 'all',
      minX: (centerLng - lngDiff).toString(),
      maxX: (centerLng + lngDiff).toString(),
      minY: (centerLat - latDiff).toString(),
      maxY: (centerLat + latDiff).toString(),
      getType: 'json'
    });

    const url = `https://openapi.its.go.kr:9443/eventInfo?${params}`;
    console.log('🚨 돌발정보 API 호출 URL:', url);
    console.log('돌발정보 API 직접 호출:', {
      bounds: {
        west: bounds.getWest().toFixed(4),
        east: bounds.getEast().toFixed(4),
        south: bounds.getSouth().toFixed(4),
        north: bounds.getNorth().toFixed(4)
      },
      timestamp: new Date().toISOString()
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.body && data.body.items) {
      const items = Array.isArray(data.body.items) ? data.body.items : [data.body.items];
      const eventList = items.map((event, index) => ({
        id: `event-${index}-${event.coordX}-${event.coordY}`,
        eventType: event.type === '1' ? '교통사고' : event.type === '2' ? '공사' : event.type === '3' ? '기상' : event.type === '4' ? '재난' : '기타',
        roadName: event.roadName || '도로명 없음',
        roadDrcType: event.roadDrcType,
        message: event.message || '상세 정보 없음',
        lanesBlocked: event.lanesBlocked,
        startDate: event.startDate,
        lat: parseFloat(event.coordY),
        lng: parseFloat(event.coordX)
      }));

      console.log(`✅ ${eventList.length}개 돌발정보 로드 완료`);
      return eventList;
    }

    return [];
  } catch (error) {
    console.error('❌ 돌발정보 데이터 로드 실패:', error.message || error);
    return [];
  }
};
