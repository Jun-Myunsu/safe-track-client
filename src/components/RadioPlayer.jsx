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
        style={{
          background: isPlaying ? '#ff4444' : '#4CAF50',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}
        title={isPlaying ? '음악 일시정지' : '음악 재생'}
      >
        {isPlaying ? '⏸️' : '🎵'}
      </button>
    </>
  )
}

export default RadioPlayer