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
    if (!targetUserId) {
      setStatus(ERROR_MESSAGES.NO_TARGET_USER)
      setTimeout(() => setStatus(''), TIMEOUTS.STATUS_MESSAGE)
      return
    }

    if (!socket) return

    socket.emit('requestLocationShare', { targetUserId })
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
      // 수락 시 즉시 해당 사용자의 현재 위치 요청
      socket.emit('requestCurrentLocation', { targetUserId: request.from })
    }

    socket.emit('respondLocationShare', { requestId, accepted })
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

    socket.emit('stopReceivingShare', { fromUserId })
    socket.emit('stopLocationShare', { targetUserId: fromUserId })

    setReceivedShares(prev => {
      const updated = prev.filter(user => user.id !== fromUserId)
      localStorage.setItem(STORAGE_KEYS.RECEIVED_SHARES, JSON.stringify(updated))
      return updated
    })
    setLocations(prev => prev.filter(loc => loc.userId !== fromUserId))
    setSharedUsers(prev => {
      const updated = prev.filter(user => user.id !== fromUserId)
      localStorage.setItem(STORAGE_KEYS.SHARED_USERS, JSON.stringify(updated))
      return updated
    })

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
