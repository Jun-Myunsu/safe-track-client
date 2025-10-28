import { useState } from 'react';

export default function RoadEventPanel({ events, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!events || events.length === 0) return null;

  const event = events[currentIndex];

  const getEventColor = (type) => {
    switch(type) {
      case '교통사고': return '#ef4444';
      case '공사': return '#f59e0b';
      case '기상': return '#3b82f6';
      case '재난': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10000,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      padding: '16px',
      borderRadius: '12px',
      border: `2px solid ${getEventColor(event.eventType)}`,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
      maxWidth: '90vw',
      width: '400px',
      color: '#fff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🚨</span>
          <span style={{ fontWeight: 'bold', color: getEventColor(event.eventType) }}>
            {event.eventType}
          </span>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent',
          border: 'none',
          color: '#aaa',
          fontSize: '1.5rem',
          cursor: 'pointer',
          padding: 0,
          lineHeight: 1
        }}>×</button>
      </div>

      <div style={{ fontSize: '0.9rem', color: '#e0e0e0', marginBottom: '12px' }}>
        <div style={{ marginBottom: '8px' }}>
          <strong style={{ color: '#fff' }}>{event.roadName}</strong>
          {event.roadDrcType && <span style={{ marginLeft: '8px', color: '#aaa' }}>({event.roadDrcType})</span>}
        </div>
        <div style={{ color: '#fbbf24', marginBottom: '4px' }}>{event.message}</div>
        {event.lanesBlocked && (
          <div style={{ fontSize: '0.85rem', color: '#f87171' }}>🚧 {event.lanesBlocked}</div>
        )}
        <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '8px' }}>
          발생: {event.startDate?.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3 $4:$5')}
        </div>
      </div>

      {events.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #444' }}>
          <button
            onClick={() => setCurrentIndex(prev => (prev - 1 + events.length) % events.length)}
            disabled={currentIndex === 0}
            style={{
              padding: '6px 12px',
              background: currentIndex === 0 ? '#333' : '#555',
              color: currentIndex === 0 ? '#666' : '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem'
            }}
          >← 이전</button>
          <span style={{ fontSize: '0.85rem', color: '#aaa' }}>
            {currentIndex + 1} / {events.length}
          </span>
          <button
            onClick={() => setCurrentIndex(prev => (prev + 1) % events.length)}
            disabled={currentIndex === events.length - 1}
            style={{
              padding: '6px 12px',
              background: currentIndex === events.length - 1 ? '#333' : '#555',
              color: currentIndex === events.length - 1 ? '#666' : '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: currentIndex === events.length - 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem'
            }}
          >다음 →</button>
        </div>
      )}
    </div>
  );
}
