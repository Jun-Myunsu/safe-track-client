// ITS 도로 CCTV API 호출 함수
export const fetchRoadCCTV = async (bounds) => {
  const apiKey = import.meta.env.VITE_ITS_API_KEY;
  if (!apiKey) {
    console.warn('ITS API 키가 설정되지 않았습니다.');
    return [];
  }

  try {
    const params = new URLSearchParams({
      apiKey: apiKey,
      type: 'all',
      cctvType: '1',
      minX: bounds.getWest().toString(),
      maxX: bounds.getEast().toString(),
      minY: bounds.getSouth().toString(),
      maxY: bounds.getNorth().toString(),
      getType: 'json'
    });

    const response = await fetch(`https://openapi.its.go.kr:9443/cctvInfo?${params}`);
    const data = await response.json();

    if (data.response && data.response.data) {
      return Array.isArray(data.response.data) 
        ? data.response.data.map((cctv, index) => ({
            id: `cctv-${index}-${cctv.coordx}-${cctv.coordy}`,
            name: cctv.cctvname || 'CCTV',
            lat: parseFloat(cctv.coordy),
            lng: parseFloat(cctv.coordx),
            streamUrl: cctv.cctvurl,
            type: 'hls',
            format: cctv.cctvformat,
            resolution: cctv.cctvresolution
          }))
        : [{
            id: `cctv-0-${data.response.data.coordx}-${data.response.data.coordy}`,
            name: data.response.data.cctvname || 'CCTV',
            lat: parseFloat(data.response.data.coordy),
            lng: parseFloat(data.response.data.coordx),
            streamUrl: data.response.data.cctvurl,
            type: 'hls',
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
