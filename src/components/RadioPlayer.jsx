import { useState, useRef, useEffect } from 'react'

function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  const radioUrl = 'https://streams.ilovemusic.de/iloveradio2.mp3'

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3
    }
  }, [])

  const togglePlay = async () => {
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      try {
        await audioRef.current?.play()
        setIsPlaying(true)
      } catch (error) {
        console.error('재생 실패:', error)
        setIsPlaying(false)
      }
    }
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={radioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />
      
      <button
        onClick={togglePlay}
        className="icon-btn radio-btn"
        style={{
          backgroundColor: isPlaying ? '#ff4444' : '#4CAF50'
        }}
        title={isPlaying ? '음악 일시정지' : '음악 재생'}
      >
        {isPlaying ? '⏸️' : '🎵'}
      </button>
    </>
  )
}

export default RadioPlayer