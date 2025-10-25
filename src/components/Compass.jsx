import { useState, useEffect } from 'react'

function Compass({ onHeadingChange, onRotateMap }) {
  const [heading, setHeading] = useState(0)
  const [isSupported, setIsSupported] = useState(false)
  const [isRotating, setIsRotating] = useState(false)

  useEffect(() => {
    // DeviceOrientationEvent 지원 확인
    if (window.DeviceOrientationEvent) {
      setIsSupported(true)

      const handleOrientation = (event) => {
        // alpha: 0-360도, 북쪽이 0도
        let newHeading = 0
        if (event.alpha !== null) {
          newHeading = 360 - event.alpha
        } else if (event.webkitCompassHeading !== undefined) {
          // iOS Safari용
          newHeading = event.webkitCompassHeading
        }
        setHeading(newHeading)
        if (onHeadingChange) {
          onHeadingChange(newHeading)
        }
      }

      // iOS 13+ 권한 요청
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(permissionState => {
            if (permissionState === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation)
            }
          })
          .catch(console.error)
      } else {
        // 안드로이드 및 이전 iOS
        window.addEventListener('deviceorientation', handleOrientation)
      }

      return () => {
        window.removeEventListener('deviceorientation', handleOrientation)
      }
    }
  }, [])

  const handleCompassClick = () => {
    if (onRotateMap) {
      setIsRotating(!isRotating)
      onRotateMap(!isRotating)
    }
  }

  return (
    <div 
      className="compass-container"
      onClick={handleCompassClick}
      style={{ cursor: onRotateMap ? 'pointer' : 'default' }}
      title={onRotateMap ? (isRotating ? '지도 회전 해제' : '지도 회전 활성화') : ''}
    >
      <div className="compass-ring" style={{ opacity: isRotating ? 1 : 0.7 }}>
        <div className="compass-mark n">N</div>
        <div className="compass-mark e">E</div>
        <div className="compass-mark s">S</div>
        <div className="compass-mark w">W</div>
      </div>
      <div 
        className="compass-needle"
        style={{ transform: `rotate(${heading}deg)` }}
      >
        <div className="needle-north"></div>
        <div className="needle-south"></div>
      </div>
      <div className="compass-center"></div>
      {!isSupported && (
        <div className="compass-fallback">🧭</div>
      )}
      {isRotating && (
        <div style={{
          position: 'absolute',
          bottom: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '10px',
          color: '#00ff88',
          whiteSpace: 'nowrap'
        }}>회전중</div>
      )}
    </div>
  )
}

export default Compass
