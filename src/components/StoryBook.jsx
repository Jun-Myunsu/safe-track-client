import { useState } from 'react'

function StoryBook() {
  const [showStory, setShowStory] = useState(false)
  const [currentStory, setCurrentStory] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleShowStory = async () => {
    setIsLoading(true)
    setShowStory(true)
    
    try {
      const response = await fetch(import.meta.env.VITE_SERVER_URL + '/api/emergency-tip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentStory({
          title: data.title || '응급상황 대처법',
          content: data.content
        })
      } else {
        setCurrentStory({
          title: '오류',
          content: '응급 상식을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.'
        })
      }
    } catch (error) {
      console.error('응급 상식 로드 실패:', error)
      setCurrentStory({
        title: '연결 오류',
        content: '서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setShowStory(false)
  }

  return (
    <>
      <button
        className="icon-btn story-btn"
        onClick={handleShowStory}
        title="안전 이야기"
      >
        📖
      </button>

      {showStory && currentStory && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content story-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{currentStory.title}</h3>
              <button className="modal-close" onClick={handleClose}>✕</button>
            </div>
            <div className="modal-body">
              {isLoading ? (
                <p style={{ textAlign: 'center', opacity: 0.7 }}>응급 상식을 불러오는 중...</p>
              ) : (
                <p>{currentStory.content}</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={handleShowStory} disabled={isLoading}>
                {isLoading ? '로딩 중...' : '다른 상식 보기'}
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

export default StoryBook
