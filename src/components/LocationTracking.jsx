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
          className={`btn btn-tracking ${(isTracking && !isSimulating) ? 'active' : ''}`}
          onClick={(isTracking && !isSimulating) ? stopTracking : startTracking}
          disabled={!isRegistered || isSimulating}
        >
          {(isTracking && !isSimulating) ? '🔴 STOP TRACK' : '📍 위치 추적'}
        </button>

        <button
          className={`btn btn-tracking ${isSimulating ? 'active' : ''}`}
          onClick={isSimulating ? stopTracking : startSimulation}
          disabled={!isRegistered || (isTracking && !isSimulating)}
        >
          {isSimulating ? '🔴 STOP TEST' : '🧪 가상 위치 추적'}
        </button>
      </div>
      



      

    </>
  )
}

export default LocationTracking