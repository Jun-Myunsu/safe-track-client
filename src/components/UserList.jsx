function UserList({ users, userId, onRequestShare }) {
  const otherUsers = users.filter(user => user.id !== userId)

  return (
    <div>
      {otherUsers.length === 0 ? (
        <p>다른 사용자가 없습니다.</p>
      ) : (
        otherUsers.map(user => (
          <div key={user.id} className="user-item">
            <div>
              <span>{user.name} ({user.id})</span>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                {user.isOnline ? (
                  user.isTracking ? '🟢 추적중' : '🟡 온라인'
                ) : (
                  '⚪ 오프라인'
                )}
              </div>
            </div>
            {user.isOnline && (
              <button 
                className="btn btn-secondary"
                onClick={() => onRequestShare(user.id)}
                style={{ fontSize: '11px', padding: '6px 12px' }}
              >
                위치 요청
              </button>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default UserList