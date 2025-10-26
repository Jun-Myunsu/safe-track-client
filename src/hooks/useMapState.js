import { useState, useEffect } from "react";

export function useMapState(isTracking) {
  const [mapType, setMapType] = useState("street");
  const [showEmergency, setShowEmergency] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showCrimeZones, setShowCrimeZones] = useState(true);
  const [showSecurityFacilities, setShowSecurityFacilities] = useState(true);
  const [showEmergencyBells, setShowEmergencyBells] = useState(false);
  const [showWomenSafety, setShowWomenSafety] = useState(false);
  const [showChildCrimeZones, setShowChildCrimeZones] = useState(false);
  const [showMurderStats, setShowMurderStats] = useState(true);
  const [showCCTV, setShowCCTV] = useState(false);
  const [showMissingPersons, setShowMissingPersons] = useState(false);
  const [showMapButtons, setShowMapButtons] = useState(true);

  useEffect(() => {
    if (!isTracking) {
      setShowMissingPersons(false);
    }
  }, [isTracking]);

  return {
    mapType, setMapType,
    showEmergency, setShowEmergency,
    showTraffic, setShowTraffic,
    showCrimeZones, setShowCrimeZones,
    showSecurityFacilities, setShowSecurityFacilities,
    showEmergencyBells, setShowEmergencyBells,
    showWomenSafety, setShowWomenSafety,
    showChildCrimeZones, setShowChildCrimeZones,
    showMurderStats, setShowMurderStats,
    showCCTV, setShowCCTV,
    showMissingPersons, setShowMissingPersons,
    showMapButtons, setShowMapButtons,
  };
}
