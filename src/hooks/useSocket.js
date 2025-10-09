import { useEffect } from 'react'
import io from 'socket.io-client'

export function useSocket(handlers) {
  useEffect(() => {
    // 배포된 Render 서버 URL
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://safe-track-server.onrender.com'
    
    console.log('서버 연결 URL:', serverUrl)
    const newSocket = io(serverUrl)
    handlers.setSocket(newSocket)

    if (handlers.isRegistered && handlers.userId) {
      newSocket.emit('reconnect', { userId: handlers.userId })
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
        } else {
          handlers.setStatus(`❌ ${data.targetName}이 내 위치 공유를 거부했습니다`)
        }
        setTimeout(() => handlers.setStatus(''), 3000)
      },
      locationShareStopped: (data) => {
        handlers.setStatus(`🚫 ${data.fromName}이 위치 공유를 중지했습니다`)
        setTimeout(() => handlers.setStatus(''), 3000)
        handlers.setReceivedShares(prev => prev.filter(user => user.id !== data.fromUserId))
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
        handlers.setStatus(`✅ ${data.userId}로 로그인 성공`)
        
        const savedUsers = JSON.parse(localStorage.getItem('safetrack_users') || '[]')
        const existingIndex = savedUsers.findIndex(user => user.userId === data.userId)
        if (existingIndex === -1) {
          savedUsers.push({ userId: data.userId, password: handlers.password })
        } else {
          savedUsers[existingIndex].password = handlers.password
        }
        localStorage.setItem('safetrack_users', JSON.stringify(savedUsers))
        
        localStorage.setItem('safetrack_userId', data.userId)
        localStorage.setItem('safetrack_isRegistered', 'true')
        setTimeout(() => handlers.setStatus(''), 3000)
      },
      loginError: (data) => {
        handlers.setStatus(`❌ ${data.message}`)
        setTimeout(() => handlers.setStatus(''), 3000)
      },
      userIdCheckResult: (data) => {
        handlers.setUserIdAvailable(data.isAvailable)
        handlers.setIsCheckingUserId(false)
      }
    }).forEach(([event, handler]) => {
      newSocket.on(event, handler)
    })

    return () => newSocket.close()
  }, [])
}