import { useRef, useEffect } from 'react'

function ChatSection({
  chatMessages,
  chatInput,
  setChatInput,
  sendMessage,
  isRegistered,
  getConnectedUsers
}) {
  const chatMessagesRef = useRef(null)

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [chatMessages])

  return (
    <div className="chat-section" style={{
      marginTop: '15px',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      <div 
        ref={chatMessagesRef}
        className="chat-messages" 
        style={{
          height: '200px',
          padding: '15px',
          overflowY: 'auto',
          backgroundColor: '#fafafa',
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        {chatMessages.length === 0 ? (
          <div style={{ 
            color: '#999', 
            textAlign: 'center',
            fontSize: '14px',
            marginTop: '40px'
          }}>
            💬 연결된 사용자와 채팅하세요
          </div>
        ) : (
          chatMessages.map((msg, index) => (
            <div key={index} style={{
              marginBottom: '12px',
              display: 'flex',
              justifyContent: msg.type === 'sent' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: '75%',
                padding: '8px 12px',
                borderRadius: msg.type === 'sent' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                backgroundColor: msg.type === 'sent' ? '#007bff' : '#ffffff',
                color: msg.type === 'sent' ? 'white' : '#333',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                position: 'relative'
              }}>
                {msg.type === 'received' && (
                  <div style={{ 
                    fontSize: '11px', 
                    opacity: 0.7,
                    marginBottom: '2px',
                    fontWeight: '500'
                  }}>
                    {msg.from}
                  </div>
                )}
                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                  {msg.message}
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  opacity: 0.6,
                  marginTop: '2px',
                  textAlign: 'right'
                }}>
                  {new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{
        padding: '12px',
        backgroundColor: '#ffffff',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="메시지를 입력하세요..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          disabled={!isRegistered || getConnectedUsers().length === 0}
          style={{
            flex: 1,
            padding: '10px 15px',
            border: '1px solid #e0e0e0',
            borderRadius: '20px',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: '#f8f9fa'
          }}
        />
        <button 
          onClick={sendMessage}
          disabled={!chatInput.trim() || !isRegistered || getConnectedUsers().length === 0}
          style={{
            padding: '10px 16px',
            backgroundColor: chatInput.trim() && isRegistered && getConnectedUsers().length > 0 ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            fontSize: '14px',
            cursor: chatInput.trim() && isRegistered && getConnectedUsers().length > 0 ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s'
          }}
        >
          전송
        </button>
      </div>
    </div>
  )
}

export default ChatSection