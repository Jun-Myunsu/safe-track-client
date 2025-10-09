function UserList({ users, userId, onRequestShare, sharedUsers, receivedShares }) {
  const otherUsers = users.filter(user => user.id !== userId)

  const isAlreadySharing = (targetUserId) => {
    return sharedUsers.some(user => user.id === targetUserId) || 
           receivedShares.some(user => user.id === targetUserId)
  }

  return (
    <div>
      <h4 style={{ margin: '16px 0 12px 0', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>온라인 사용자</h4>
      {otherUsers.length === 0 ? (
        <p style={{ fontSize: '12px', opacity: 0.6 }}>다른 사용자가 없습니다.</p>
      ) : (
        otherUsers.map(user => {
          const alreadySharing = isAlreadySharing(user.id)
          return (
            <div key={user.id} className="user-item" style={{ padding: '12px', margin: '0 0 8px 0' }}>
              <div>
                <span style={{ fontSize: '13px' }}>{user.name} ({user.id})</span>
                <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>
                  {user.isOnline ? (
                    user.isTracking ? '🟢 추적중' : '🟡 온라인'
                  ) : (
                    '⚪ 오프라인'
                  )}
                  {alreadySharing && ' • 공유중'}
                </div>
              </div>
              {user.isOnline && (
                <button 
                  className={`btn ${alreadySharing ? 'btn-secondary' : 'btn-secondary'}`}
                  onClick={() => !alreadySharing && onRequestShare(user.id)}
                  disabled={alreadySharing}
                  style={{ 
                    fontSize: '10px', 
                    padding: '4px 8px',
                    opacity: alreadySharing ? 0.5 : 1,
                    cursor: alreadySharing ? 'not-allowed' : 'pointer'
                  }}
                >
                  {alreadySharing ? '공유중' : '요청'}
                </button>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

export default UserList