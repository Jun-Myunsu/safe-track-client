import { useEffect } from 'react'
import io from 'socket.io-client'
import { speechService } from '../services/speechService'
import { audioService } from '../services/audioService'

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
        // 친구 목록도 업데이트
        if (handlers.friends && handlers.setFriends) {
          handlers.setFriends(prev => prev.map(friend => 
            friend.id === data.userId 
              ? { ...friend, isTracking: data.isTracking }
              : friend
          ))
        }
        // 현재 사용자의 추적 상태 업데이트
        if (data.userId === handlers.userId && !data.isTracking) {
          if (handlers.isTracking || handlers.isSimulating) {
            handlers.stopTracking()
          }
        }
      },
      locationReceived: (data) => {
        handlers.setLocations(prev => [...prev, data])
        if (data.path && data.path.length > 1) {
          handlers.setUserPaths(prev => {
            const newPaths = new Map(prev)
            newPaths.set(data.userId, data.path)
            return newPaths
          })
        }
      },
      locationShareRequest: (data) => {
        handlers.setShareRequests(prev => [...prev, data])
        // 푸시 알림 표시
        if (handlers.pushNotificationService) {
          handlers.pushNotificationService.showLocationShareRequest(data.fromName)
        }
        // 음성 알림
        speechService.notifyShareRequest(data.fromName)
      },
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
          handlers.setStatus(`✅ ${data.targetName}이 내 위치 공유를 수락했습니다. 위치 추적을 시작하세요.`)
          handlers.setSharedUsers(prev => [...prev, { id: data.targetUserId, name: data.targetName }])
          // 푸시 알림 표시
          if (handlers.pushNotificationService) {
            handlers.pushNotificationService.showLocationShareAccepted(data.targetName)
          }
          // 음성 알림
          speechService.notifyShareAccepted(data.targetName)

          // 자동 추적 시작 제거 - 사용자가 수동으로 시작해야 함
          // 이유: 사용자가 명시적으로 추적을 중지했을 수 있음
          // 공유 수락만으로 자동 시작하면 사용자 의도와 다를 수 있음
        } else {
          const reason = data.reason === 'busy' ? '다른 사용자와 공유 중입니다' : '거부했습니다'
          handlers.setStatus(`❌ ${data.targetName}이 내 위치 공유를 ${reason}`)
          // 음성 알림
          speechService.notifyShareRejected(data.targetName)
        }
        setTimeout(() => handlers.setStatus(''), 3000)
      },
      locationShareStopped: (data) => {
        handlers.setStatus(`🚫 ${data.fromName}이 위치 공유를 중지했습니다`)
        setTimeout(() => handlers.setStatus(''), 3000)
        handlers.setReceivedShares(prev => {
          const updated = prev.filter(user => user.id !== data.fromUserId)
          localStorage.setItem('safetrack_receivedShares', JSON.stringify(updated))
          return updated
        })
        handlers.setSharedUsers(prev => {
          const updated = prev.filter(user => user.id !== data.fromUserId)
          localStorage.setItem('safetrack_sharedUsers', JSON.stringify(updated))
          return updated
        })
        handlers.setChatMessages([])
        // 음성 알림
        speechService.notifyLocationShareStopped(data.fromName)
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
      shareResponseError: (data) => {
        handlers.setStatus(`❌ ${data.message}`)
        setTimeout(() => handlers.setStatus(''), 3000)
      },
      shareRequestSent: (data) => {
        handlers.setStatus(`📱 ${data.targetName}에게 내 위치 공유 요청을 보냈습니다`)
        setTimeout(() => handlers.setStatus(''), 3000)
        // 대기 중인 요청에 추가
        if (handlers.setPendingRequests) {
          handlers.setPendingRequests(prev => new Set([...prev, data.targetUserId]))
        }
      },
      messageReceived: (data) => {
        handlers.setChatMessages(prev => [...prev, { ...data, type: 'received' }])
        // 작은 알림음 재생
        audioService.playMessageNotification()
      },
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
      forceLogout: (data) => {
        alert(`⚠️ ${data.reason}`)
        
        // 모든 로컬 스토리지 정리
        localStorage.clear()
        
        // 강제 새로고침
        window.location.reload()
      },
      error: (data) => {
        handlers.setStatus(`❌ ${data.message}`)
        setTimeout(() => handlers.setStatus(''), 3000)
      },
      restoreState: (data) => {
        // 공유 상태 복원 (서버 상태가 단일 진실의 원천)
        const sharedUsers = data.sharedUsers || []
        const receivedShares = data.receivedShares || []

        handlers.setSharedUsers(sharedUsers)
        localStorage.setItem('safetrack_sharedUsers', JSON.stringify(sharedUsers))

        handlers.setReceivedShares(receivedShares)
        localStorage.setItem('safetrack_receivedShares', JSON.stringify(receivedShares))

        // 추적 상태는 서버에서 항상 false로 복원됨 (수동 시작 필요)
        if (data.isTracking !== undefined && handlers.setIsTracking) {
          // 클라이언트 상태도 서버와 동기화
          if (!data.isTracking && (handlers.isTracking || handlers.isSimulating)) {
            handlers.stopTracking()
          }
        }

        console.log('✅ 공유 상태 복원됨:', {
          sharedUsers: sharedUsers.length,
          receivedShares: receivedShares.length,
          isTracking: data.isTracking
        })
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
        // 푸시 알림 표시
        if (handlers.pushNotificationService) {
          handlers.pushNotificationService.showFriendAdded(data.friendId)
        }
        // 음성 알림
        speechService.notifyFriendRequestAccepted(data.friendId)
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
        const savedUsers = JSON.parse(localStorage.getItem('safetrack_users') || '[]')
        const savedUser = savedUsers.find(user => user.userId === handlers.userId)
        if (savedUser) {
          isAutoLogin = true
          newSocket.emit('login', { userId: handlers.userId, password: savedUser.password })
        }
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('서버 연결 실패:', error)
      handlers.setIsConnecting(true)
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