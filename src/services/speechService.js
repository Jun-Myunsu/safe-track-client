// 음성 알림 서비스
class SpeechService {
  constructor() {
    this.enabled = localStorage.getItem('safetrack_voiceEnabled') === 'true'
    this.selectedVoice = null
    this.availableVoices = []

    // 음성 목록 로드
    if ('speechSynthesis' in window) {
      this.loadVoices()
      // 일부 브라우저에서는 음성이 비동기로 로드됨
      speechSynthesis.onvoiceschanged = () => {
        this.loadVoices()
      }
    }
  }

  loadVoices() {
    this.availableVoices = speechSynthesis.getVoices()

    // 한국어 음성 우선 선택
    const savedVoice = localStorage.getItem('safetrack_selectedVoice')
    if (savedVoice) {
      this.selectedVoice = this.availableVoices.find(voice => voice.name === savedVoice)
    }

    if (!this.selectedVoice) {
      // 한국어 음성 찾기
      this.selectedVoice = this.availableVoices.find(voice =>
        voice.lang.startsWith('ko')
      ) || this.availableVoices[0]
    }
  }

  speak(text, options = {}) {
    // 음성 알림이 비활성화되어 있거나 지원하지 않는 브라우저면 무시
    if (!this.enabled || !('speechSynthesis' in window)) {
      return
    }

    // 이전 음성 중지
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    // 음성 설정
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice
    }

    utterance.rate = options.rate || 1.0 // 속도
    utterance.pitch = options.pitch || 1.0 // 음높이
    utterance.volume = options.volume || 1.0 // 볼륨
    
    // 선택된 음성의 언어를 사용, 없으면 옵션에서 지정한 언어 또는 기본값 사용
    utterance.lang = options.lang || (this.selectedVoice ? this.selectedVoice.lang : 'ko-KR')

    // 음성 재생
    speechSynthesis.speak(utterance)
  }

  setEnabled(enabled) {
    this.enabled = enabled
    localStorage.setItem('safetrack_voiceEnabled', enabled.toString())
  }

  setVoice(voiceName) {
    const voice = this.availableVoices.find(v => v.name === voiceName)
    if (voice) {
      this.selectedVoice = voice
      localStorage.setItem('safetrack_selectedVoice', voiceName)
    }
  }

  getAvailableVoices() {
    return this.availableVoices
  }

  isEnabled() {
    return this.enabled
  }

  isSupported() {
    return 'speechSynthesis' in window
  }

  // 미리 정의된 알림 메시지들
  notifications = {
    shareRequest: (userName) => `${userName}님이 위치 공유를 요청했습니다`,
    shareAccepted: (userName) => `${userName}님이 위치 공유를 수락했습니다`,
    shareRejected: (userName) => `${userName}님이 위치 공유를 거절했습니다`,
    newMessage: (userName) => `${userName}님이 메시지를 보냈습니다`,
    trackingStarted: () => '위치 추적을 시작합니다',
    trackingStopped: () => '위치 추적을 중지했습니다',
    friendRequestReceived: (userName) => `${userName}님이 친구 요청을 보냈습니다`,
    friendRequestAccepted: (userName) => `${userName}님이 친구 요청을 수락했습니다`,
    locationShareStopped: (userName) => `${userName}님과의 위치 공유가 중지되었습니다`,
  }

  // 편의 메서드들
  notifyShareRequest(userName) {
    this.speak(this.notifications.shareRequest(userName))
  }

  notifyShareAccepted(userName) {
    this.speak(this.notifications.shareAccepted(userName))
  }

  notifyShareRejected(userName) {
    this.speak(this.notifications.shareRejected(userName))
  }

  notifyNewMessage(userName) {
    this.speak(this.notifications.newMessage(userName))
  }

  notifyTrackingStarted() {
    this.speak(this.notifications.trackingStarted())
  }

  notifyTrackingStopped() {
    this.speak(this.notifications.trackingStopped())
  }

  notifyFriendRequestReceived(userName) {
    this.speak(this.notifications.friendRequestReceived(userName))
  }

  notifyFriendRequestAccepted(userName) {
    this.speak(this.notifications.friendRequestAccepted(userName))
  }

  notifyLocationShareStopped(userName) {
    this.speak(this.notifications.locationShareStopped(userName))
  }
}

export const speechService = new SpeechService()
