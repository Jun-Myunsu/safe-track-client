// ITS 도로 CCTV API 호출 함수 (프론트엔드 직접 호출)
export const fetchRoadCCTV = async (bounds) => {
  try {
    const apiKey = import.meta.env.VITE_ITS_API_KEY;
    if (!apiKey) {
      console.error('VITE_ITS_API_KEY 환경변수가 설정되지 않았습니다.');
      console.info('프론트엔드 .env 파일에 VITE_ITS_API_KEY=your_key 를 추가하세요.');
      return [];
    }

    const params = new URLSearchParams({
      apiKey,
      type: 'all',
      cctvType: '4', // HLS (HTTPS)
      minX: bounds.getWest().toString(),
      maxX: bounds.getEast().toString(),
      minY: bounds.getSouth().toString(),
      maxY: bounds.getNorth().toString(),
      getType: 'json'
    });

    console.log('CCTV API 직접 호출:', {
      bounds: {
        west: bounds.getWest().toFixed(4),
        east: bounds.getEast().toFixed(4),
        south: bounds.getSouth().toFixed(4),
        north: bounds.getNorth().toFixed(4)
      },
      timestamp: new Date().toISOString()
    });

    const response = await fetch(`https://openapi.its.go.kr:9443/cctvInfo?${params}`, {
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
      const cctvList = items.map((cctv, index) => ({
        id: `cctv-${index}-${cctv.coordx}-${cctv.coordy}`,
        name: cctv.cctvname || 'CCTV',
        lat: parseFloat(cctv.coordy),
        lng: parseFloat(cctv.coordx),
        streamUrl: cctv.cctvurl,
        cctvType: '4',
        format: cctv.cctvformat,
        resolution: cctv.cctvresolution
      }));

      console.log(`✅ ${cctvList.length}개 CCTV 로드 완료`);
      return cctvList;
    }

    return [];
  } catch (error) {
    console.error('❌ CCTV 데이터 로드 실패:', error.message || error);
    return [];
  }
};

// CCTV 타입 설명
export const CCTV_TYPES = {
  '1': 'HLS (HTTP)',
  '2': 'MP4 (HTTP)',
  '4': 'HLS (HTTPS)',
  '5': 'MP4 (HTTPS)'
};
