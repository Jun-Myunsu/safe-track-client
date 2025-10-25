import { useRef, useEffect } from "react";

function ChatSection({
  chatMessages,
  chatInput,
  setChatInput,
  sendMessage,
  isRegistered,
  getConnectedUsers,
}) {
  const chatMessagesRef = useRef(null);

  // 사용자별 이모지를 저장하는 객체
  const userEmojis = useRef({});

  // 랜덤 이모지 배열
  const emojiList = [
    "🎮",
    "👾",
    "🤖",
    "👽",
    "🚀",
    "⭐",
    "💎",
    "🔥",
    "⚡",
    "💫",
    "🌟",
    "✨",
    "🎯",
    "🎲",
    "🎪",
    "🎨",
    "🎭",
    "🎸",
    "🎹",
    "🎺",
  ];

  // 사용자에게 이모지 할당
  const getUserEmoji = (username) => {
    if (!userEmojis.current[username]) {
      userEmojis.current[username] =
        emojiList[Math.floor(Math.random() * emojiList.length)];
    }
    return userEmojis.current[username];
  };

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div
      className="chat-section"
      style={{
        marginTop: "15px",
        borderRadius: "0",
        backgroundColor: "#1e1e1e",
        border: "3px solid #3d3d3d",
        overflow: "hidden",
        fontFamily: '"VT323", monospace',
      }}
    >
      <div
        ref={chatMessagesRef}
        className="chat-messages chat-messages-container"
        style={{
          padding: "15px",
          overflowY: "auto",
          backgroundColor: "#252526",
          fontFamily: '"VT323", monospace',
          fontSize: "1.1rem",
          lineHeight: "1.4",
        }}
      >
        {chatMessages.length === 0 ? (
          <div
            style={{
              color: "#6a9955",
              fontSize: "1.1rem",
              fontFamily: '"VT323", monospace',
            }}
          >
            // 연결된 사용자와 채팅하세요
          </div>
        ) : (
          chatMessages.map((msg, index) => (
            <div
              key={index}
              style={{
                marginBottom: "6px",
                fontFamily: '"VT323", monospace',
                display: "flex",
                flexDirection: "column",
                alignItems: msg.type === "sent" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  justifyContent:
                    msg.type === "sent" ? "flex-end" : "flex-start",
                }}
              >
                {msg.type === "received" && (
                  <div
                    style={{
                      color: "#4ec9b0",
                      fontSize: "1.05rem",
                      fontFamily: '"VT323", monospace',
                      textAlign: "left",
                    }}
                  >
                    {">"} {getUserEmoji(msg.from)} {msg.from}:
                  </div>
                )}
                {msg.type === "sent" && (
                  <div
                    style={{
                      color: "#dcdcaa",
                      fontSize: "1.05rem",
                      fontFamily: '"VT323", monospace',
                      textAlign: "right",
                    }}
                  >
                    YOU 🎯: {"<"}
                  </div>
                )}
                <div
                  style={{
                    color: "#6a9955",
                    fontSize: "0.85rem",
                    fontFamily: '"VT323", monospace',
                    opacity: 0.6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </div>
              <div
                style={{
                  color: msg.type === "sent" ? "#dcdcaa" : "#ce9178",
                  fontSize: "1.05rem",
                  paddingLeft: msg.type === "received" ? "15px" : "0",
                  paddingRight: msg.type === "sent" ? "15px" : "0",
                  fontFamily: '"VT323", monospace',
                }}
              >
                {msg.message}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 입력 영역 */}
      <div
        style={{
          padding: "0",
          backgroundColor: "#252526",
          borderTop: "2px solid #3d3d3d",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            padding: "10px 12px",
            color: "#569cd6",
            fontSize: "1.1rem",
            fontFamily: '"VT323", monospace',
            borderRight: "2px solid #3d3d3d",
          }}
        >
          {"> "}
        </div>
        <input
          type="text"
          placeholder="type message here..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          disabled={!isRegistered || getConnectedUsers().length === 0}
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "none",
            fontSize: "1.1rem",
            outline: "none",
            backgroundColor: "#1e1e1e",
            color: "#d4d4d4",
            fontFamily: '"VT323", monospace',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={
            !chatInput.trim() ||
            !isRegistered ||
            getConnectedUsers().length === 0
          }
          style={{
            padding: "10px 20px",
            backgroundColor: "#1e1e1e",
            color:
              chatInput.trim() && isRegistered && getConnectedUsers().length > 0
                ? "#00ff00"
                : "#666666",
            border: "2px solid",
            borderColor:
              chatInput.trim() && isRegistered && getConnectedUsers().length > 0
                ? "#00ff00"
                : "#3d3d3d",
            borderLeft: "2px solid #3d3d3d",
            fontSize: "1.05rem",
            cursor:
              chatInput.trim() && isRegistered && getConnectedUsers().length > 0
                ? "pointer"
                : "not-allowed",
            transition: "all 0.2s",
            fontFamily: '"VT323", monospace',
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          [SEND]
        </button>
      </div>
    </div>
  );
}

export default ChatSection;
