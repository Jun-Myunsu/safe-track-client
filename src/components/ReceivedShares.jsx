function ReceivedShares({ receivedShares, stopReceivingShare }) {
  if (receivedShares.length === 0) return null

  return (
    <div className="section">
      <h3>받은 위치 공유</h3>
      {receivedShares.map(user => (
        <div key={user.id} className="user-item">
          <span><strong>{user.name}</strong> ({user.id})의 위치 받는 중</span>
          <button 
            className="btn btn-danger" 
            onClick={() => stopReceivingShare(user.id)}
            style={{ fontSize: '12px', padding: '10px 20px', minWidth: '100px' }}
          >
            수신 중지
          </button>
        </div>
      ))}
    </div>
  )
}

export default ReceivedShares