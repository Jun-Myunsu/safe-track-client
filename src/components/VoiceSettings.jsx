import { useState, useEffect } from 'react'
import { speechService } from '../services/speechService'

function VoiceSettings() {
  const [isEnabled, setIsEnabled] = useState(speechService.isEnabled())
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState('')
  const [isSupported, setIsSupported] = useState(speechService.isSupported())

  useEffect(() => {
    // 음성 목록 로드
    const loadVoices = () => {
      const availableVoices = speechService.getAvailableVoices()
      setVoices(availableVoices)

      if (speechService.selectedVoice) {
        setSelectedVoice(speechService.selectedVoice.name)
      } else if (availableVoices.length > 0) {
        const koreanVoice = availableVoices.find(v => v.lang.startsWith('ko'))
        setSelectedVoice(koreanVoice?.name || availableVoices[0]?.name || '')
      }
    }

    loadVoices()

    // 음성이 비동기로 로드될 수 있으므로 재시도
    const timeout = setTimeout(loadVoices, 500)

    return () => clearTimeout(timeout)
  }, [])

  const handleToggle = () => {
    const newEnabled = !isEnabled
    setIsEnabled(newEnabled)
    speechService.setEnabled(newEnabled)

    if (newEnabled) {
      speechService.speak('음성 알림이 활성화되었습니다')
    }
  }

  const handleVoiceChange = (e) => {
    const voiceName = e.target.value
    setSelectedVoice(voiceName)
    speechService.setVoice(voiceName)
    speechService.speak('음성이 변경되었습니다')
  }

  const handleTest = () => {
    speechService.speak('테스트 음성 알림입니다. 홍길동님이 위치 공유를 요청했습니다.')
  }

  if (!isSupported) {
    return (
      <div className="section">
        <h3>🔊 음성 알림</h3>
        <p style={{ color: '#999999', fontSize: '1rem' }}>
          이 브라우저는 음성 알림을 지원하지 않습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="section">
      <h3>🔊 음성 알림</h3>

      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          fontSize: '1.2rem',
          fontFamily: '"VT323", monospace'
        }}>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleToggle}
            style={{
              width: '20px',
              height: '20px',
              cursor: 'pointer'
            }}
          />
          <span>음성 알림 활성화</span>
        </label>
      </div>

      {isEnabled && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '1.1rem',
              fontFamily: '"VT323", monospace',
              color: '#cccccc'
            }}>
              음성 선택
            </label>
            <select
              value={selectedVoice}
              onChange={handleVoiceChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #555555',
                background: '#1a1a1a',
                color: '#e0e0e0',
                fontSize: '1.1rem',
                fontFamily: '"VT323", monospace',
                borderRadius: '0',
                cursor: 'pointer'
              }}
            >
              {voices.map(voice => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleTest}
            style={{ width: '100%' }}
          >
            🎤 음성 테스트
          </button>

          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#1a1a1a',
            border: '1px solid #555555',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            color: '#999999',
            fontFamily: '"VT323", monospace'
          }}>
            <strong style={{ color: '#cccccc' }}>알림 이벤트:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>위치 공유 요청/응답</li>
              <li>채팅 메시지 수신</li>
              <li>위치 추적 시작/종료</li>
              <li>친구 추가</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

export default VoiceSettings
