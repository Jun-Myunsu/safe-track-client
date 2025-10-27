// ITS 도로 CCTV API 호출 함수 (서버 프록시)
export const fetchRoadCCTV = async (bounds) => {
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

  try {
    const params = new URLSearchParams({
      minX: bounds.getWest().toString(),
      maxX: bounds.getEast().toString(),
      minY: bounds.getSouth().toString(),
      maxY: bounds.getNorth().toString()
    });

    const response = await fetch(`${serverUrl}/api/cctv?${params}`);
    const data = await response.json();

    if (data.response && data.response.data) {
      return Array.isArray(data.response.data) 
        ? data.response.data.map((cctv, index) => ({
            id: `cctv-${index}-${cctv.coordx}-${cctv.coordy}`,
            name: cctv.cctvname || 'CCTV',
            lat: parseFloat(cctv.coordy),
            lng: parseFloat(cctv.coordx),
            streamUrl: cctv.cctvurl,
            cctvType: cctv.cctvType || '1',
            format: cctv.cctvformat,
            resolution: cctv.cctvresolution
          }))
        : [{
            id: `cctv-0-${data.response.data.coordx}-${data.response.data.coordy}`,
            name: data.response.data.cctvname || 'CCTV',
            lat: parseFloat(data.response.data.coordy),
            lng: parseFloat(data.response.data.coordx),
            streamUrl: data.response.data.cctvurl,
            cctvType: data.response.data.cctvType || '1',
            format: data.response.data.cctvformat,
            resolution: data.response.data.cctvresolution
          }];
    }
    return [];
  } catch (error) {
    console.error('CCTV 데이터 로드 실패:', error);
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
