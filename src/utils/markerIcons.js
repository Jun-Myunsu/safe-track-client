import L from "leaflet";

// 기본 마커 아이콘 설정
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export const createUserMarkerIcon = () =>
  L.divIcon({
    html: `
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="background: linear-gradient(135deg, #ff6b6b, #ff3838); width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 3px 8px rgba(255, 59, 56, 0.4), 0 0 0 1px rgba(255, 59, 56, 0.2); display: flex; align-items: center; justify-content: center; position: relative; animation: pulse 2s infinite;">
        <span style="color: white; font-weight: bold; font-size: 10px; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">📍</span>
      </div>
      <div style="position: absolute; top: -1px; right: -1px; background: #00ff88; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.2);"></div>
    </div>
    <style>@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }</style>
  `,
    className: "current-user-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

export const createOtherUserMarkerIcon = () =>
  L.divIcon({
    html: `
    <div style="background: linear-gradient(135deg, #ff5722, #d32f2f); width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(255, 193, 7, 0.4), 0 0 0 1px rgba(255, 235, 59, 0.3); display: flex; align-items: center; justify-content: center; animation: blink 1.5s ease-in-out infinite;">
      <span style="font-size: 12px;">🚶</span>
    </div>
    <style>@keyframes blink { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.1); } }</style>
  `,
    className: "current-location-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

export const createEmergencyIcon = (emoji, color, size = 16) =>
  L.divIcon({
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: ${size/2}px;">${emoji}</div>`,
    className: "emergency-marker",
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
