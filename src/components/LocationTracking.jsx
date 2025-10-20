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
      <div className="btn-group">
        <button 
          className="btn btn-white"
          onClick={(isTracking && !isSimulating) ? stopTracking : startTracking}
          disabled={!isRegistered || isSimulating}
        >
          {(isTracking && !isSimulating) ? '추적 중지' : '위치 추적'}
        </button>
        
        <button 
          className="btn btn-white"
          onClick={isSimulating ? stopTracking : startSimulation}
          disabled={!isRegistered || (isTracking && !isSimulating)}
        >
          {isSimulating ? '시뮬레이션 중지' : '테스트'}
        </button>
      </div>
      



      

    </>
  )
}

export default LocationTracking