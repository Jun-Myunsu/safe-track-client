// 앱 관련 상수
export const APP_NAME = 'SafeTrack'

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  SESSION_ID: 'safetrack_sessionId',
  USER_ID: 'safetrack_userId',
  IS_REGISTERED: 'safetrack_isRegistered',
  IS_TRACKING: 'safetrack_isTracking',
  IS_SIMULATING: 'safetrack_isSimulating',
  CURRENT_LOCATION: 'safetrack_currentLocation',
  SHARED_USERS: 'safetrack_sharedUsers',
  RECEIVED_SHARES: 'safetrack_receivedShares',
  CHAT_MESSAGES: 'safetrack_chatMessages',
  FRIENDS: 'safetrack_friends',
  USERS: 'safetrack_users'
}

// 유효성 검증 관련 상수
export const VALIDATION = {
  MIN_USER_ID_LENGTH: 4,
  MIN_PASSWORD_LENGTH: 4,
  USER_ID_CHECK_DEBOUNCE: 500
}

// 시뮬레이션 관련 상수
export const SIMULATION = {
  START_LAT: 35.1595,  // 광주광역시 시청
  START_LNG: 126.8526,
  END_LAT: 35.1284,    // 상무역
  END_LNG: 126.8442,
  WALKING_SPEED: 1.39, // m/s (5km/h)
  UPDATE_INTERVAL: 2000, // 2초
  RANDOM_VARIATION: 0.00005
}

// 위치 추적 옵션
export const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000
}

// 에러 메시지
export const ERROR_MESSAGES = {
  NO_USER_ID_PASSWORD: '❌ 아이디와 비밀번호를 입력하세요',
  USER_ID_TOO_SHORT: '❌ 아이디는 4자리 이상 입력하세요',
  PASSWORD_TOO_SHORT: '❌ 비밀번호는 4자리 이상 입력하세요',
  USER_ID_TAKEN: '❌ 이미 사용 중인 아이디입니다',
  NO_TARGET_USER: '❌ 사용자 ID를 입력하세요',
  NO_CONNECTED_USERS: '❌ 연결된 사용자가 없습니다',
  GEOLOCATION_NOT_SUPPORTED: '이 브라우저는 위치 서비스를 지원하지 않습니다',
  PERMISSION_DENIED: '위치 접근이 거부되었습니다.\n\n아이폰: 설정 > 개인정보보호 > 위치서비스 > Safari > 사이트에서 위치 접근 허용',
  POSITION_UNAVAILABLE: '위치를 찾을 수 없습니다. GPS를 확인해주세요.',
  TIMEOUT: '위치 요청 시간이 초과되었습니다.'
}

// 성공 메시지
export const SUCCESS_MESSAGES = {
  SHARE_STOPPED: (userId) => `🚫 ${userId}와의 위치 공유를 중지했습니다`,
  SHARE_FULLY_STOPPED: (userId) => `🚫 ${userId}와의 위치 공유를 완전히 중지했습니다`
}

// 타임아웃
export const TIMEOUTS = {
  STATUS_MESSAGE: 3000
}
