function LocationTracking({
  isRegistered,
  isTracking,
  isSimulating,
  currentLocation,
  startTracking,
  stopTracking,
  startSimulation
}) {
  return (
    <>
      <h3>위치 추적</h3>
      <div className="btn-group">
        <button 
          className="btn btn-white"
          onClick={(isTracking && !isSimulating) ? stopTracking : startTracking}
          disabled={!isRegistered || isSimulating}
        >
          {(isTracking && !isSimulating) ? '추적 중지' : '실제 위치 추적'}
        </button>
        
        <button 
          className="btn btn-white"
          onClick={isSimulating ? stopTracking : startSimulation}
          disabled={!isRegistered || (isTracking && !isSimulating)}
        >
          {isSimulating ? '시뮬레이션 중지' : '가상 이동 테스트'}
        </button>
      </div>
      
      {isTracking && (
        <div className="status tracking">
          실제 위치 추적 중
        </div>
      )}
      
      {isSimulating && (
        <div className="status tracking">
          가상 이동 시뮬레이션 중
        </div>
      )}
      
      {currentLocation && (
        <div className="location-coords">
          현재 위치: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
        </div>
      )}
    </>
  )
}

export default LocationTracking