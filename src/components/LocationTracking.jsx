import { useState } from "react";

const TEST_LOCATIONS = [
  { name: "경기도 양평군 강남로", lat: 37.4891, lng: 127.4875 },
  { name: "서울특별시 중랑구 봉우재로", lat: 37.5985, lng: 127.0927 },
  { name: "울산광역시 울주군 신전2길", lat: 35.5828, lng: 129.2039 },
  { name: "전라남도 나주시 남평향교길", lat: 35.0289, lng: 126.7836 },
];

function LocationTracking({
  isRegistered,
  isTracking,
  isSimulating,
  currentLocation,
  startTracking,
  stopTracking,
  startSimulation,
}) {
  const [showLocationTest, setShowLocationTest] = useState(false);

  const handleLocationTest = (location) => {
    if (window.startLocationSimulation) {
      window.startLocationSimulation(location.lat, location.lng);
    }
  };

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

      <button
        className="btn"
        onClick={() => setShowLocationTest(!showLocationTest)}
        disabled={!isRegistered || isTracking || isSimulating}
        style={{ width: "100%", marginTop: "8px" }}
      >
        📍 지역 테스트 {showLocationTest ? "▲" : "▼"}
      </button>

      {showLocationTest && (
        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {TEST_LOCATIONS.map((loc) => (
            <button
              key={loc.name}
              className="btn btn-secondary"
              onClick={() => handleLocationTest(loc)}
              disabled={!isRegistered || isTracking || isSimulating}
              style={{ width: "100%", fontSize: "0.8rem", padding: "8px 6px" }}
            >
              {loc.name}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export default LocationTracking;
