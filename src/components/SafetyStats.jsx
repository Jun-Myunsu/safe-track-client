import { useState } from 'react'

function SafetyStats() {
  const [showStats, setShowStats] = useState(false)
  const [currentStats, setCurrentStats] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleShowStats = async () => {
    setShowStats(true)
    setIsLoading(true)
    setCurrentStats(null)
    
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://safe-track-server.onrender.com'
      const response = await fetch(`${serverUrl}/api/safety-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentStats({
          title: data.title || '안전사고 통계',
          content: data.content
        })
      } else {
        setCurrentStats({
          title: '오류',
          content: '안전 통계를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.'
        })
      }
    } catch (error) {
      console.error('안전 통계 로드 실패:', error)
      setCurrentStats({
        title: '연결 오류',
        content: '서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setShowStats(false)
  }

  return (
    <>
      <button
        className="icon-btn story-btn"
        onClick={handleShowStats}
        title="안전 통계"
      >
        📊
      </button>

      {showStats && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content story-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isLoading ? '로딩 중...' : currentStats?.title || '안전사고 통계'}</h3>
              <button className="modal-close" onClick={handleClose}>✕</button>
            </div>
            <div className="modal-body">
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div className="spinner"></div>
                  <p style={{ marginTop: '20px', opacity: 0.7 }}>안전 통계를 분석하는 중...</p>
                </div>
              ) : (
                <p style={{ whiteSpace: 'pre-line' }}>{currentStats?.content}</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={handleShowStats} disabled={isLoading}>
                {isLoading ? '로딩 중...' : '새로고침'}
              </button>
              <button className="btn btn-secondary" onClick={handleClose}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SafetyStats
