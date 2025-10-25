import OpenAI from 'openai';

/**
 * OpenAI API를 활용한 위험 지역 예측 서비스
 * 실시간 위치 데이터, 교통 정보, 시간대 등을 분석하여 위험도를 평가
 */

let openai = null;

// OpenAI 클라이언트 초기화
const initializeOpenAI = () => {
  if (!openai) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OpenAI API key not found in environment variables');
      return false;
    }
    openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // 클라이언트 측에서 사용
    });
  }
  return true;
};

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
  if (!initializeOpenAI()) {
    console.warn('⚠️ OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
    console.info('Returning default safety information instead.');

    // API 키 없이도 기본 안전 정보 제공
    return {
      success: false,
      error: 'OpenAI API key not configured',
      data: generateDefaultSafetyInfo(currentLocation, timestamp, emergencyFacilities)
    };
  }

  try {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isNight = hour >= 22 || hour < 6;
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);

    // AI에게 전달할 컨텍스트 구성
    const context = {
      currentLocation: {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        address: `위도 ${currentLocation.lat.toFixed(4)}, 경도 ${currentLocation.lng.toFixed(4)}`
      },
      timeContext: {
        hour,
        dayOfWeek,
        isWeekend,
        isNight,
        isRushHour
      },
      movementPattern: locationHistory.slice(-10).map(loc => ({
        lat: loc.lat,
        lng: loc.lng,
        timestamp: loc.timestamp
      })),
      nearbyEmergencyFacilities: {
        hospitalsCount: emergencyFacilities.hospitals?.length || 0,
        policeCount: emergencyFacilities.police?.length || 0,
        stationsCount: emergencyFacilities.stations?.length || 0
      }
    };

    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 위치 기반 안전 분석 전문가입니다.
사용자의 현재 위치와 주변 환경을 분석하여 잠재적 위험 지역을 식별하고 안전 권고사항을 제공합니다.

중요: 실제 범죄 통계나 확인되지 않은 정보를 사용하지 마세요.
오직 제공된 데이터(시간대, 주변 시설, 이동 패턴 등)만을 기반으로 일반적인 안전 가이드라인을 제공하세요.

응답은 반드시 다음 JSON 형식으로만 제공하세요:
{
  "overallRiskLevel": "low|medium|high",
  "dangerZones": [
    {
      "lat": 위도,
      "lng": 경도,
      "radius": 반경(미터),
      "riskLevel": "low|medium|high",
      "reason": "위험 요인 설명",
      "recommendations": ["권고사항1", "권고사항2"]
    }
  ],
  "safetyTips": ["안전 팁1", "안전 팁2", "안전 팁3"],
  "analysisTimestamp": "${timestamp.toISOString()}"
}`
        },
        {
          role: 'user',
          content: `다음 정보를 바탕으로 안전 분석을 수행해주세요:

현재 위치: ${context.currentLocation.address}
시간 정보: ${hour}시 (${isWeekend ? '주말' : '평일'}, ${isNight ? '야간' : '주간'}, ${isRushHour ? '출퇴근 시간' : '일반 시간'})
주변 응급시설: 병원 ${context.nearbyEmergencyFacilities.hospitalsCount}개, 경찰서 ${context.nearbyEmergencyFacilities.policeCount}개, 파출소 ${context.nearbyEmergencyFacilities.stationsCount}개
이동 패턴: 최근 ${locationHistory.length}개 위치 기록

다음 기준으로 분석해주세요:
1. 시간대별 일반적인 안전 고려사항 (야간, 출퇴근 시간 등)
2. 주변 응급시설 접근성
3. 사용자의 이동 패턴 (급격한 이동, 정체 등)

현재 위치 기준으로 최대 3개의 주의 지역을 반경 200-500m 범위로 표시하고, 실용적인 안전 팁을 제공해주세요.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // 일관성 있는 응답을 위해 낮은 temperature 사용
      max_tokens: 1500
    });

    const result = JSON.parse(response.choices[0].message.content);

    // 결과 검증
    if (!result.overallRiskLevel || !result.dangerZones || !result.safetyTips) {
      throw new Error('Invalid response format from OpenAI');
    }

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: timestamp.toISOString(),
        model: 'gpt-4o-mini',
        context
      }
    };

  } catch (error) {
    console.error('Danger prediction error:', error);

    // 에러 발생 시 기본 안전 정보 반환
    return {
      success: false,
      error: error.message,
      data: generateDefaultSafetyInfo(currentLocation, timestamp, emergencyFacilities)
    };
  }
};

/**
 * 위험 지역 색상 가져오기
 * @param {string} riskLevel - 위험도 (low, medium, high)
 * @returns {string} 색상 코드
 */
export const getDangerZoneColor = (riskLevel) => {
  const colors = {
    low: 'rgba(255, 255, 0, 0.2)',    // 노란색 (주의)
    medium: 'rgba(255, 165, 0, 0.3)',  // 오렌지색 (경고)
    high: 'rgba(255, 0, 0, 0.4)'       // 빨간색 (위험)
  };
  return colors[riskLevel] || colors.low;
};

/**
 * 위험 지역 테두리 색상 가져오기
 * @param {string} riskLevel - 위험도 (low, medium, high)
 * @returns {string} 색상 코드
 */
export const getDangerZoneBorderColor = (riskLevel) => {
  const colors = {
    low: 'rgba(255, 255, 0, 0.6)',
    medium: 'rgba(255, 165, 0, 0.7)',
    high: 'rgba(255, 0, 0, 0.8)'
  };
  return colors[riskLevel] || colors.low;
};

export default {
  analyzeDangerZones,
  getDangerZoneColor,
  getDangerZoneBorderColor
};
