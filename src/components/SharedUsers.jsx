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
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <span
            style={{ fontFamily: '"VT323", monospace', fontSize: "1.2rem", flex: 1 }}
          >
            <strong>{user.name}</strong> ({user.id})
          </span>
          <button
            className="btn btn-danger"
            onClick={() => stopLocationShare(user.id)}
            style={{
              fontSize: "0.85rem",
              padding: "6px 12px",
              fontFamily: '"VT323", monospace',
              fontWeight: "bold",
              whiteSpace: "nowrap",
              width: "auto",
              minWidth: "0",
            }}
          >
            🛑 중지
          </button>
        </div>
      ))}
    </div>
  );
}

export default SharedUsers;
