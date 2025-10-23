import { useState, useRef, useEffect } from 'react'

/**
 * AI 채팅 섹션 컴포넌트
 * 사용자와 AI 간의 대화를 표시하고 관리
 */
const AIChatSection = ({ socket, userId, currentLocation }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // AI 응답 이벤트 리스너
  useEffect(() => {
    if (!socket) return

    const handleAIMessage = (data) => {
      setMessages(prev => [...prev, {
        from: 'AI',
        message: data.message,
        timestamp: data.timestamp,
        isAI: true
      }])
      setIsLoading(false)
    }

    const handleAIError = (error) => {
      console.error('AI 오류:', error)
      setMessages(prev => [...prev, {
        from: 'AI',
        message: '죄송합니다. 오류가 발생했습니다.',
        timestamp: new Date().toISOString(),
        isAI: true,
        isError: true
      }])
      setIsLoading(false)
    }

    socket.on('aiMessage', handleAIMessage)
    socket.on('error', handleAIError)

    return () => {
      socket.off('aiMessage', handleAIMessage)
      socket.off('error', handleAIError)
    }
  }, [socket])

  // 메시지 전송
  const sendMessage = () => {
    if (!input.trim() || !socket || isLoading) return

    const userMessage = {
      from: userId,
      message: input.trim(),
      timestamp: new Date().toISOString(),
      isAI: false
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    socket.emit('sendMessageToAI', { 
      message: input.trim(),
      location: currentLocation 
    })
    setInput('')
  }

  // Enter 키로 전송
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 대화 초기화
  const clearConversation = () => {
    if (!socket) return

    socket.emit('clearAIConversation')
    setMessages([])
  }

  return (
    <div className="section" style={{ marginTop: '16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{ margin: 0, fontFamily: '"VT323", monospace' }}>
          🤖 AI 채팅
        </h3>
        {messages.length > 0 && (
          <button
            className="btn btn-secondary"
            onClick={clearConversation}
            style={{
              width: 'auto',
              minWidth: 'auto',
              padding: '8px 16px'
            }}
          >
            초기화
          </button>
        )}
      </div>

      {/* 채팅 메시지 목록 */}
      <div style={{
        height: '300px',
        overflowY: 'auto',
        border: '2px solid #555555',
        background: '#1a1a1a',
        padding: '12px',
        marginBottom: '12px',
        borderRadius: '0'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#888888',
            padding: '20px',
            fontFamily: '"VT323", monospace',
            fontSize: '1.1rem'
          }}>
            AI 친구와 자유롭게 대화해보세요! 💬<br/>
            <span style={{ fontSize: '0.9rem', color: '#666666' }}>
              일상, 고민, 궁금한 것... 무엇이든 이야기하세요!
            </span>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              style={{
                marginBottom: '12px',
                padding: '10px',
                background: msg.isAI ? '#2a2a2a' : '#1f3a2a',
                border: `1px solid ${msg.isAI ? '#555555' : '#3a5a4a'}`,
                borderRadius: '0',
                borderLeft: `4px solid ${msg.isAI ? '#888888' : '#00ff88'}`
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <strong style={{
                  color: msg.isAI ? '#cccccc' : '#00ff88',
                  fontFamily: '"VT323", monospace',
                  fontSize: '1.1rem'
                }}>
                  {msg.isAI ? '🤖 AI Assistant' : `👤 ${msg.from}`}
                </strong>
                <span style={{
                  fontSize: '0.85rem',
                  color: '#888888',
                  fontFamily: '"VT323", monospace'
                }}>
                  {new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div style={{
                color: '#e0e0e0',
                fontSize: '1rem',
                fontFamily: '"VT323", monospace',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {msg.message}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div style={{
            padding: '10px',
            background: '#2a2a2a',
            border: '1px solid #555555',
            borderLeft: '4px solid #888888',
            color: '#888888',
            fontFamily: '"VT323", monospace',
            fontSize: '1.1rem'
          }}>
            🤖 AI가 생각 중...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 입력 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        width: '100%'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="AI에게 메시지 보내기..."
          disabled={isLoading}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '12px',
            border: '2px solid #555555',
            background: '#1a1a1a',
            color: '#e0e0e0',
            fontSize: '1rem',
            fontFamily: '"VT323", monospace',
            borderRadius: '0',
            boxSizing: 'border-box'
          }}
        />
        <button
          className="btn btn-primary"
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          style={{
            padding: '12px 16px',
            fontSize: '1rem',
            width: '70px',
            flexShrink: 0,
            boxSizing: 'border-box'
          }}
        >
          전송
        </button>
      </div>

      <div style={{
        marginTop: '8px',
        fontSize: '0.85rem',
        color: '#888888',
        fontFamily: '"VT323", monospace',
        textAlign: 'center'
      }}>
        친구와 연결 전까지 AI 친구와 대화하세요 😊
      </div>
    </div>
  )
}

export default AIChatSection
