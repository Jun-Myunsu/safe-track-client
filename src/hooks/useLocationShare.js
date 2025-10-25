import { useState, useCallback } from 'react'
import { STORAGE_KEYS, ERROR_MESSAGES, SUCCESS_MESSAGES, TIMEOUTS } from '../constants/app'

/**
 * 위치 공유 관련 로직을 관리하는 커스텀 훅
 */
export const useLocationShare = (socket, setStatus, stopTracking, isTracking, isSimulating, setLocations) => {
  const [shareRequests, setShareRequests] = useState([])
  const [targetUserId, setTargetUserId] = useState('')

  const [sharedUsers, setSharedUsers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHARED_USERS)
    return saved ? JSON.parse(saved) : []
  })

  const [receivedShares, setReceivedShares] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECEIVED_SHARES)
    return saved ? JSON.parse(saved) : []
  })

  /**
   * 위치 공유 요청
   */
  const requestLocationShare = useCallback(() => {
    // 입력 검증: 빈 문자열 및 공백 체크
    const trimmedUserId = targetUserId?.trim()
    if (!trimmedUserId) {
      setStatus(ERROR_MESSAGES.NO_TARGET_USER)
      setTimeout(() => setStatus(''), TIMEOUTS.STATUS_MESSAGE)
      return
    }

    // 추가 검증: 유효한 사용자 ID 형식 (특수문자 제한)
    if (trimmedUserId.length < 2 || trimmedUserId.length > 50) {
      setStatus('❌ 사용자 ID는 2~50자 사이여야 합니다')
      setTimeout(() => setStatus(''), TIMEOUTS.STATUS_MESSAGE)
      return
    }

    if (!socket) return

    socket.emit('requestLocationShare', { targetUserId: trimmedUserId })
    setTargetUserId('')
  }, [targetUserId, socket, setStatus])

  /**
   * 위치 공유 요청에 응답
   */
  const respondToRequest = useCallback((requestId, accepted) => {
    if (!socket) return

    const request = shareRequests.find(req => req.requestId === requestId)

    if (accepted && request) {
      setReceivedShares(prev => [...prev, { id: request.from, name: request.fromName }])

      // 공유 수락 먼저 전송 (권한 설정 완료 대기)
      socket.emit('respondLocationShare', { requestId, accepted })

      // 약간의 지연 후 위치 요청 (경쟁 조건 방지)
      setTimeout(() => {
        socket.emit('requestCurrentLocation', { targetUserId: request.from })
      }, 200) // 200ms 지연
    } else {
      socket.emit('respondLocationShare', { requestId, accepted })
    }

    setShareRequests(prev => prev.filter(req => req.requestId !== requestId))
  }, [socket, shareRequests])

  /**
   * 내가 다른 사용자에게 공유 중지
   */
  const stopLocationShare = useCallback((targetUserId) => {
    if (!socket) return

    socket.emit('stopLocationShare', { targetUserId })
    setSharedUsers(prev => {
      const updated = prev.filter(user => user.id !== targetUserId)
      localStorage.setItem(STORAGE_KEYS.SHARED_USERS, JSON.stringify(updated))
      return updated
    })

    setStatus(SUCCESS_MESSAGES.SHARE_STOPPED(targetUserId))
    setTimeout(() => setStatus(''), TIMEOUTS.STATUS_MESSAGE)
  }, [socket, setStatus])

  /**
   * 다른 사용자로부터 받는 공유 중지
   */
  const stopReceivingShare = useCallback((fromUserId) => {
    if (!socket) return

    // 공유받는 것만 중지 (중복 emit 제거)
    socket.emit('stopReceivingShare', { fromUserId })

    // receivedShares만 정리 (내가 공유받던 사용자 제거)
    setReceivedShares(prev => {
      const updated = prev.filter(user => user.id !== fromUserId)
      localStorage.setItem(STORAGE_KEYS.RECEIVED_SHARES, JSON.stringify(updated))
      return updated
    })

    // 지도에서 해당 사용자 위치 제거
    setLocations(prev => prev.filter(loc => loc.userId !== fromUserId))

    setStatus(SUCCESS_MESSAGES.SHARE_FULLY_STOPPED(fromUserId))
    setTimeout(() => setStatus(''), TIMEOUTS.STATUS_MESSAGE)
  }, [socket, setStatus, setLocations])

  return {
    // 상태
    shareRequests,
    targetUserId,
    sharedUsers,
    receivedShares,

    // 상태 변경
    setShareRequests,
    setTargetUserId,
    setSharedUsers,
    setReceivedShares,

    // 액션
    requestLocationShare,
    respondToRequest,
    stopLocationShare,
    stopReceivingShare
  }
}
