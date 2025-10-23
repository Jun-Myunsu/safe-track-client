function LocationTracking({
  isRegistered,
  isTracking,
  isSimulating,
  currentLocation,
  startTracking,
  stopTracking,
  startSimulation,
}) {
  return (
    <>
      <div className="btn-group">
        <button
          className={`btn btn-tracking ${
            isTracking && !isSimulating ? "active" : ""
          }`}
          onClick={isTracking && !isSimulating ? stopTracking : startTracking}
          disabled={!isRegistered || isSimulating}
        >
          {isTracking && !isSimulating ? "🔴 추적 중지" : "📍 위치 추적"}
        </button>

        <button
          className={`btn btn-tracking ${isSimulating ? "active" : ""}`}
          onClick={isSimulating ? stopTracking : startSimulation}
          disabled={!isRegistered || (isTracking && !isSimulating)}
        >
          {isSimulating ? "🔴 추적 중지" : "🧪 테스트"}
        </button>
      </div>
    </>
  );
}

export default LocationTracking;
