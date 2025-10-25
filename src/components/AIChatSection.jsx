import { useState, useRef, useEffect } from "react";
import { speechService } from "../services/speechService";

/**
 * AI 채팅 섹션 컴포넌트
 * 사용자와 AI 간의 대화를 표시하고 관리
 */
const AIChatSection = ({ socket, userId, currentLocation }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem("ai_voice_enabled");
    return saved === "true";
  });
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 음성 인식 초기화
  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "ko-KR";

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // AI 응답 이벤트 리스너
  useEffect(() => {
    if (!socket) return;

    const handleAIMessage = (data) => {
      setMessages((prev) => [
        ...prev,
        {
          from: "AI",
          message: data.message,
          timestamp: data.timestamp,
          isAI: true,
        },
      ]);
      setIsLoading(false);

      // AI 응답 음성 출력 (AI 채팅 음성 설정이 ON일 때만)
      if (voiceEnabled && "speechSynthesis" in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(data.message);

        // speechService에서 선택된 음성 사용
        if (speechService.selectedVoice) {
          utterance.voice = speechService.selectedVoice;
          utterance.lang = speechService.selectedVoice.lang;
        } else {
          utterance.lang = "ko-KR";
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        speechSynthesis.speak(utterance);
      }
    };

    const handleAIError = (error) => {
      console.error("AI 오류:", error);
      setMessages((prev) => [
        ...prev,
        {
          from: "AI",
          message: "죄송합니다. 오류가 발생했습니다.",
          timestamp: new Date().toISOString(),
          isAI: true,
          isError: true,
        },
      ]);
      setIsLoading(false);
    };

    socket.on("aiMessage", handleAIMessage);
    socket.on("error", handleAIError);

    return () => {
      socket.off("aiMessage", handleAIMessage);
      socket.off("error", handleAIError);
    };
  }, [socket, voiceEnabled]);

  // 메시지 전송
  const sendMessage = () => {
    if (!input.trim() || !socket || isLoading) return;

    const userMessage = {
      from: userId,
      message: input.trim(),
      timestamp: new Date().toISOString(),
      isAI: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    socket.emit("sendMessageToAI", {
      message: input.trim(),
      location: currentLocation,
    });
    setInput("");
  };

  // Enter 키로 전송
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 대화 초기화
  const clearConversation = () => {
    if (!socket) return;

    socket.emit("clearAIConversation");
    setMessages([]);
  };

  // 음성 입력 시작/중지
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("음성 인식이 지원되지 않는 브라우저입니다");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // AI 음성 출력 토글
  const toggleVoice = () => {
    const newValue = !voiceEnabled;
    setVoiceEnabled(newValue);
    localStorage.setItem("ai_voice_enabled", newValue.toString());

    if (newValue && "speechSynthesis" in window) {
      const testUtterance = new SpeechSynthesisUtterance(
        "AI 음성이 활성화되었습니다"
      );
      if (speechService.selectedVoice) {
        testUtterance.voice = speechService.selectedVoice;
        testUtterance.lang = speechService.selectedVoice.lang;
      } else {
        testUtterance.lang = "ko-KR";
      }
      speechSynthesis.speak(testUtterance);
    }
  };

  return (
    <div className="section" style={{ marginTop: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h3 style={{ margin: 0, fontFamily: '"VT323", monospace' }}>
          🤖 AI 채팅
        </h3>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn"
            onClick={toggleVoice}
            style={{
              width: "auto",
              minWidth: "auto",
              padding: "8px 16px",
              background: voiceEnabled ? "#3a3a3a" : "#1a1a1a",
              opacity: voiceEnabled ? 1 : 0.5,
            }}
            title={voiceEnabled ? "음성 출력 ON" : "음성 출력 OFF"}
          >
            {voiceEnabled ? "🔊" : "🔇"}
          </button>
          {messages.length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={clearConversation}
              style={{
                width: "auto",
                minWidth: "auto",
                padding: "8px 16px",
              }}
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 채팅 메시지 목록 */}
      <div
        className="ai-chat-messages-container"
        style={{
          overflowY: "auto",
          border: "2px solid #555555",
          background: "#1a1a1a",
          padding: "12px",
          marginBottom: "12px",
          borderRadius: "0",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#888888",
              padding: "20px",
              fontFamily: '"VT323", monospace',
              fontSize: "1.1rem",
            }}
          >
            AI 친구와 자유롭게 대화해보세요! 💬
            <br />
            <span style={{ fontSize: "0.9rem", color: "#666666" }}>
              일상, 고민, 궁금한 것... 무엇이든 이야기하세요!
            </span>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              style={{
                marginBottom: "12px",
                padding: "10px",
                background: msg.isAI ? "#2a2a2a" : "#1f3a2a",
                border: `1px solid ${msg.isAI ? "#555555" : "#3a5a4a"}`,
                borderRadius: "0",
                borderLeft: `4px solid ${msg.isAI ? "#888888" : "#00ff88"}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <strong
                  style={{
                    color: msg.isAI ? "#cccccc" : "#00ff88",
                    fontFamily: '"VT323", monospace',
                    fontSize: "1.1rem",
                  }}
                >
                  {msg.isAI ? "🤖 AI Assistant" : `👤 ${msg.from}`}
                </strong>
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "#888888",
                    fontFamily: '"VT323", monospace',
                  }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div
                style={{
                  color: "#e0e0e0",
                  fontSize: "1rem",
                  fontFamily: '"VT323", monospace',
                  lineHeight: "1.5",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {msg.message}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div
            style={{
              padding: "10px",
              background: "#2a2a2a",
              border: "1px solid #555555",
              borderLeft: "4px solid #888888",
              color: "#888888",
              fontFamily: '"VT323", monospace',
              fontSize: "1.1rem",
            }}
          >
            🤖 AI가 생각 중...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 입력 */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          width: "100%",
          alignItems: "stretch",
        }}
      >
        <div style={{ position: "relative", flex: 1 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="AI에게 메시지 보내기..."
            disabled={isLoading}
            style={{
              width: "100%",
              height: "100%",
              padding: "12px 45px 12px 12px",
              border: "2px solid #555555",
              background: "#1a1a1a",
              color: "#e0e0e0",
              fontSize: "1rem",
              fontFamily: '"VT323", monospace',
              borderRadius: "0",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={toggleVoiceInput}
            disabled={isLoading}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              background: isListening ? "#ff4444" : "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.2rem",
              padding: "6px",
              borderRadius: "50%",
              color: isListening ? "#ffffff" : "#888888",
              transition: "all 0.2s",
              animation: isListening ? "pulse 1s infinite" : "none",
              boxShadow: isListening ? "0 0 10px #ff4444" : "none",
            }}
            title="음성 입력"
          >
            🎤
          </button>
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: translateY(-50%) scale(1); }
              50% { transform: translateY(-50%) scale(1.1); }
            }
          `}</style>
        </div>
        <button
          className="btn btn-primary"
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          style={{
            padding: "12px 16px",
            fontSize: "1rem",
            width: "70px",
            flexShrink: 0,
            boxSizing: "border-box",
          }}
        >
          전송
        </button>
      </div>

      <div
        style={{
          marginTop: "8px",
          fontSize: "0.85rem",
          color: "#888888",
          fontFamily: '"VT323", monospace',
          textAlign: "center",
        }}
      >
        친구와 연결 전까지 AI 친구와 대화하세요 😊
      </div>
    </div>
  );
};

export default AIChatSection;
