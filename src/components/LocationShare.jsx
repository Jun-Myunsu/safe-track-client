function LocationShare({
  isRegistered,
  targetUserId,
  setTargetUserId,
  requestLocationShare
}) {
  return (
    <>
      <h3>내 위치 공유 요청</h3>
      <p>
        위험한 상황에서 신뢰할 수 있는 사람에게 내 위치를 공유하세요.
      </p>
      <div className="input-group">
        <input
          type="text"
          placeholder="신뢰할 수 있는 사람의 ID"
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
        />
        <button 
          className="btn btn-white" 
          onClick={requestLocationShare}
          disabled={!isRegistered}
        >
          내 위치 공유 요청
        </button>
      </div>
    </>
  )
}

export default LocationShare