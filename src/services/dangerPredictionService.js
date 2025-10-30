/**
 * 서버 API를 통한 위험 지역 예측 서비스
 * 실시간 위치 데이터, 교통 정보, 시간대 등을 분석하여 위험도를 평가
 */

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

// 위험 예측 분석 범위 (미터)
export const DANGER_ANALYSIS_RADIUS = 5000; // 도보 약 1시간 거리

/**
 * 기본 안전 정보 생성 (API 키 없을 때 또는 에러 시)
 * @param {Object} currentLocation - 현재 위치
 * @param {Date} timestamp - 현재 시간
 * @param {Object} emergencyFacilities - 응급 시설 정보
 * @returns {Object} 기본 안전 정보
 */
const generateDefaultSafetyInfo = (currentLocation, timestamp, emergencyFacilities) => {
  const hour = timestamp.getHours();
  const isNight = hour >= 22 || hour < 6;
  const hasEmergencyFacilities =
    (emergencyFacilities.hospitals?.length || 0) +
    (emergencyFacilities.police?.length || 0) +
    (emergencyFacilities.stations?.length || 0) > 0;

  const safetyTips = [
    '주변을 주의 깊게 살피세요',
    isNight ? '밝은 곳으로 이동하고 어두운 길은 피하세요' : '사람이 많은 길로 이동하세요',
    '비상시 112 (경찰) 또는 119 (구급)에 연락하세요',
    hasEmergencyFacilities ? '주변 응급시설 위치를 확인하세요 (🚨 버튼)' : '가까운 안전한 장소를 파악하세요',
    '가족이나 친구에게 현재 위치를 공유하세요'
  ];

  // 현재 위치 기준으로 가상의 주의 지역 생성 (교육용)
  const dangerZones = [
    {
      lat: currentLocation.lat + 0.002,
      lng: currentLocation.lng + 0.002,
      radius: 300,
      riskLevel: 'low',
      reason: isNight ? '야간 시간대로 가시성이 낮을 수 있습니다' : '일반적인 주의가 필요합니다',
      recommendations: [
        '주변을 잘 살피며 이동하세요',
        isNight ? '밝은 곳으로 이동하세요' : '사람이 많은 곳으로 이동하세요'
      ]
    }
  ];

  return {
    overallRiskLevel: isNight ? 'medium' : 'low',
    dangerZones,
    safetyTips,
    analysisTimestamp: timestamp.toISOString()
  };
};

/**
 * 위치 데이터를 기반으로 위험 지역 예측
 * @param {Object} params - 예측에 필요한 파라미터
 * @param {Array} params.locationHistory - 위치 이동 기록
 * @param {Object} params.currentLocation - 현재 위치 정보
 * @param {number} params.currentLocation.lat - 위도
 * @param {number} params.currentLocation.lng - 경도
 * @param {Date} params.timestamp - 현재 시간
 * @param {Array} params.emergencyFacilities - 주변 응급 시설 정보
 * @returns {Promise<Object>} 위험 지역 정보
 */
export const analyzeDangerZones = async ({
  locationHistory = [],
  currentLocation,
  timestamp = new Date(),
  emergencyFacilities = { hospitals: [], police: [], stations: [] }
}) => {
  try {
    // 서버 API로 요청 전송
    const response = await fetch(`${SERVER_URL}/api/danger-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        locationHistory,
        currentLocation,
        emergencyFacilities,
        analysisRadius: DANGER_ANALYSIS_RADIUS
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // 서버에서 이미 success 여부를 반환하므로 그대로 사용
    if (!result.success) {
      console.warn('⚠️ 서버에서 기본 안전 정보를 제공합니다.');
      if (result.error === 'OpenAI API key not configured') {
        console.info('서버에 OpenAI API 키가 설정되지 않았습니다.');
      }
    }

    return result;

  } catch (error) {
    console.error('Danger prediction error:', error);

    // 서버 연결 실패 시 기본 안전 정보 반환
    return {
      success: false,
      error: error.message,
      data: generateDefaultSafetyInfo(currentLocation, timestamp, emergencyFacilities)
    };
  }
};

/**
 * 위험 지역 색상 가져오기
 * @param {string} riskLevel - 위험도 (safe, low, medium, high)
 * @returns {string} 색상 코드
 */
export const getDangerZoneColor = (riskLevel) => {
  const colors = {
    safe: 'rgba(0, 255, 136, 0.2)',    // 초록색 (안전)
    low: 'rgba(255, 255, 0, 0.2)',     // 노란색 (주의)
    medium: 'rgba(255, 165, 0, 0.3)',  // 오렌지색 (경고)
    high: 'rgba(255, 0, 0, 0.4)'       // 빨간색 (위험)
  };
  return colors[riskLevel] || colors.low;
};

/**
 * 위험 지역 테두리 색상 가져오기
 * @param {string} riskLevel - 위험도 (safe, low, medium, high)
 * @returns {string} 색상 코드
 */
export const getDangerZoneBorderColor = (riskLevel) => {
  const colors = {
    safe: 'rgba(0, 255, 136, 0.7)',    // 초록색 (안전)
    low: 'rgba(255, 255, 0, 0.6)',     // 노란색 (주의)
    medium: 'rgba(255, 165, 0, 0.7)',  // 오렌지색 (경고)
    high: 'rgba(255, 0, 0, 0.8)'       // 빨간색 (위험)
  };
  return colors[riskLevel] || colors.low;
};

export default {
  analyzeDangerZones,
  getDangerZoneColor,
  getDangerZoneBorderColor
};
