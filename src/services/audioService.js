// 작은 알림음을 재생하는 서비스
class AudioService {
  constructor() {
    // Web Audio API를 사용하여 간단한 알림음 생성
    this.audioContext = null
  }

  // 오디오 컨텍스트 초기화 (사용자 인터랙션 후)
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }
  }

  // 작은 알림음 재생 (짧고 부드러운 소리)
  playNotification() {
    this.init()

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    // 부드러운 알림음 설정 (C5 음계)
    oscillator.frequency.value = 523.25
    oscillator.type = 'sine'

    // 볼륨 페이드 인/아웃
    const now = this.audioContext.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05)
    gainNode.gain.linearRampToValueAtTime(0, now + 0.15)

    oscillator.start(now)
    oscillator.stop(now + 0.15)
  }

  // 더블 알림음 (메시지용)
  playMessageNotification() {
    this.init()

    const now = this.audioContext.currentTime

    // 첫 번째 음
    this.playBeep(523.25, now, 0.1, 0.25)
    // 두 번째 음 (약간 높은 음)
    this.playBeep(659.25, now + 0.12, 0.1, 0.25)
  }

  // 비프음 생성 헬퍼
  playBeep(frequency, startTime, duration, volume = 0.3) {
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02)
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration)

    oscillator.start(startTime)
    oscillator.stop(startTime + duration)
  }
}

export const audioService = new AudioService()
