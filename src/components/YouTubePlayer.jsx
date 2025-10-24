import { useState } from 'react'

const PLAYLIST_ID = 'PLxiG50Xm_UUBddB6cxjsxkxiT50eBQ-Mu'

function YouTubePlayer() {
  const [isOpen, setIsOpen] = useState(false)

  const getRandomVideoUrl = () => {
    return `https://www.youtube.com/embed/videoseries?list=${PLAYLIST_ID}&autoplay=1`
  }

  if (!isOpen) {
    return (
      <button
        className="icon-btn"
        onClick={() => setIsOpen(true)}
        style={{ background: '#FF0000' }}
        title="유튜브 재생"
      >
        ▶️
      </button>
    )
  }

  return (
    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🎥 유튜브 재생</h3>
          <button className="modal-close" onClick={() => setIsOpen(false)}>
            ×
          </button>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          <iframe
            width="100%"
            height="400"
            src={getRandomVideoUrl()}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius: 0 }}
          />
        </div>
      </div>
    </div>
  )
}

export default YouTubePlayer
