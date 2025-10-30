import { Circle } from 'react-leaflet';
import { getDangerZoneColor, getDangerZoneBorderColor } from '../services/dangerPredictionService';

/**
 * 위험 지역 오버레이 컴포넌트
 * AI가 예측한 위험 지역을 지도에 원형으로 표시 (팝업 없음)
 */
function DangerZoneOverlay({ dangerZones = [] }) {
  if (!dangerZones || dangerZones.length === 0) {
    return null;
  }

  // 위험도 순서로 정렬 (safe -> low -> medium -> high)
  const riskOrder = { safe: 0, low: 1, medium: 2, high: 3 };
  const sortedZones = [...dangerZones].sort((a, b) => 
    riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
  );

  return (
    <>
      {sortedZones.map((zone, index) => (
        <Circle
          key={`danger-zone-${index}-${zone.lat}-${zone.lng}`}
          center={[zone.lat, zone.lng]}
          radius={zone.radius || 300}
          pathOptions={{
            color: getDangerZoneBorderColor(zone.riskLevel),
            fillColor: getDangerZoneColor(zone.riskLevel),
            fillOpacity: 0.5,
            weight: 3,
            dashArray: '5, 5'
          }}
        />
      ))}
    </>
  );
}

export default DangerZoneOverlay;
