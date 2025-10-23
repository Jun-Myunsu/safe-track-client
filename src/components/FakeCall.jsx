import { useState } from 'react'

function FakeCall() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const messages = [
    "응 거의 다왔어 바로 옆이야 지금 보이는 위치로 따라 가는 중이야",
    "어디야 저긴가 잠깐만",
    "어 보인다 보인다"
  ]

  const playFakeCall = () => {
    if (isPlaying) return
    
    console.log('SOS 버튼 클릭됨')
    setIsPlaying(true)
    
    // 현재 순서의 메시지 선택
    const currentMessage = messages[currentIndex]
    console.log('재생할 메시지:', currentMessage)
    
    // 음성 합성 지원 확인
    if (!('speechSynthesis' in window)) {
      console.error('음성 합성을 지원하지 않는 브라우저입니다')
      setIsPlaying(false)
      return
    }
    
    const utterance = new SpeechSynthesisUtterance(currentMessage)
    
    // 음성 로드 대기
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices()
      console.log('사용 가능한 음성 목록:', voices.length, voices.map(v => `${v.name} (${v.lang})`))
      
      if (voices.length === 0) {
        console.log('음성 목록이 비어있음, 기본 음성 사용')
      } else {
        const preferredVoice = voices.find(voice => voice.lang.startsWith('ko')) || voices[0]
        console.log('선택된 음성:', preferredVoice?.name)
        utterance.voice = preferredVoice
      }
      
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 0.9
      
      utterance.onstart = () => {
        console.log('음성 재생 시작')
      }
      
      utterance.onend = () => {
        console.log('음성 재생 완료')
        setIsPlaying(false)
        setCurrentIndex((prev) => (prev + 1) % messages.length)
      }
      
      utterance.onerror = (event) => {
        console.error('음성 재생 오류:', event.error)
        setIsPlaying(false)
      }
      
      try {
        // 기존 음성 중지
        speechSynthesis.cancel()
        
        // 짧은 지연 후 재생 (브라우저 정책 우회)
        setTimeout(() => {
          speechSynthesis.speak(utterance)
          console.log('speechSynthesis.speak() 호출됨')
        }, 100)
      } catch (error) {
        console.error('speak() 호출 오류:', error)
        setIsPlaying(false)
      }
    }
    
    // 음성 목록이 로드될 때까지 대기
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.onvoiceschanged = loadVoices
    } else {
      loadVoices()
    }
  }

  return (
    <button
      onClick={playFakeCall}
      disabled={isPlaying}
      className="icon-btn sos-btn"
      style={{
        backgroundColor: isPlaying ? '#666666' : '#dc3545',
        cursor: isPlaying ? 'not-allowed' : 'pointer'
      }}
      title="위험 상황 시 가짜 통화"
    >
      {isPlaying ? '📞' : 'SOS'}
    </button>
  )
}

export default FakeCall