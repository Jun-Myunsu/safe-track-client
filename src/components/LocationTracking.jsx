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
          {(isTracking && !isSimulating) ? '🔴 STOP TRACK' : '📍 START TRACK'}
        </button>

        <button
          className={`btn btn-tracking ${isSimulating ? 'active' : ''}`}
          onClick={isSimulating ? stopTracking : startSimulation}
          disabled={!isRegistered || (isTracking && !isSimulating)}
        >
          {isSimulating ? '🔴 STOP TEST' : '🧪 TEST MODE'}
        </button>
      </div>
      



      

    </>
  )
}

export default LocationTracking