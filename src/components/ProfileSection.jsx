import { useState } from "react";
import RadioPlayer from "./RadioPlayer";
import FakeCall from "./FakeCall";
import SafetyStats from "./SafetyStats";
import YouTubePlayer from "./YouTubePlayer";
import AdminControl from "./AdminControl";
import { speechService } from "../services/speechService";

/**
 * 프로필 및 로그인 상태를 표시하는 컴포넌트
 */
const ProfileSection = ({
  userId,
  showProfile,
  setShowProfile,
  voiceEnabled,
  selectedVoice,
  availableVoices,
  handleVoiceToggle,
  handleVoiceChange,
  handleLogout,
  socket,
}) => {
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("❌ 모든 필드를 입력하세요");
      return;
    }

    if (newPassword.length < 4) {
      setPasswordMessage("❌ 새 비밀번호는 4자리 이상이어야 합니다");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("❌ 새 비밀번호가 일치하지 않습니다");
      return;
    }

    socket.emit("changePassword", { currentPassword, newPassword });
  };

  if (socket) {
    socket.off("passwordChangeSuccess");
    socket.off("passwordChangeError");

    socket.on("passwordChangeSuccess", () => {
      setPasswordMessage("✅ 비밀번호가 변경되었습니다");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordMessage("");
      }, 2000);
    });

    socket.on("passwordChangeError", ({ message }) => {
      setPasswordMessage(`❌ ${message}`);
    });
  }
  if (!showProfile) {
    return (
      <button className="profile-btn" onClick={() => setShowProfile(true)}>
        👤 {userId}
      </button>
    );
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{ margin: 0, cursor: "pointer" }}
          onClick={() => setShowProfile(false)}
        >
          👤 {userId}
        </h3>
        <div style={{ display: "flex", gap: "8px" }}>
          <AdminControl userId={userId} socket={socket} />
          <YouTubePlayer />
          <SafetyStats />
          <RadioPlayer />
          <FakeCall />
        </div>
      </div>

      <div
        className="status success"
        style={{ cursor: "pointer" }}
        onClick={() => setShowProfile(false)}
      >
        ✅ {userId}로 로그인 중
      </div>

      {/* 음성 알림 설정 */}
      {speechService.isSupported() && (
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
              fontSize: "1.1rem",
              fontFamily: '"VT323", monospace',
              marginBottom: "12px",
            }}
          >
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={handleVoiceToggle}
              style={{
                width: "18px",
                height: "18px",
                cursor: "pointer",
              }}
            />
            <span>🔊 음성 알림</span>
          </label>

          {voiceEnabled && availableVoices.length > 0 && (
            <select
              value={selectedVoice}
              onChange={(e) => handleVoiceChange(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "2px solid #555555",
                background: "#1a1a1a",
                color: "#e0e0e0",
                fontSize: "1rem",
                fontFamily: '"VT323", monospace',
                borderRadius: "0",
                cursor: "pointer",
              }}
            >
              {availableVoices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {showPasswordChange && (
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <h4 style={{ margin: "0 0 12px 0" }}>🔒 비밀번호 변경</h4>
          <input
            type="password"
            placeholder="현재 비밀번호"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "8px",
              border: "2px solid #555555",
              background: "#1a1a1a",
              color: "#e0e0e0",
              fontSize: "1rem",
              fontFamily: '"VT323", monospace',
            }}
          />
          <input
            type="password"
            placeholder="새 비밀번호 (4자리 이상)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "8px",
              border: "2px solid #555555",
              background: "#1a1a1a",
              color: "#e0e0e0",
              fontSize: "1rem",
              fontFamily: '"VT323", monospace',
            }}
          />
          <input
            type="password"
            placeholder="새 비밀번호 확인"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePasswordChange()}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "12px",
              border: "2px solid #555555",
              background: "#1a1a1a",
              color: "#e0e0e0",
              fontSize: "1rem",
              fontFamily: '"VT323", monospace',
            }}
          />
          {passwordMessage && (
            <div className="status" style={{ marginBottom: "12px" }}>
              {passwordMessage}
            </div>
          )}
          <button
            className="btn"
            onClick={handlePasswordChange}
            style={{ width: "100%" }}
          >
            변경하기
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          marginTop: "15px",
          fontFamily: '"VT323", monospace',
        }}
      >
        <button className="btn" onClick={handleLogout} style={{ flex: 1 }}>
          로그아웃
        </button>
        <button
          className="btn"
          onClick={() => {
            setShowPasswordChange(!showPasswordChange);
            setPasswordMessage("");
          }}
          style={{ flex: 1 }}
        >
          {showPasswordChange ? "취소" : "비밀번호 변경"}
        </button>
      </div>
    </>
  );
};

export default ProfileSection;
