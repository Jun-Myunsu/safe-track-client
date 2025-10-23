function SharedUsers({ sharedUsers, stopLocationShare }) {
  if (sharedUsers.length === 0) return null;

  return (
    <div>
      <h4
        style={{
          margin: "0 0 12px 0",
          fontSize: "1.2rem",
          color: "#ffffff",
          fontFamily: '"VT323", monospace',
        }}
      >
        위치 공유 중
      </h4>
      {sharedUsers.map((user) => (
        <div
          key={user.id}
          className="user-item sharing"
          style={{
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <span
            style={{ fontFamily: '"VT323", monospace', fontSize: "1.2rem" }}
          >
            <strong>{user.name}</strong> ({user.id})
          </span>
          <button
            className="btn btn-danger"
            onClick={() => stopLocationShare(user.id)}
            style={{
              width: "100%",
              fontSize: "1.1rem",
              padding: "12px 16px",
              fontFamily: '"VT323", monospace',
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "1px",
              background: "linear-gradient(145deg, #dc3545, #b02a37)",
              border: "3px solid #8b1e2b",
              boxShadow:
                "4px 4px 0px #000000, inset 0px 0px 0px 1px rgba(255,255,255,0.1)",
              transition: "all 0.2s ease",
            }}
          >
            🛑 STOP
          </button>
        </div>
      ))}
    </div>
  );
}

export default SharedUsers;
