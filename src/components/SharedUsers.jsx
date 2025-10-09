function SharedUsers({ sharedUsers, stopLocationShare }) {
  if (sharedUsers.length === 0) return null

  return (
    <div>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>위치 공유 중</h4>
      {sharedUsers.map(user => (
        <div key={user.id} className="user-item">
          <span><strong>{user.name}</strong> ({user.id})</span>
          <button 
            className="btn btn-danger" 
            onClick={() => stopLocationShare(user.id)}
            style={{ fontSize: '11px', padding: '6px 12px' }}
          >
            중지
          </button>
        </div>
      ))}
    </div>
  )
}

export default SharedUsers