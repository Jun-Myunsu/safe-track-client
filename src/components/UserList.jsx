function UserList({ users, userId }) {
  const otherUsers = users.filter(user => user.id !== userId)

  return (
    <div className="section">
      <h3>다른 사용자</h3>
      {otherUsers.length === 0 ? (
        <p>다른 사용자가 없습니다.</p>
      ) : (
        otherUsers.map(user => (
          <div key={user.id} className="user-item">
            <span>{user.name} ({user.id})</span>
            <span>
              {user.isOnline ? (
                user.isTracking ? '🟢 추적중' : '🟡 온라인'
              ) : (
                '⚪ 오프라인'
              )}
            </span>
          </div>
        ))
      )}
    </div>
  )
}

export default UserList