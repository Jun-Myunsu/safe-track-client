import { Circle, Popup } from 'react-leaflet';
import { getDangerZoneColor, getDangerZoneBorderColor } from '../services/dangerPredictionService';

/**
 * 위험 지역 오버레이 컴포넌트
 * AI가 예측한 위험 지역을 지도에 원형으로 표시
 */
function DangerZoneOverlay({ dangerZones = [] }) {
  if (!dangerZones || dangerZones.length === 0) {
    return null;
  }

  return (
    <>
      {dangerZones.map((zone, index) => (
        <Circle
          key={`danger-zone-${index}-${zone.lat}-${zone.lng}`}
          center={[zone.lat, zone.lng]}
          radius={zone.radius || 300}
          pathOptions={{
            color: getDangerZoneBorderColor(zone.riskLevel),
            fillColor: getDangerZoneColor(zone.riskLevel),
            fillOpacity: 0.4,
            weight: 2,
            dashArray: '5, 5'
          }}
        >
          <Popup>
            <div style={{ minWidth: '200px' }}>
              <strong style={{
                fontSize: '1.1rem',
                color: zone.riskLevel === 'high' ? '#ff0000' :
                       zone.riskLevel === 'medium' ? '#ff8800' : '#ffaa00'
              }}>
                {zone.riskLevel === 'high' ? '⚠️ 높은 주의' :
                 zone.riskLevel === 'medium' ? '⚡ 중간 주의' : '💡 낮은 주의'}
              </strong>
              <hr style={{ margin: '8px 0', borderColor: '#444' }} />

              <div style={{ marginBottom: '8px' }}>
                <strong>위치:</strong><br />
                위도: {zone.lat.toFixed(6)}<br />
                경도: {zone.lng.toFixed(6)}<br />
                반경: {zone.radius}m
              </div>

              {zone.reason && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>이유:</strong><br />
                  {zone.reason}
                </div>
              )}

              {zone.recommendations && zone.recommendations.length > 0 && (
                <div>
                  <strong>권고사항:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {zone.recommendations.map((rec, idx) => (
                      <li key={idx} style={{ fontSize: '0.9rem', marginBottom: '2px' }}>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Popup>
        </Circle>
      ))}
    </>
  );
}

export default DangerZoneOverlay;
