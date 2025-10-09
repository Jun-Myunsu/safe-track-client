import { useState, useRef } from 'react'
import MapView from './MapView'
import AuthForm from './components/AuthForm'
import LocationTracking from './components/LocationTracking'
import ChatSection from './components/ChatSection'
import LocationShare from './components/LocationShare'
import ShareRequests from './components/ShareRequests'
import SharedUsers from './components/SharedUsers'
import ReceivedShares from './components/ReceivedShares'
import UserList from './components/UserList'
import { useSocket } from './hooks/useSocket'
import { saveAppState, clearAppState } from './utils/localStorage'

function App() {
  const [socket, setSocket] = useState(null)
  const [isRegistered, setIsRegistered] = useState(() => {
    const saved = localStorage.getItem('safetrack_isRegistered')
    return saved === 'true'
  })
  const [isTracking, setIsTracking] = useState(() => {
    return localStorage.getItem('safetrack_isTracking') === 'true'
  })
  const [userId, setUserId] = useState(() => {
    const savedUsers = JSON.parse(localStorage.getItem('safetrack_users') || '[]')
    return savedUsers.length > 0 ? savedUsers[0].userId : ''
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

  const watchIdRef = useRef(null)
  const simulationRef = useRef(null)
  useSocket({
    setSocket, isRegistered, userId, setUsers, setLocations, setUserPaths,
    setShareRequests, setStatus, setSharedUsers, setReceivedShares,
    setChatMessages, setIsRegistered, password, setUserIdAvailable, setIsCheckingUserId
  })

  const checkUserId = (id) => {
    if (!id || isLoginMode) return
    setIsCheckingUserId(true)
    setUserIdAvailable(null)
    socket.emit('checkUserId', { userId: id })
  }

  const handleUserIdChange = (value) => {
    setUserId(value)
    if (!isLoginMode && value.length > 0) {
      clearTimeout(window.userIdCheckTimeout)
      window.userIdCheckTimeout = setTimeout(() => checkUserId(value), 500)
    } else {
      setUserIdAvailable(null)
    }
    
    // 저장된 사용자 정보 자동 입력
    if (isLoginMode) {
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
    saveAppState.isTracking('false')
    saveAppState.isSimulating('false')
    localStorage.removeItem('safetrack_currentLocation')
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
    setStatus(`🚫 ${targetUserId}와의 위치 공유를 중지했습니다`)
    setTimeout(() => setStatus(''), 3000)
    // 채팅 메시지 초기화
    setChatMessages([])
  }

  const stopReceivingShare = (fromUserId) => {
    socket.emit('stopReceivingShare', { fromUserId })
    setReceivedShares(prev => prev.filter(user => user.id !== fromUserId))
    setLocations(prev => prev.filter(loc => loc.userId !== fromUserId))
    setStatus(`🚫 ${fromUserId}의 위치 수신을 중지했습니다`)
    setTimeout(() => setStatus(''), 3000)
    // 채팅 메시지 초기화
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

  const sendMessage = () => {
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
  }

  const getConnectedUsers = () => {
    const connected = new Set()
    // 내가 공유하는 사용자들
    sharedUsers.forEach(user => connected.add(user.id))
    // 내가 수락한 위치 공유 사용자들
    receivedShares.forEach(user => connected.add(user.id))
    // 내 위치를 보고 있는 사용자들
    locations.forEach(location => {
      if (location.userId !== userId) {
        connected.add(location.userId)
      }
    })
    return Array.from(connected)
  }

  return (
    <div className="container">
      <div className="content-grid">
        <div className="sidebar">
          <div className="section">
            {!isRegistered ? (
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
                <h3>로그인 상태</h3>
                <div className="status success">
                  ✅ {userId}로 로그인 중
                </div>
                <button 
                  className="btn" 
                  onClick={() => {
                    localStorage.removeItem('safetrack_userId')
                    localStorage.removeItem('safetrack_isRegistered')
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
                  style={{ marginTop: '15px' }}
                >
                  로그아웃
                </button>
              </>
            )}
            
            {status && <div className="status success">{status}</div>}
          </div>

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

          <div className="section">
            <LocationShare 
              isRegistered={isRegistered}
              targetUserId={targetUserId}
              setTargetUserId={setTargetUserId}
              requestLocationShare={requestLocationShare}
            />
          </div>

          <ShareRequests 
            shareRequests={shareRequests}
            respondToRequest={respondToRequest}
          />

          <ReceivedShares 
            receivedShares={receivedShares}
            stopReceivingShare={stopReceivingShare}
          />

          <div className="section users-toggle-section">
            <h3>사용자 목록</h3>
            <SharedUsers 
              sharedUsers={sharedUsers}
              stopLocationShare={stopLocationShare}
            />
            <UserList 
              users={users}
              userId={userId}
              onRequestShare={(targetUserId) => {
                socket.emit('requestLocationShare', { targetUserId })
              }}
            />
          </div>
        </div>
        
        <div className="map-section">
          <MapView 
            locations={locations} 
            currentLocation={currentLocation}
            currentUserId={userId}
            userPaths={userPaths}
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