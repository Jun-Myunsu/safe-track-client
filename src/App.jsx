import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import MapView from './MapView'
import AuthForm from './components/AuthForm'
import LocationTracking from './components/LocationTracking'
import ChatSection from './components/ChatSection'
import LocationShare from './components/LocationShare'
import ShareRequests from './components/ShareRequests'
import SharedUsers from './components/SharedUsers'
import ReceivedShares from './components/ReceivedShares'
import UserList from './components/UserList'
import UserSearch from './components/UserSearch'
import FriendsList from './components/FriendsList'
import RadioPlayer from './components/RadioPlayer'
import FakeCall from './components/FakeCall'
import { useSocket } from './hooks/useSocket'
import { saveAppState, clearAppState } from './utils/localStorage'
import { pushNotificationService } from './services/pushNotification'
import { speechService } from './services/speechService'

function App() {
  const [socket, setSocket] = useState(null)
  const [voiceEnabled, setVoiceEnabled] = useState(speechService.isEnabled())
  const [selectedVoice, setSelectedVoice] = useState('')
  const [availableVoices, setAvailableVoices] = useState([])
  const [isRegistered, setIsRegistered] = useState(() => {
    const saved = localStorage.getItem('safetrack_isRegistered')
    return saved === 'true'
  })
  const [isConnecting, setIsConnecting] = useState(true)
  const [isTracking, setIsTracking] = useState(() => {
    return localStorage.getItem('safetrack_isTracking') === 'true'
  })
  const [userId, setUserId] = useState(() => {
    return localStorage.getItem('safetrack_userId') || ''
  })
  const [password, setPassword] = useState('')
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [userIdAvailable, setUserIdAvailable] = useState(null)
  const [isCheckingUserId, setIsCheckingUserId] = useState(false)
  const [users, setUsers] = useState([])
  const [locations, setLocations] = useState([])
  const [userPaths, setUserPaths] = useState(new Map())
  const [currentLocation, setCurrentLocation] = useState(() => {
    const saved = localStorage.getItem('safetrack_currentLocation')
    return saved ? JSON.parse(saved) : null
  })
  const [status, setStatus] = useState('')
  const [isSimulating, setIsSimulating] = useState(() => {
    return localStorage.getItem('safetrack_isSimulating') === 'true'
  })
  const [shareRequests, setShareRequests] = useState([])
  const [targetUserId, setTargetUserId] = useState('')
  const [sharedUsers, setSharedUsers] = useState(() => {
    const saved = localStorage.getItem('safetrack_sharedUsers')
    return saved ? JSON.parse(saved) : []
  })
  const [chatMessages, setChatMessages] = useState(() => {
    const saved = localStorage.getItem('safetrack_chatMessages')
    return saved ? JSON.parse(saved) : []
  })
  const [chatInput, setChatInput] = useState('')
  const [receivedShares, setReceivedShares] = useState(() => {
    const saved = localStorage.getItem('safetrack_receivedShares')
    return saved ? JSON.parse(saved) : []
  })
  const [showProfile, setShowProfile] = useState(false)
  const [showUserList, setShowUserList] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [friends, setFriends] = useState(() => {
    const saved = localStorage.getItem('safetrack_friends')
    return saved ? JSON.parse(saved) : []
  })
  const [pendingRequests, setPendingRequests] = useState(new Set())

  const watchIdRef = useRef(null)
  const simulationRef = useRef(null)

  const checkUserId = (id) => {
    if (!id || isLoginMode) return
    setIsCheckingUserId(true)
    setUserIdAvailable(null)
    socket.emit('checkUserId', { userId: id })
  }

  const handleUserIdChange = (value) => {
    setUserId(value)
    if (!isLoginMode && value.length >= 4) {
      clearTimeout(window.userIdCheckTimeout)
      window.userIdCheckTimeout = setTimeout(() => checkUserId(value), 500)
    } else {
      setUserIdAvailable(null)
    }
    
    // 저장된 사용자 정보 자동 입력
    if (isLoginMode && value) {
      const savedUsers = JSON.parse(localStorage.getItem('safetrack_users') || '[]')
      const savedUser = savedUsers.find(user => user.userId === value)
      if (savedUser) {
        setPassword(savedUser.password)
      }
    }
  }

  const handleAuth = () => {
    if (!userId || !password) {
      setStatus('❌ 아이디와 비밀번호를 입력하세요')
      setTimeout(() => setStatus(''), 3000)
      return
    }

    if (userId.length < 4) {
      setStatus('❌ 아이디는 4자리 이상 입력하세요')
      setTimeout(() => setStatus(''), 3000)
      return
    }

    if (password.length < 4) {
      setStatus('❌ 비밀번호는 4자리 이상 입력하세요')
      setTimeout(() => setStatus(''), 3000)
      return
    }

    if (isLoginMode) {
      socket.emit('login', { userId, password })
    } else {
      if (userIdAvailable === false) {
        setStatus('❌ 이미 사용 중인 아이디입니다')
        setTimeout(() => setStatus(''), 3000)
        return
      }
      socket.emit('register', { userId, password })
    }
  }

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다')
      return
    }

    socket.emit('startTracking', { userId })
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        console.log(`GPS 위치: ${latitude}, ${longitude} (정확도: ${accuracy}m)`)
        socket.emit('locationUpdate', {
          userId,
          lat: latitude,
          lng: longitude
        })
        
        const newLocation = { lat: latitude, lng: longitude }
        setCurrentLocation(newLocation)
        saveAppState.currentLocation(newLocation)
      },
      (error) => {
        console.error('위치 오류:', error)
        let errorMessage = '위치를 가져올 수 없습니다'
        
        if (error.code === 1) {
          errorMessage = '위치 접근이 거부되었습니다.\n\n아이폰: 설정 > 개인정보보호 > 위치서비스 > Safari > 사이트에서 위치 접근 허용'
        } else if (error.code === 2) {
          errorMessage = '위치를 찾을 수 없습니다. GPS를 확인해주세요.'
        } else if (error.code === 3) {
          errorMessage = '위치 요청 시간이 초과되었습니다.'
        }
        
        alert(errorMessage)
        setIsTracking(false)
        saveAppState.isTracking('false')
        socket.emit('stopTracking', { userId })
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 0, 
        timeout: 10000 
      }
    )

    setIsTracking(true)
    saveAppState.isTracking('true')
    // 음성 알림
    speechService.notifyTrackingStarted()
  }

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    
    if (simulationRef.current) {
      clearInterval(simulationRef.current)
      simulationRef.current = null
    }
    
    socket.emit('stopTracking', { userId })
    setIsTracking(false)
    setIsSimulating(false)
    setCurrentLocation(null)
    // 위치 히스토리 초기화
    setLocations(prev => prev.filter(loc => loc.userId !== userId))
    saveAppState.isTracking('false')
    saveAppState.isSimulating('false')
    localStorage.removeItem('safetrack_currentLocation')
    // 음성 알림
    speechService.notifyTrackingStopped()
  }

  const requestLocationShare = () => {
    if (!targetUserId) {
      setStatus('❌ 사용자 ID를 입력하세요')
      setTimeout(() => setStatus(''), 3000)
      return
    }
    socket.emit('requestLocationShare', { targetUserId })
    setTargetUserId('')
  }

  const respondToRequest = (requestId, accepted) => {
    const request = shareRequests.find(req => req.requestId === requestId)
    if (accepted && request) {
      setReceivedShares(prev => [...prev, { id: request.from, name: request.fromName }])
      // 수락 시 즉시 해당 사용자의 현재 위치 요청
      socket.emit('requestCurrentLocation', { targetUserId: request.from })
    }
    socket.emit('respondLocationShare', { requestId, accepted })
    setShareRequests(prev => prev.filter(req => req.requestId !== requestId))
  }

  const stopLocationShare = (targetUserId) => {
    socket.emit('stopLocationShare', { targetUserId })
    setSharedUsers(prev => prev.filter(user => user.id !== targetUserId))
    // 위치 추적 중지
    if (isTracking || isSimulating) {
      stopTracking()
    }
    setStatus(`🚫 ${targetUserId}와의 위치 공유를 중지했습니다`)
    setTimeout(() => setStatus(''), 3000)
    // 채팅 메시지 초기화
    setChatMessages([])
  }

  const stopReceivingShare = (fromUserId) => {
    socket.emit('stopReceivingShare', { fromUserId })
    socket.emit('stopLocationShare', { targetUserId: fromUserId })
    socket.emit('removeUserLocation', { userId: fromUserId })
    setReceivedShares(prev => prev.filter(user => user.id !== fromUserId))
    setLocations(prev => prev.filter(loc => loc.userId !== fromUserId))
    setSharedUsers(prev => prev.filter(user => user.id !== fromUserId))
    // 위치 추적 중지
    if (isTracking || isSimulating) {
      stopTracking()
    }
    setStatus(`🚫 ${fromUserId}와의 위치 공유를 완전히 중지했습니다`)
    setTimeout(() => setStatus(''), 3000)
    setChatMessages([])
  }

  const startSimulation = () => {
    // 광주광역시 시청 좌표
    const startLat = 35.1595
    const startLng = 126.8526
    
    // 상무역 좌표
    const endLat = 35.1284
    const endLng = 126.8442
    
    // 거리 계산 (대략 3.5km)
    const distance = Math.sqrt(
      Math.pow((endLat - startLat) * 111000, 2) + 
      Math.pow((endLng - startLng) * 111000 * Math.cos(startLat * Math.PI / 180), 2)
    )
    
    // 걸음 속도: 5km/h = 1.39m/s
    const walkingSpeed = 1.39 // m/s
    const updateInterval = 2000 // 2초마다 업데이트
    const stepDistance = walkingSpeed * (updateInterval / 1000) // 2초동안 이동 거리
    const totalSteps = Math.ceil(distance / stepDistance)
    
    let currentLat = startLat
    let currentLng = startLng
    let step = 0
    
    socket.emit('startTracking', { userId })
    setIsTracking(true)
    setIsSimulating(true)
    saveAppState.isTracking('true')
    saveAppState.isSimulating('true')
    // 음성 알림
    speechService.notifyTrackingStarted()
    
    // 초기 위치 전송
    socket.emit('locationUpdate', { userId, lat: currentLat, lng: currentLng })
    const newLocation = { lat: currentLat, lng: currentLng }
    setCurrentLocation(newLocation)
    saveAppState.currentLocation(newLocation)
    
    simulationRef.current = setInterval(() => {
      step++
      
      if (step >= totalSteps) {
        // 시뮬레이션 종료
        clearInterval(simulationRef.current)
        simulationRef.current = null
        setIsSimulating(false)
        setIsTracking(false)
        socket.emit('stopTracking', { userId })
        return
      }
      
      // 선형 보간으로 시청에서 상무역으로 이동
      const progress = step / totalSteps
      currentLat = startLat + (endLat - startLat) * progress
      currentLng = startLng + (endLng - startLng) * progress
      
      // 약간의 랜덤 변동 추가 (더 자연스럽게)
      currentLat += (Math.random() - 0.5) * 0.00005
      currentLng += (Math.random() - 0.5) * 0.00005
      
      socket.emit('locationUpdate', { userId, lat: currentLat, lng: currentLng })
      const newLocation = { lat: currentLat, lng: currentLng }
      setCurrentLocation(newLocation)
      saveAppState.currentLocation(newLocation)
    }, updateInterval) // 2초마다 업데이트
  }

  const getConnectedUsers = useCallback(() => {
    const connected = new Set()
    sharedUsers.forEach(user => connected.add(user.id))
    receivedShares.forEach(user => connected.add(user.id))
    locations.forEach(location => {
      if (location.userId !== userId) {
        connected.add(location.userId)
      }
    })
    return Array.from(connected)
  }, [sharedUsers, receivedShares, locations, userId])

  const sendMessage = useCallback(() => {
    if (!chatInput.trim()) return
    
    const connectedUsers = getConnectedUsers()
    if (connectedUsers.length === 0) {
      setStatus('❌ 연결된 사용자가 없습니다')
      setTimeout(() => setStatus(''), 3000)
      return
    }
    
    // 모든 연결된 사용자에게 메시지 전송
    connectedUsers.forEach(targetUserId => {
      socket.emit('sendMessage', {
        targetUserId,
        message: chatInput.trim()
      })
    })
    
    setChatInput('')
  }, [chatInput, getConnectedUsers, socket, setStatus])

  // 푸시 알림 권한 요청 (앱 시작 시)
  useEffect(() => {
    if (isRegistered) {
      pushNotificationService.requestPermission()
    }
  }, [isRegistered])

  // 음성 목록 로드
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechService.getAvailableVoices()
      setAvailableVoices(voices)

      if (speechService.selectedVoice) {
        setSelectedVoice(speechService.selectedVoice.name)
      } else if (voices.length > 0) {
        const koreanVoice = voices.find(v => v.lang.startsWith('ko'))
        setSelectedVoice(koreanVoice?.name || voices[0]?.name || '')
      }
    }

    loadVoices()
    const timeout = setTimeout(loadVoices, 500)
    return () => clearTimeout(timeout)
  }, [])

  const handleVoiceToggle = () => {
    const newEnabled = !voiceEnabled
    setVoiceEnabled(newEnabled)
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

  useSocket({
    setSocket, isRegistered, userId, setUserId, setUsers, setLocations, setUserPaths,
    setShareRequests, setStatus, setSharedUsers, setReceivedShares,
    setChatMessages, setIsRegistered, password, setUserIdAvailable, setIsCheckingUserId,
    startTracking, isTracking, isSimulating, friends, setFriends, setIsConnecting,
    pendingRequests, setPendingRequests, pushNotificationService
  })

  return (
    <div className="container">
      <div className="content-grid">
        <div className="sidebar">
          <div className="section">
            {isConnecting ? (
              <div className="status">
                🔄 서버 연결 중...
              </div>
            ) : !isRegistered ? (
              <AuthForm 
                isLoginMode={isLoginMode}
                setIsLoginMode={setIsLoginMode}
                userId={userId}
                password={password}
                setPassword={setPassword}
                userIdAvailable={userIdAvailable}
                isCheckingUserId={isCheckingUserId}
                handleUserIdChange={handleUserIdChange}
                handleAuth={handleAuth}
              />
            ) : (
              <>
                {!showProfile ? (
                  <button 
                    className="profile-btn"
                    onClick={() => setShowProfile(true)}
                  >
                    👤 {userId}
                  </button>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h3 style={{ margin: 0 }}>로그인 상태</h3>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <RadioPlayer />
                        <FakeCall />
                      </div>
                    </div>
                    <div className="status success">
                      ✅ {userId}로 로그인 중
                    </div>

                    {/* 음성 알림 설정 */}
                    {speechService.isSupported() && (
                      <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          fontSize: '1.1rem',
                          fontFamily: '"VT323", monospace',
                          marginBottom: '12px'
                        }}>
                          <input
                            type="checkbox"
                            checked={voiceEnabled}
                            onChange={handleVoiceToggle}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer'
                            }}
                          />
                          <span>🔊 음성 알림</span>
                        </label>

                        {voiceEnabled && availableVoices.length > 0 && (
                          <select
                            value={selectedVoice}
                            onChange={handleVoiceChange}
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '2px solid #555555',
                              background: '#1a1a1a',
                              color: '#e0e0e0',
                              fontSize: '1rem',
                              fontFamily: '"VT323", monospace',
                              borderRadius: '0',
                              cursor: 'pointer'
                            }}
                          >
                            {availableVoices.map(voice => (
                              <option key={voice.name} value={voice.name}>
                                {voice.name} ({voice.lang})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '15px', fontFamily: '"VT323", monospace' }}>
                      <button
                        className="btn"
                        onClick={() => {
                          if (socket) {
                            socket.emit('logout', { userId })
                          }

                          // 로컬 스토리지 정리
                          const keysToRemove = [
                            'safetrack_sessionId', 'safetrack_userId', 'safetrack_isRegistered',
                            'safetrack_isTracking', 'safetrack_isSimulating', 'safetrack_currentLocation',
                            'safetrack_sharedUsers', 'safetrack_receivedShares', 'safetrack_chatMessages',
                            'safetrack_friends'
                          ]
                          keysToRemove.forEach(key => localStorage.removeItem(key))

                          // 상태 초기화
                          setIsRegistered(false)
                          setStatus('')
                          setUserId('')
                          setPassword('')
                          setChatMessages([])
                          setReceivedShares([])
                          setSharedUsers([])

                          if (isTracking || isSimulating) {
                            stopTracking()
                          }
                        }}
                        style={{ flex: 1 }}
                      >
                        로그아웃
                      </button>
                      <button
                        className="btn"
                        onClick={() => setShowProfile(false)}
                        style={{ flex: 1 }}
                      >
                        접기
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
            
            {status && <div className="status success">{status}</div>}
          </div>

          {receivedShares.length === 0 && (
            <div className="section">
              <LocationTracking
                isRegistered={isRegistered}
                isTracking={isTracking}
                isSimulating={isSimulating}
                currentLocation={currentLocation}
                startTracking={startTracking}
                stopTracking={stopTracking}
                startSimulation={startSimulation}
              />
            </div>
          )}



          <ShareRequests 
            shareRequests={shareRequests}
            respondToRequest={respondToRequest}
          />

          <ReceivedShares
            receivedShares={receivedShares}
            stopReceivingShare={stopReceivingShare}
          />

          {isRegistered && (
            <div className="section users-toggle-section">
              <button 
                className="btn" 
                onClick={() => setShowUserList(!showUserList)}
                style={{ width: '100%', marginBottom: showUserList ? '16px' : '0' }}
              >
                👥 사용자 목록 {showUserList ? '▲' : '▼'}
              </button>
              {showUserList && (
                <>
                  <SharedUsers 
                    sharedUsers={sharedUsers}
                    stopLocationShare={stopLocationShare}
                  />
                  <button 
                    className="btn" 
                    onClick={() => setShowSearch(!showSearch)}
                    style={{ width: '100%', marginBottom: showSearch ? '16px' : '8px' }}
                  >
                    🔍 사용자 검색 {showSearch ? '▲' : '▼'}
                  </button>
                  {showSearch && (
                    <UserSearch 
                      socket={socket}
                      userId={userId}
                      friends={friends}
                      setStatus={setStatus}
                    />
                  )}
                  <FriendsList 
                    friends={friends}
                    onRequestShare={(targetUserId) => {
                      socket.emit('requestLocationShare', { targetUserId })
                    }}
                    sharedUsers={sharedUsers}
                    receivedShares={receivedShares}
                    socket={socket}
                    pendingRequests={pendingRequests}
                  />
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="map-section">
          <MapView 
            locations={locations} 
            currentLocation={currentLocation}
            currentUserId={userId}
            userPaths={userPaths}
            isTracking={isTracking || isSimulating}
            myLocationHistory={locations.filter(loc => loc.userId === userId)}
          />
          
          <ChatSection 
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendMessage={sendMessage}
            isRegistered={isRegistered}
            getConnectedUsers={getConnectedUsers}
          />
        </div>
      </div>
    </div>
  )
}

export default App