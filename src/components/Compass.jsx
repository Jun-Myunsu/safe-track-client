import { useState, useEffect } from 'react'

function Compass() {
  const [heading, setHeading] = useState(0)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // DeviceOrientationEvent 지원 확인
    if (window.DeviceOrientationEvent) {
      setIsSupported(true)

      const handleOrientation = (event) => {
        // alpha: 0-360도, 북쪽이 0도
        if (event.alpha !== null) {
          setHeading(360 - event.alpha)
        } else if (event.webkitCompassHeading !== undefined) {
          // iOS Safari용
          setHeading(event.webkitCompassHeading)
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

  return (
    <div className="compass-container">
      <div className="compass-ring">
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
    </div>
  )
}

export default Compass
