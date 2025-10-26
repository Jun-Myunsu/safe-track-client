import { useState, useCallback } from 'react'
import { STORAGE_KEYS, VALIDATION, ERROR_MESSAGES, TIMEOUTS } from '../constants/app'

/**
 * 인증 관련 로직을 관리하는 커스텀 훅
 */
export const useAuth = (socket, setStatus) => {
  const [isRegistered, setIsRegistered] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IS_REGISTERED)
    return saved === 'true'
  })

  const [userId, setUserId] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.USER_ID) || ''
  })

  const [password, setPassword] = useState('')
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [userIdAvailable, setUserIdAvailable] = useState(null)
  const [isCheckingUserId, setIsCheckingUserId] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  /**
   * 사용자 ID 중복 확인
   */
  const checkUserId = useCallback((id) => {
    if (!id || isLoginMode || !socket) return

    setIsCheckingUserId(true)
    setUserIdAvailable(null)
    socket.emit('checkUserId', { userId: id })
  }, [isLoginMode, socket])

  /**
   * 사용자 ID 변경 핸들러
   */
  const handleUserIdChange = useCallback((value) => {
    setUserId(value)

    // 회원가입 모드에서 ID 중복 확인
    if (!isLoginMode && value.length >= VALIDATION.MIN_USER_ID_LENGTH) {
      clearTimeout(window.userIdCheckTimeout)
      window.userIdCheckTimeout = setTimeout(
        () => checkUserId(value),
        VALIDATION.USER_ID_CHECK_DEBOUNCE
      )
    } else {
      setUserIdAvailable(null)
    }

    // 로그인 모드에서 저장된 사용자 정보 자동 입력
    if (isLoginMode && value) {
      const savedUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]')
      const savedUser = savedUsers.find(user => user.userId === value)
      if (savedUser) {
        setPassword(savedUser.password)
      }
    }
  }, [isLoginMode, checkUserId])

  /**
   * 입력 값 유효성 검증
   */
  const validateInput = useCallback(() => {
    if (!userId || !password) {
      setStatus(ERROR_MESSAGES.NO_USER_ID_PASSWORD)
      setTimeout(() => setStatus(''), TIMEOUTS.STATUS_MESSAGE)
      return false
    }

    if (userId.length < VALIDATION.MIN_USER_ID_LENGTH) {
      setStatus(ERROR_MESSAGES.USER_ID_TOO_SHORT)
      setTimeout(() => setStatus(''), TIMEOUTS.STATUS_MESSAGE)
      return false
    }

    if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
      setStatus(ERROR_MESSAGES.PASSWORD_TOO_SHORT)
      setTimeout(() => setStatus(''), TIMEOUTS.STATUS_MESSAGE)
      return false
    }

    return true
  }, [userId, password, setStatus])

  /**
   * 인증 처리 (로그인/회원가입)
   */
  const handleAuth = useCallback(() => {
    if (!validateInput() || !socket) return

    if (isLoginMode) {
      socket.emit('login', { userId, password })
    } else {
      if (userIdAvailable === false) {
        setStatus(ERROR_MESSAGES.USER_ID_TAKEN)
        setTimeout(() => setStatus(''), TIMEOUTS.STATUS_MESSAGE)
        return
      }
      socket.emit('register', { userId, password })
    }
  }, [validateInput, socket, isLoginMode, userId, password, userIdAvailable, setStatus])

  /**
   * 로그아웃 처리
   */
  const handleLogout = useCallback((onComplete) => {
    if (socket) {
      socket.emit('logout', { userId })
    }

    // 로컬 스토리지 정리
    const keysToRemove = [
      STORAGE_KEYS.SESSION_ID,
      STORAGE_KEYS.USER_ID,
      STORAGE_KEYS.IS_REGISTERED,
      STORAGE_KEYS.IS_TRACKING,
      STORAGE_KEYS.IS_SIMULATING,
      STORAGE_KEYS.CURRENT_LOCATION,
      STORAGE_KEYS.SHARED_USERS,
      STORAGE_KEYS.RECEIVED_SHARES,
      STORAGE_KEYS.CHAT_MESSAGES,
      STORAGE_KEYS.FRIENDS
    ]
    keysToRemove.forEach(key => localStorage.removeItem(key))

    // 상태 초기화
    setIsRegistered(false)
    setUserId('')
    setPassword('')

    if (onComplete) {
      onComplete()
    }
  }, [socket, userId])

  return {
    // 상태
    isRegistered,
    userId,
    password,
    isLoginMode,
    userIdAvailable,
    isCheckingUserId,
    isAdmin,

    // 상태 변경 함수
    setIsRegistered,
    setUserId,
    setPassword,
    setIsLoginMode,
    setUserIdAvailable,
    setIsCheckingUserId,
    setIsAdmin,

    // 액션 함수
    checkUserId,
    handleUserIdChange,
    handleAuth,
    handleLogout
  }
}
