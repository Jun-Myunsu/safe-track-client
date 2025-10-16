function FriendsList({ friends, onRequestShare, sharedUsers, receivedShares, socket, pendingRequests }) {
  const isAlreadySharing = (targetUserId) => {
    return sharedUsers.some(user => user.id === targetUserId) || 
           receivedShares.some(user => user.id === targetUserId)
  }

  if (friends.length === 0) {
    return (
      <p style={{ fontSize: '12px', opacity: 0.6, margin: '8px 0' }}>
        추가된 친구가 없습니다
      </p>
    )
  }

  return (
    <div>
      <h4 style={{ margin: '16px 0 12px 0', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
        친구 목록
      </h4>
      {friends.map(friend => {
        const alreadySharing = isAlreadySharing(friend.id)
        return (
          <div key={friend.id} className="user-item" style={{ padding: '10px', margin: '0 0 6px 0' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '13px' }}>{friend.name || friend.id}</span>
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>
                {friend.isOnline ? (
                  friend.isTracking ? '🟢 추적중' : '🟡 온라인'
                ) : (
                  '⚪ 오프라인'
                )}
                {alreadySharing && ' • 공유중'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {friend.isOnline && (
                <button 
                  className={`btn ${alreadySharing ? 'btn-secondary' : 'btn-secondary'}`}
                  onClick={() => !alreadySharing && !pendingRequests.has(friend.id) && onRequestShare(friend.id)}
                  disabled={alreadySharing || pendingRequests.has(friend.id)}
                  style={{ 
                    fontSize: '10px', 
                    padding: '4px 8px',
                    opacity: (alreadySharing || pendingRequests.has(friend.id)) ? 0.5 : 1
                  }}
                >
                  {alreadySharing ? '공유중' : pendingRequests.has(friend.id) ? '요청중' : '요청'}
                </button>
              )}
              <button 
                className="btn btn-danger"
                onClick={() => socket.emit('removeFriend', { friendId: friend.id })}
                style={{ fontSize: '10px', padding: '4px 8px' }}
              >
                삭제
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default FriendsList