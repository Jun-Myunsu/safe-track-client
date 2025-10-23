import { useEffect, useRef } from 'react'

function ShareRequests({ shareRequests, respondToRequest }) {
  const sectionRef = useRef(null)
  const timeoutsRef = useRef(new Map())

  useEffect(() => {
    if (shareRequests.length > 0 && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // 새 요청에 대해 15초 타이머 설정
    shareRequests.forEach(request => {
      if (!timeoutsRef.current.has(request.requestId)) {
        const timeoutId = setTimeout(() => {
          respondToRequest(request.requestId, false)
        }, 15000)
        timeoutsRef.current.set(request.requestId, timeoutId)
      }
    })

    // 제거된 요청의 타이머 정리
    const currentRequestIds = new Set(shareRequests.map(r => r.requestId))
    for (const [requestId, timeoutId] of timeoutsRef.current.entries()) {
      if (!currentRequestIds.has(requestId)) {
        clearTimeout(timeoutId)
        timeoutsRef.current.delete(requestId)
      }
    }
  }, [shareRequests, respondToRequest])

  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 모든 타이머 정리
      timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId))
      timeoutsRef.current.clear()
    }
  }, [])

  if (shareRequests.length === 0) return null

  return (
    <div className="section" ref={sectionRef}>
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