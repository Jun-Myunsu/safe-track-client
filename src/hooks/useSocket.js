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

    // 세션 기반 자동 로그인 처리
    const sessionId = localStorage.getItem('safetrack_sessionId')
    const savedUserId = localStorage.getItem('safetrack_userId')
    const isRegisteredSaved = localStorage.getItem('safetrack_isRegistered') === 'true'
    
    if (sessionId && savedUserId && isRegisteredSaved) {
      setTimeout(() => {
        isAutoLogin = true
        newSocket.emit('validateSession', { sessionId })
      }, 50)
    } else if (handlers.isRegistered && handlers.userId) {
      // 기존 비밀번호 방식 호환성
      setTimeout(() => {
        const savedUsers = JSON.parse(localStorage.getItem('safetrack_users') || '[]')
        const savedUser = savedUsers.find(user => user.userId === handlers.userId)
        if (savedUser) {
          isAutoLogin = true
          newSocket.emit('login', { userId: handlers.userId, password: savedUser.password })
        }
      }, 50)
    }

    // 이벤트 리스너 등록
    Object.entries({
      userList: (users) => {
        handlers.setUsers(users)
        if (handlers.friends && handlers.setFriends) {
          handlers.setFriends(prev => prev.map(friend => {
            const onlineUser = users.find(user => user.id === friend.id)
            return onlineUser ? { ...friend, isOnline: onlineUser.isOnline, isTracking: onlineUser.isTracking } : friend
          }))
        }
      },
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
        // 대기 중인 요청에서 제거
        if (handlers.setPendingRequests) {
          handlers.setPendingRequests(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.targetUserId)
            return newSet
          })
        }
        
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
        // 오류 시 대기 중인 요청에서 제거
        if (handlers.setPendingRequests && data.targetUserId) {
          handlers.setPendingRequests(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.targetUserId)
            return newSet
          })
        }
      },
      shareRequestSent: (data) => {
        handlers.setStatus(`📱 ${data.targetName}에게 내 위치 공유 요청을 보냈습니다`)
        setTimeout(() => handlers.setStatus(''), 3000)
        // 대기 중인 요청에 추가
        if (handlers.setPendingRequests) {
          handlers.setPendingRequests(prev => new Set([...prev, data.targetUserId]))
        }
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
        
        // 세션 저장
        localStorage.setItem('safetrack_sessionId', data.sessionId)
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
        
        // 세션 저장
        localStorage.setItem('safetrack_sessionId', data.sessionId)
        localStorage.setItem('safetrack_userId', data.userId)
        localStorage.setItem('safetrack_isRegistered', 'true')
        
        if (!isAutoLogin) {
          handlers.setStatus(`✅ ${data.userId}로 로그인 성공`)
          setTimeout(() => handlers.setStatus(''), 3000)
        }
        
        isAutoLogin = false
        
        // 친구 목록 요청
        setTimeout(() => {
          newSocket.emit('getFriends')
        }, 100)
      },
      sessionValid: (data) => {
        handlers.setIsRegistered(true)
        // userId 설정
        if (data.userId && handlers.setUserId) {
          handlers.setUserId(data.userId)
        }
        // 친구 목록 요청
        setTimeout(() => {
          newSocket.emit('getFriends')
        }, 100)
      },
      sessionInvalid: () => {
        handlers.setIsRegistered(false)
        localStorage.removeItem('safetrack_sessionId')
        localStorage.removeItem('safetrack_isRegistered')
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
      },
      friendAdded: (data) => {
        const newFriend = { id: data.friendId, name: data.friendId, isOnline: false, isTracking: false }
        handlers.setFriends(prev => {
          const updated = [...prev, newFriend]
          localStorage.setItem('safetrack_friends', JSON.stringify(updated))
          return updated
        })
      },
      friendsList: (data) => {
        handlers.setFriends(data.friends)
        localStorage.setItem('safetrack_friends', JSON.stringify(data.friends))
      },
      friendRemoved: (data) => {
        handlers.setFriends(prev => {
          const updated = prev.filter(friend => friend.id !== data.friendId)
          localStorage.setItem('safetrack_friends', JSON.stringify(updated))
          return updated
        })
      },
      searchResults: (data) => {
        // UserSearch 컴포넌트에서 처리
      }
    }).forEach(([event, handler]) => {
      newSocket.on(event, handler)
    })

    // 연결 성공 시 자동 로그인
    newSocket.on('connect', () => {
      console.log('서버 연결 성공')
      handlers.setIsConnecting(false)
      
      const sessionId = localStorage.getItem('safetrack_sessionId')
      const savedUserId = localStorage.getItem('safetrack_userId')
      const isRegisteredSaved = localStorage.getItem('safetrack_isRegistered') === 'true'
      
      if (sessionId && savedUserId && isRegisteredSaved) {
        isAutoLogin = true
        newSocket.emit('validateSession', { sessionId })
      } else if (handlers.isRegistered && handlers.userId) {
        // 기존 비밀번호 방식 호환성
        const savedUsers = JSON.parse(localStorage.getItem('safetrack_users') || '[]')
        const savedUser = savedUsers.find(user => user.userId === handlers.userId)
        if (savedUser) {
          isAutoLogin = true
          newSocket.emit('login', { userId: handlers.userId, password: savedUser.password })
        }
      }
    })

    // Keep-alive: 5분마다 서버에 ping 전송
    const keepAliveInterval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('ping')
      }
    }, 5 * 60 * 1000)

    // 연결 끊어지면 keep-alive 중지
    newSocket.on('disconnect', () => {
      clearInterval(keepAliveInterval)
    })

    newSocket.on('disconnect', () => {
      console.log('서버 연결 끊어짐')
      handlers.setIsConnecting(true)
    })

    return () => {
      clearInterval(keepAliveInterval)
      newSocket.close()
    }
  }, [])
}