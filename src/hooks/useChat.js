import { useState, useCallback } from 'react'
import { STORAGE_KEYS, ERROR_MESSAGES, TIMEOUTS } from '../constants/app'

/**
 * 채팅 관련 로직을 관리하는 커스텀 훅
 */
export const useChat = (socket, setStatus, sharedUsers, receivedShares, locations, userId, users) => {
  const [chatMessages, setChatMessages] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES)
    return saved ? JSON.parse(saved) : []
  })

  const [chatInput, setChatInput] = useState('')

  /**
   * 연결된 사용자 목록 조회 (위치 공유 중인 사용자)
   */
  const getConnectedUsers = useCallback(() => {
    const connected = new Set()
    
    // 내가 공유하는 사용자들
    sharedUsers.forEach(user => connected.add(user.id))
    
    // 내가 수락한 위치 공유 사용자들
    receivedShares.forEach(user => connected.add(user.id))
    
    return Array.from(connected)
  }, [sharedUsers, receivedShares])

  /**
   * 메시지 전송 (그룹 메시지로 최적화)
   */
  const sendMessage = useCallback(() => {
    if (!chatInput.trim()) return
    if (!socket) return

    const connectedUsers = getConnectedUsers()

    if (connectedUsers.length === 0) {
      setStatus(ERROR_MESSAGES.NO_CONNECTED_USERS)
      setTimeout(() => setStatus(''), TIMEOUTS.STATUS_MESSAGE)
      return
    }

    // 그룹 메시지 전송 (targetUserId 없이)
    socket.emit('sendMessage', {
      message: chatInput.trim()
    })

    setChatInput('')
  }, [chatInput, getConnectedUsers, socket, setStatus])

  return {
    // 상태
    chatMessages,
    chatInput,

    // 상태 변경
    setChatMessages,
    setChatInput,

    // 액션
    sendMessage,
    getConnectedUsers
  }
}
