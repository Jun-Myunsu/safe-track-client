function SharedUsers({ sharedUsers, stopLocationShare }) {
  if (sharedUsers.length === 0) return null

  return (
    <div className="section">
      <h3>위치 공유 중인 사용자</h3>
      {sharedUsers.map(user => (
        <div key={user.id} className="user-item">
          <span><strong>{user.name}</strong> ({user.id})에게 내 위치 공유 중</span>
          <button 
            className="btn btn-danger" 
            onClick={() => stopLocationShare(user.id)}
            style={{ fontSize: '12px', padding: '10px 20px', minWidth: '100px' }}
          >
            공유 중지
          </button>
        </div>
      ))}
    </div>
  )
}

export default SharedUsers