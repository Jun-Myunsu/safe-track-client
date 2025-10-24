import { useState, useEffect } from 'react'

function AdminControl({ userId, socket }) {
  const [isAccepting, setIsAccepting] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!socket || userId !== 'msjun') return

    socket.emit('getRegistrationStatus')

    const handleStatus = (data) => {
      setIsAccepting(data.enabled)
    }

    const handleToggled = (data) => {
      setIsAccepting(data.enabled)
    }

    socket.on('registrationStatus', handleStatus)
    socket.on('registrationToggled', handleToggled)

    return () => {
      socket.off('registrationStatus', handleStatus)
      socket.off('registrationToggled', handleToggled)
    }
  }, [socket, userId])

  if (userId !== 'msjun') return null

  const toggleAccepting = () => {
    if (socket) {
      socket.emit('toggleRegistration', { userId })
    }
    setShowModal(false)
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setShowModal(true)
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.2rem',
          padding: '4px',
          marginLeft: '8px',
          filter: isAccepting ? 'grayscale(0%)' : 'grayscale(100%)',
          opacity: isAccepting ? 1 : 0.5,
          transition: 'all 0.2s ease'
        }}
        title={isAccepting ? '회원 수락 중' : '회원 수락 중지'}
      >
        🔑
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>🔑 회원 수락 설정</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                현재 상태: <strong>{isAccepting ? '회원 수락 중' : '회원 수락 중지'}</strong>
              </p>
              <button
                className="btn btn-primary"
                onClick={toggleAccepting}
                style={{ width: '100%', fontSize: '1.1rem', padding: '12px' }}
              >
                {isAccepting ? '회원 수락 중지' : '회원 수락 시작'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminControl
