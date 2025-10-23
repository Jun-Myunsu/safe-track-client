import { useState, useEffect, useCallback } from 'react'
import { speechService } from '../services/speechService'

/**
 * 음성 설정 관련 로직을 관리하는 커스텀 훅
 */
export const useVoiceSettings = () => {
  const [voiceEnabled, setVoiceEnabled] = useState(speechService.isEnabled())
  const [selectedVoice, setSelectedVoice] = useState('')
  const [availableVoices, setAvailableVoices] = useState([])

  /**
   * 음성 목록 로드
   */
  const loadVoices = useCallback(() => {
    const voices = speechService.getAvailableVoices()
    setAvailableVoices(voices)

    if (speechService.selectedVoice) {
      setSelectedVoice(speechService.selectedVoice.name)
    } else if (voices.length > 0) {
      const koreanVoice = voices.find(v => v.lang.startsWith('ko'))
      setSelectedVoice(koreanVoice?.name || voices[0]?.name || '')
    }
  }, [])

  /**
   * 음성 알림 토글
   */
  const handleVoiceToggle = useCallback(() => {
    const newEnabled = !voiceEnabled
    setVoiceEnabled(newEnabled)
    speechService.setEnabled(newEnabled)

    if (newEnabled) {
      speechService.speak('음성 알림이 활성화되었습니다')
    }
  }, [voiceEnabled])

  /**
   * 음성 변경
   */
  const handleVoiceChange = useCallback((voiceName) => {
    setSelectedVoice(voiceName)
    speechService.setVoice(voiceName)
    speechService.speak('음성이 변경되었습니다')
  }, [])

  // 음성 목록 로드 (컴포넌트 마운트 시)
  useEffect(() => {
    loadVoices()
    const timeout = setTimeout(loadVoices, 500)
    return () => clearTimeout(timeout)
  }, [loadVoices])

  return {
    // 상태
    voiceEnabled,
    selectedVoice,
    availableVoices,

    // 액션
    handleVoiceToggle,
    handleVoiceChange
  }
}
