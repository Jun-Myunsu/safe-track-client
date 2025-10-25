import { useState, useEffect } from "react";

function StuckUsersPanel() {
  const [stuckUsers, setStuckUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchStuckUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/admin/stuck-users`
      );
      const data = await response.json();
      if (data.success) {
        setStuckUsers(data.data);
        if (data.data.length > 0) {
          setIsOpen(true);
        }
      }
    } catch (error) {
      console.error("정체 사용자 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteStuckUser = async (userId) => {
    if (!confirm(`${userId} 사용자를 목록에서 삭제하시겠습니까?`)) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/admin/stuck-users/${userId}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (data.success) {
        setStuckUsers(stuckUsers.filter((u) => u.user_id !== userId));
      }
    } catch (error) {
      console.error("정체 사용자 삭제 실패:", error);
    }
  };

  useEffect(() => {
    fetchStuckUsers();
  }, []);

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}시간 ${m}분 ${s}초` : m > 0 ? `${m}분 ${s}초` : `${s}초`;
  };

  return (
    <div className="section">
      <div style={{ display: "flex", gap: "8px", marginBottom: isOpen ? "12px" : "0" }}>
        <button
          className="btn"
          onClick={() => setIsOpen(!isOpen)}
          style={{ flex: 1 }}
        >
          ⚠️ 정체 사용자 관리 {isOpen ? "▲" : "▼"}
        </button>
        <button
          className="btn"
          onClick={fetchStuckUsers}
          disabled={loading}
          style={{ 
            minWidth: "50px",
            padding: "10px",
            fontSize: "1.2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title="새로고침"
        >
          {loading ? "⏳" : "🔄"}
        </button>
      </div>

      {isOpen && (
        <>

          {stuckUsers.length === 0 ? (
        <div
          style={{
            padding: "5px",
            textAlign: "center",
            color: "#00ff88",
            backgroundColor: "#1a3a1a",
            border: "1px solid #00ff88",
          }}
        >
          ✅ 정체된 사용자가 없습니다
        </div>
      ) : (
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {stuckUsers.map((user) => (
            <div
              key={user.id}
              className="user-item"
              style={{
                backgroundColor: "#3a1a1a",
                border: "2px solid #ff3333",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <strong style={{ color: "#ff6666" }}>👤 {user.user_id}</strong>
              </div>
              <div style={{ fontSize: "0.85rem", color: "#cccccc" }}>
                <div>
                  📍 위치: {Number(user.latitude).toFixed(6)},{" "}
                  {Number(user.longitude).toFixed(6)}
                </div>
                <div>⏱️ 정체 시간: {formatDuration(user.stuck_duration_seconds)}</div>
                <div>
                  🕐 감지: {new Date(user.first_detected_at).toLocaleString()}
                </div>
                <div>
                  🕐 최종: {new Date(user.last_detected_at).toLocaleString()}
                </div>
              </div>
              <button
                className="btn btn-danger"
                onClick={() => deleteStuckUser(user.user_id)}
                style={{ width: "100%", marginTop: "8px" }}
              >
                🗑️ 삭제
              </button>
            </div>
          ))}
        </div>
          )}
        </>
      )}
    </div>
  );
}

export default StuckUsersPanel;
