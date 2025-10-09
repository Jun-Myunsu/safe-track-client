import { useEffect } from 'react'
import io from 'socket.io-client'

export function useSocket(handlers) {
  useEffect(() => {
    // 배포된 Render 서버 URL
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://safe-track-server.onrender.com'
    
    console.log('서버 연결 URL:', serverUrl)
    const newSocket = io(serverUrl)
    handlers.setSocket(newSocket)
    
    let isAutoLogin = false

    if (handlers.isRegistered && handlers.userId) {
      // 저장된 비밀번호로 자동 로그인 (비동기 처리)
      setTimeout(() => {
        const savedUsers = JSON.parse(localStorage.getItem('safetrack_users') || '[]')
        const savedUser = savedUsers.find(user => user.userId === handlers.userId)
        if (savedUser) {
          isAutoLogin = true
          newSocket.emit('login', { userId: handlers.userId, password: savedUser.password })
        } else {
          newSocket.emit('reconnect', { userId: handlers.userId })
        }
      }, 50)
    }

    // 이벤트 리스너 등록
    Object.entries({
      userList: handlers.setUsers,
      trackingStatusUpdate: (data) => {
        handlers.setUsers(prev => prev.map(user => 
          user.id === data.userId 
            ? { ...user, isTracking: data.isTracking }
            : user
        ))
        // 현재 사용자의 추적 상태 업데이트
        if (data.userId === handlers.userId && !data.isTracking) {
          if (handlers.isTracking || handlers.isSimulating) {
            handlers.stopTracking()
          }
        }
      },
      locationReceived: (data) => {
        handlers.setLocations(prev => [data, ...prev.slice(0, 9)])
        if (data.path && data.path.length > 1) {
          handlers.setUserPaths(prev => {
            const newPaths = new Map(prev)
            newPaths.set(data.userId, data.path)
            return newPaths
          })
        }
      },
      locationShareRequest: (data) => handlers.setShareRequests(prev => [...prev, data]),
      locationShareResponse: (data) => {
        if (data.accepted) {
          handlers.setStatus(`✅ ${data.targetName}이 내 위치 공유를 수락했습니다`)
          handlers.setSharedUsers(prev => [...prev, { id: data.targetUserId, name: data.targetName }])
          // 요청자의 위치 추적 시작
          if (handlers.startTracking && !handlers.isTracking && !handlers.isSimulating) {
            handlers.startTracking()
          }
        } else {
          handlers.setStatus(`❌ ${data.targetName}이 내 위치 공유를 거부했습니다`)
        }
        setTimeout(() => handlers.setStatus(''), 3000)
      },
      locationShareStopped: (data) => {
        handlers.setStatus(`🚫 ${data.fromName}이 위치 공유를 중지했습니다`)
        setTimeout(() => handlers.setStatus(''), 3000)
        handlers.setReceivedShares(prev => prev.filter(user => user.id !== data.fromUserId))
        handlers.setSharedUsers(prev => prev.filter(user => user.id !== data.fromUserId))
        handlers.setChatMessages([])
      },
      locationRemoved: (data) => {
        handlers.setLocations(prev => prev.filter(loc => loc.userId !== data.userId))
        handlers.setUserPaths(prev => {
          const newPaths = new Map(prev)
          newPaths.delete(data.userId)
          return newPaths
        })
      },
      shareRequestError: (data) => {
        handlers.setStatus(`❌ ${data.message}`)
        setTimeout(() => handlers.setStatus(''), 3000)
      },
      shareRequestSent: (data) => {
        handlers.setStatus(`📱 ${data.targetName}에게 내 위치 공유 요청을 보냈습니다`)
        setTimeout(() => handlers.setStatus(''), 3000)
      },
      messageReceived: (data) => handlers.setChatMessages(prev => [...prev, { ...data, type: 'received' }]),
      messageSent: (data) => handlers.setChatMessages(prev => [...prev, { ...data, type: 'sent' }]),
      chatError: (data) => {
        handlers.setStatus(`❌ ${data.message}`)
        setTimeout(() => handlers.setStatus(''), 3000)
      },
      registerSuccess: (data) => {
        handlers.setIsRegistered(true)
        handlers.setStatus(`✅ ${data.userId}로 등록 완료`)
        
        const savedUsers = JSON.parse(localStorage.getItem('safetrack_users') || '[]')
        const existingIndex = savedUsers.findIndex(user => user.userId === data.userId)
        if (existingIndex === -1) {
          savedUsers.push({ userId: data.userId, password: handlers.password })
          localStorage.setItem('safetrack_users', JSON.stringify(savedUsers))
        }
        
        localStorage.setItem('safetrack_userId', data.userId)
        localStorage.setItem('safetrack_isRegistered', 'true')
        setTimeout(() => handlers.setStatus(''), 3000)
      },
      registerError: (data) => {
        handlers.setStatus(`❌ ${data.message}`)
        setTimeout(() => handlers.setStatus(''), 3000)
      },
      loginSuccess: (data) => {
        handlers.setIsRegistered(true)
        
        if (isAutoLogin) {
          // 자동 로그인 성공 시 플래그 리셋
          isAutoLogin = false
        } else {
          // 수동 로그인 성공 시 메시지 표시
          handlers.setStatus(`✅ ${data.userId}로 로그인 성공`)
          setTimeout(() => handlers.setStatus(''), 3000)
          
          // 수동 로그인 시에만 비밀번호 저장
          const savedUsers = JSON.parse(localStorage.getItem('safetrack_users') || '[]')
          const existingIndex = savedUsers.findIndex(user => user.userId === data.userId)
          if (existingIndex === -1) {
            savedUsers.push({ userId: data.userId, password: handlers.password })
          } else {
            savedUsers[existingIndex].password = handlers.password
          }
          localStorage.setItem('safetrack_users', JSON.stringify(savedUsers))
        }
        
        localStorage.setItem('safetrack_userId', data.userId)
        localStorage.setItem('safetrack_isRegistered', 'true')
      },
      loginError: (data) => {
        if (isAutoLogin) {
          // 자동 로그인 실패 시 로그아웃 처리
          isAutoLogin = false
          handlers.setIsRegistered(false)
          localStorage.removeItem('safetrack_isRegistered')
        } else {
          // 수동 로그인 실패 시 에러 메시지 표시
          handlers.setStatus(`❌ ${data.message}`)
          setTimeout(() => handlers.setStatus(''), 3000)
        }
      },
      userIdCheckResult: (data) => {
        handlers.setUserIdAvailable(data.isAvailable)
        handlers.setIsCheckingUserId(false)
      }
    }).forEach(([event, handler]) => {
      newSocket.on(event, handler)
    })

    // 연결 성공 시 자동 로그인
    newSocket.on('connect', () => {
      console.log('서버 연결 성공')
      if (handlers.isRegistered && handlers.userId) {
        const savedUsers = JSON.parse(localStorage.getItem('safetrack_users') || '[]')
        const savedUser = savedUsers.find(user => user.userId === handlers.userId)
        if (savedUser) {
          isAutoLogin = true
          newSocket.emit('login', { userId: handlers.userId, password: savedUser.password })
          // 로그인 후 사용자 목록 즉시 요청
          setTimeout(() => {
            newSocket.emit('getUserList')
          }, 100)
        }
      }
    })

    return () => newSocket.close()
  }, [])
}