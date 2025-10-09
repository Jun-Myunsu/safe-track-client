function ShareRequests({ shareRequests, respondToRequest }) {
  if (shareRequests.length === 0) return null

  return (
    <div className="section">
      <h3>위치 공유 요청 알림</h3>
      {shareRequests.map(request => (
        <div key={request.requestId} className="user-item">
          <span><strong>{request.fromName}</strong>이 자신의 위치를 나에게 공유하고 싶어합니다</span>
          <div className="btn-group">
            <button 
              className="btn btn-primary" 
              onClick={() => respondToRequest(request.requestId, true)}
            >
              수락
            </button>
            <button 
              className="btn btn-danger" 
              onClick={() => respondToRequest(request.requestId, false)}
            >
              거부
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ShareRequests