import { useState, useEffect } from 'react'
import MapView from './MapView'
import AuthForm from './components/AuthForm'
import LocationTracking from './components/LocationTracking'
import ChatSection from './components/ChatSection'
import AIChatSection from './components/AIChatSection'
import ShareRequests from './components/ShareRequests'
import SharedUsers from './components/SharedUsers'
import ReceivedShares from './components/ReceivedShares'
import UserSearch from './components/UserSearch'
import FriendsList from './components/FriendsList'
import ProfileSection from './components/ProfileSection'
import { useSocket } from './hooks/useSocket'
import { useAuth } from './hooks/useAuth'
import { useLocationTracking } from './hooks/useLocationTracking'
import { useLocationShare } from './hooks/useLocationShare'
import { useChat } from './hooks/useChat'
import { useVoiceSettings } from './hooks/useVoiceSettings'
import { pushNotificationService } from './services/pushNotification'

function App() {
  // 공통 상태
  const [socket, setSocket] = useState(null)
  const [status, setStatus] = useState('')
  const [isConnecting, setIsConnecting] = useState(true)
  const [users, setUsers] = useState([])
  const [locations, setLocations] = useState([])
  const [userPaths, setUserPaths] = useState(new Map())
  const [friends, setFriends] = useState(() => {
    const saved = localStorage.getItem('safetrack_friends')
    return saved ? JSON.parse(saved) : []
  })
  const [pendingRequests, setPendingRequests] = useState(new Set())

  // UI 상태
  const [showProfile, setShowProfile] = useState(false)
  const [showUserList, setShowUserList] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  // 커스텀 훅 사용
  const auth = useAuth(socket, setStatus)
  const tracking = useLocationTracking(socket, auth.userId, setLocations)
  const share = useLocationShare(
    socket,
    setStatus,
    tracking.stopTracking,
    tracking.isTracking,
    tracking.isSimulating,
    setLocations
  )
  const chat = useChat(
    socket,
    setStatus,
    share.sharedUsers,
    share.receivedShares,
    locations,
    auth.userId,
    users
  )
  const voice = useVoiceSettings()

  // 위치 공유 중지 시 채팅 메시지 초기화를 위한 래퍼 함수
  const handleStopLocationShare = (targetUserId) => {
    share.stopLocationShare(targetUserId)
    chat.setChatMessages([])
  }

  const handleStopReceivingShare = (fromUserId) => {
    share.stopReceivingShare(fromUserId)
    chat.setChatMessages([])
  }

  // 푸시 알림 권한 요청 (앱 시작 시)
  useEffect(() => {
    if (auth.isRegistered) {
      pushNotificationService.requestPermission()
    }
  }, [auth.isRegistered])

  // useSocket 호출
  useSocket({
    setSocket,
    isRegistered: auth.isRegistered,
    userId: auth.userId,
    setUserId: auth.setUserId,
    setUsers,
    setLocations,
    setUserPaths,
    setShareRequests: share.setShareRequests,
    setStatus,
    setSharedUsers: share.setSharedUsers,
    setReceivedShares: share.setReceivedShares,
    setChatMessages: chat.setChatMessages,
    setIsRegistered: auth.setIsRegistered,
    password: auth.password,
    setUserIdAvailable: auth.setUserIdAvailable,
    setIsCheckingUserId: auth.setIsCheckingUserId,
    startTracking: tracking.startTracking,
    isTracking: tracking.isTracking,
    isSimulating: tracking.isSimulating,
    friends,
    setFriends,
    setIsConnecting,
    pendingRequests,
    setPendingRequests,
    pushNotificationService
  })

  // 로그아웃 핸들러
  const handleLogout = () => {
    auth.handleLogout(() => {
      setStatus('')
      chat.setChatMessages([])
      share.setReceivedShares([])
      share.setSharedUsers([])

      if (tracking.isTracking || tracking.isSimulating) {
        tracking.stopTracking()
      }
    })
  }

  return (
    <div className="container">
      <div className="content-grid">
        <div className="sidebar">
          <div className="section">
            {isConnecting ? (
              <div className="status">
                🔄 서버 연결 중...
              </div>
            ) : !auth.isRegistered ? (
              <AuthForm
                isLoginMode={auth.isLoginMode}
                setIsLoginMode={auth.setIsLoginMode}
                userId={auth.userId}
                password={auth.password}
                setPassword={auth.setPassword}
                userIdAvailable={auth.userIdAvailable}
                isCheckingUserId={auth.isCheckingUserId}
                handleUserIdChange={auth.handleUserIdChange}
                handleAuth={auth.handleAuth}
              />
            ) : (
              <ProfileSection
                userId={auth.userId}
                showProfile={showProfile}
                setShowProfile={setShowProfile}
                voiceEnabled={voice.voiceEnabled}
                selectedVoice={voice.selectedVoice}
                availableVoices={voice.availableVoices}
                handleVoiceToggle={voice.handleVoiceToggle}
                handleVoiceChange={voice.handleVoiceChange}
                handleLogout={handleLogout}
              />
            )}

            {status && <div className="status success">{status}</div>}
          </div>

          {share.receivedShares.length === 0 && (
            <div className="section">
              <LocationTracking
                isRegistered={auth.isRegistered}
                isTracking={tracking.isTracking}
                isSimulating={tracking.isSimulating}
                currentLocation={tracking.currentLocation}
                startTracking={tracking.startTracking}
                stopTracking={tracking.stopTracking}
                startSimulation={tracking.startSimulation}
              />
            </div>
          )}

          <ShareRequests
            shareRequests={share.shareRequests}
            respondToRequest={share.respondToRequest}
          />

          <ReceivedShares
            receivedShares={share.receivedShares}
            stopReceivingShare={handleStopReceivingShare}
          />

          {auth.isRegistered && (
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
                    sharedUsers={share.sharedUsers}
                    stopLocationShare={handleStopLocationShare}
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
                      userId={auth.userId}
                      friends={friends}
                      setStatus={setStatus}
                    />
                  )}
                  <FriendsList
                    friends={friends}
                    onRequestShare={(targetUserId) => {
                      socket.emit('requestLocationShare', { targetUserId })
                    }}
                    sharedUsers={share.sharedUsers}
                    receivedShares={share.receivedShares}
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
            currentLocation={tracking.currentLocation}
            currentUserId={auth.userId}
            userPaths={userPaths}
            isTracking={tracking.isTracking || tracking.isSimulating}
            myLocationHistory={locations.filter(loc => loc.userId === auth.userId)}
          />

          {/* 연결된 사용자가 있으면 일반 채팅, 없으면 AI 채팅 */}
          {chat.getConnectedUsers().length > 0 ? (
            <ChatSection
              chatMessages={chat.chatMessages}
              chatInput={chat.chatInput}
              setChatInput={chat.setChatInput}
              sendMessage={chat.sendMessage}
              isRegistered={auth.isRegistered}
              getConnectedUsers={chat.getConnectedUsers}
            />
          ) : (
            auth.isRegistered && (
              <AIChatSection
                socket={socket}
                userId={auth.userId}
                currentLocation={tracking.currentLocation}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default App