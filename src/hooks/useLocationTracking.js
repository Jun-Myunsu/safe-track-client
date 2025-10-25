import { useState, useRef, useCallback } from 'react'
import { STORAGE_KEYS, SIMULATION, GEOLOCATION_OPTIONS, ERROR_MESSAGES } from '../constants/app'
import { saveAppState } from '../utils/localStorage'
import { speechService } from '../services/speechService'

/**
 * 위치 정보를 계산하는 유틸리티 함수
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  return Math.sqrt(
    Math.pow((lat2 - lat1) * 111000, 2) +
    Math.pow((lng2 - lng1) * 111000 * Math.cos(lat1 * Math.PI / 180), 2)
  )
}

/**
 * 위치 추적 관련 로직을 관리하는 커스텀 훅
 */
export const useLocationTracking = (socket, userId, setLocations) => {
  const [isTracking, setIsTracking] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.IS_TRACKING) === 'true'
  })

  const [isSimulating, setIsSimulating] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.IS_SIMULATING) === 'true'
  })

  const [currentLocation, setCurrentLocation] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_LOCATION)
    return saved ? JSON.parse(saved) : null
  })

  const watchIdRef = useRef(null)
  const simulationRef = useRef(null)

  /**
   * 위치 에러 메시지 반환
   */
  const getGeolocationErrorMessage = useCallback((error) => {
    if (error.code === 1) return ERROR_MESSAGES.PERMISSION_DENIED
    if (error.code === 2) return ERROR_MESSAGES.POSITION_UNAVAILABLE
    if (error.code === 3) return ERROR_MESSAGES.TIMEOUT
    return '위치를 가져올 수 없습니다'
  }, [])

  /**
   * 실시간 위치 추적 시작
   */
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      alert(ERROR_MESSAGES.GEOLOCATION_NOT_SUPPORTED)
      return
    }

    if (!socket || !userId) return

    socket.emit('startTracking', { userId })

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        console.log(`GPS 위치: ${latitude}, ${longitude} (정확도: ${accuracy}m)`)

        socket.emit('locationUpdate', {
          userId,
          lat: latitude,
          lng: longitude
        })

        const newLocation = { lat: latitude, lng: longitude }
        setCurrentLocation(newLocation)
        saveAppState.currentLocation(newLocation)
      },
      (error) => {
        console.error('위치 오류:', error)
        const errorMessage = getGeolocationErrorMessage(error)

        alert(errorMessage)
        setIsTracking(false)
        saveAppState.isTracking('false')
        socket.emit('stopTracking', { userId })
      },
      GEOLOCATION_OPTIONS
    )

    setIsTracking(true)
    saveAppState.isTracking('true')
    speechService.notifyTrackingStarted()
  }, [socket, userId, getGeolocationErrorMessage])

  /**
   * 위치 추적 중지
   */
  const stopTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    if (simulationRef.current) {
      clearInterval(simulationRef.current)
      simulationRef.current = null
    }

    if (socket && userId) {
      socket.emit('stopTracking', { userId })
    }

    setIsTracking(false)
    setIsSimulating(false)
    setCurrentLocation(null)

    // 위치 히스토리 초기화
    setLocations(prev => prev.filter(loc => loc.userId !== userId))

    saveAppState.isTracking('false')
    saveAppState.isSimulating('false')
    localStorage.removeItem(STORAGE_KEYS.CURRENT_LOCATION)

    // 위험도 예측 초기화 이벤트 발생
    window.dispatchEvent(new CustomEvent('clearDangerAnalysis'))

    speechService.notifyTrackingStopped()
  }, [socket, userId, setLocations])

  /**
   * 시뮬레이션 모드 시작 (테스트용)
   */
  const startSimulation = useCallback(() => {
    if (!socket || !userId) return

    const { START_LAT, START_LNG, END_LAT, END_LNG, WALKING_SPEED, UPDATE_INTERVAL, RANDOM_VARIATION } = SIMULATION

    // 거리 계산
    const distance = calculateDistance(START_LAT, START_LNG, END_LAT, END_LNG)

    // 이동 계산
    const stepDistance = WALKING_SPEED * (UPDATE_INTERVAL / 1000)
    const totalSteps = Math.ceil(distance / stepDistance)

    let currentLat = START_LAT
    let currentLng = START_LNG
    let step = 0

    socket.emit('startTracking', { userId })
    setIsTracking(true)
    setIsSimulating(true)
    saveAppState.isTracking('true')
    saveAppState.isSimulating('true')
    speechService.notifyTrackingStarted()

    // 초기 위치 전송
    socket.emit('locationUpdate', { userId, lat: currentLat, lng: currentLng })
    const newLocation = { lat: currentLat, lng: currentLng }
    setCurrentLocation(newLocation)
    saveAppState.currentLocation(newLocation)

    simulationRef.current = setInterval(() => {
      step++

      if (step >= totalSteps) {
        clearInterval(simulationRef.current)
        simulationRef.current = null
        setIsSimulating(false)
        setIsTracking(false)
        socket.emit('stopTracking', { userId })
        return
      }

      // 선형 보간으로 이동
      const progress = step / totalSteps
      currentLat = START_LAT + (END_LAT - START_LAT) * progress
      currentLng = START_LNG + (END_LNG - START_LNG) * progress

      // 랜덤 변동 추가
      currentLat += (Math.random() - 0.5) * RANDOM_VARIATION
      currentLng += (Math.random() - 0.5) * RANDOM_VARIATION

      socket.emit('locationUpdate', { userId, lat: currentLat, lng: currentLng })
      const newLocation = { lat: currentLat, lng: currentLng }
      setCurrentLocation(newLocation)
      saveAppState.currentLocation(newLocation)
    }, UPDATE_INTERVAL)
  }, [socket, userId])

  return {
    // 상태
    isTracking,
    isSimulating,
    currentLocation,

    // 액션
    startTracking,
    stopTracking,
    startSimulation,

    // 내부 ref (cleanup용)
    watchIdRef,
    simulationRef
  }
}
