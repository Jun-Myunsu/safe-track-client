// ITS 돌발정보 API 호출 함수 (프론트엔드 직접 호출)
export const fetchIncidentInfo = async (bounds) => {
  try {
    const apiKey = import.meta.env.VITE_ITS_API_KEY;
    if (!apiKey) {
      console.error('VITE_ITS_API_KEY 환경변수가 설정되지 않았습니다.');
      return [];
    }

    const params = new URLSearchParams({
      apiKey,
      type: 'all',
      eventType: 'all',
      minX: bounds.getWest().toString(),
      maxX: bounds.getEast().toString(),
      minY: bounds.getSouth().toString(),
      maxY: bounds.getNorth().toString(),
      getType: 'json'
    });

    console.log('돌발정보 API 직접 호출:', {
      bounds: {
        west: bounds.getWest().toFixed(4),
        east: bounds.getEast().toFixed(4),
        south: bounds.getSouth().toFixed(4),
        north: bounds.getNorth().toFixed(4)
      },
      timestamp: new Date().toISOString()
    });

    const response = await fetch(`https://openapi.its.go.kr:9443/eventInfo?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.response && data.response.data) {
      const items = Array.isArray(data.response.data) ? data.response.data : [data.response.data];
      const incidentList = items.map((incident, index) => ({
        id: `incident-${index}-${incident.coordx}-${incident.coordy}`,
        type: incident.eventtype,
        typeName: EVENT_TYPES[incident.eventtype] || incident.eventtype,
        message: incident.message || '돌발 상황',
        lat: parseFloat(incident.coordy),
        lng: parseFloat(incident.coordx),
        startDate: incident.startdate,
        endDate: incident.enddate,
        lanesBlocked: incident.lanesblocked
      }));

      console.log(`✅ ${incidentList.length}개 돌발정보 로드 완료`);
      return incidentList;
    }

    return [];
  } catch (error) {
    console.error('❌ 돌발정보 데이터 로드 실패:', error.message || error);
    return [];
  }
};

// 돌발 유형 설명
export const EVENT_TYPES = {
  'acc': '사고',
  'congestion': '정체',
  'construct': '공사',
  'event': '행사',
  'other': '기타'
};
