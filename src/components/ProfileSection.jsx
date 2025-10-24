import RadioPlayer from './RadioPlayer'
import FakeCall from './FakeCall'
import StoryBook from './StoryBook'
import YouTubePlayer from './YouTubePlayer'
import AdminControl from './AdminControl'
import { speechService } from '../services/speechService'

/**
 * 프로필 및 로그인 상태를 표시하는 컴포넌트
 */
const ProfileSection = ({
  userId,
  showProfile,
  setShowProfile,
  voiceEnabled,
  selectedVoice,
  availableVoices,
  handleVoiceToggle,
  handleVoiceChange,
  handleLogout,
  socket
}) => {
  if (!showProfile) {
    return (
      <button
        className="profile-btn"
        onClick={() => setShowProfile(true)}
      >
        👤 {userId}
      </button>
    )
  }

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <h3 
          style={{ margin: 0, cursor: 'pointer' }}
          onClick={() => setShowProfile(false)}
        >
          👤 {userId}
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <AdminControl userId={userId} socket={socket} />
          <YouTubePlayer />
          <StoryBook />
          <RadioPlayer />
          <FakeCall />
        </div>
      </div>

      <div 
        className="status success" 
        style={{ cursor: 'pointer' }}
        onClick={() => setShowProfile(false)}
      >
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
              onChange={(e) => handleVoiceChange(e.target.value)}
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

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        marginTop: '15px',
        fontFamily: '"VT323", monospace'
      }}>
        <button
          className="btn"
          onClick={handleLogout}
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
  )
}

export default ProfileSection
