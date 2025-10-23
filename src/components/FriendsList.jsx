function FriendsList({ friends, onRequestShare, sharedUsers, receivedShares, socket, pendingRequests }) {
  const isAlreadySharing = (targetUserId) => {
    return sharedUsers.some(user => user.id === targetUserId) || 
           receivedShares.some(user => user.id === targetUserId)
  }

  if (friends.length === 0) {
    return (
      <p style={{ fontSize: '1.1rem', opacity: 0.6, margin: '8px 0', fontFamily: '"VT323", monospace' }}>
        추가된 친구가 없습니다
      </p>
    )
  }

  return (
    <div>
      <h4 style={{ margin: '16px 0 12px 0', fontSize: '1.2rem', color: '#ffffff', fontFamily: '"VT323", monospace' }}>
        친구 목록
      </h4>
      {friends.map(friend => {
        const alreadySharing = isAlreadySharing(friend.id)
        return (
          <div key={friend.id} className="user-item" style={{ padding: '12px', margin: '0 0 8px 0', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: '1.2rem', fontFamily: '"VT323", monospace', marginBottom: '4px' }}>
                {friend.name || friend.id}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.7, fontFamily: '"VT323", monospace' }}>
                {friend.isOnline ? (
                  friend.isTracking ? '🟢 추적중' : '🟡 온라인'
                ) : (
                  '⚪ 오프라인'
                )}
                {alreadySharing && ' • 공유중'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
              {friend.isOnline && (
                <button
                  className={`btn ${alreadySharing ? 'btn-secondary' : 'btn-secondary'}`}
                  onClick={() => !alreadySharing && !pendingRequests.has(friend.id) && onRequestShare(friend.id)}
                  disabled={alreadySharing || pendingRequests.has(friend.id)}
                  style={{
                    fontSize: '1rem',
                    padding: '6px 12px',
                    opacity: (alreadySharing || pendingRequests.has(friend.id)) ? 0.5 : 1
                  }}
                >
                  {alreadySharing ? '공유중' : pendingRequests.has(friend.id) ? '요청중' : '요청'}
                </button>
              )}
              <button
                className="btn btn-remove"
                onClick={() => socket.emit('removeFriend', { friendId: friend.id })}
                disabled={alreadySharing}
                style={{ 
                  fontSize: '1rem', 
                  padding: '6px 12px',
                  opacity: alreadySharing ? 0.5 : 1
                }}
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