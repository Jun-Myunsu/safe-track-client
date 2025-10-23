function ReceivedShares({ receivedShares, stopReceivingShare }) {
  if (receivedShares.length === 0) return null;

  return (
    <div className="section">
      <h3>받은 위치 공유</h3>
      {receivedShares.map((user) => (
        <div
          key={user.id}
          className="user-item receiving"
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontFamily: '"VT323", monospace',
              fontSize: "1.2rem",
              flex: 1,
            }}
          >
            <strong>{user.name}</strong> ({user.id})
          </span>
          <button
            className="btn btn-danger"
            onClick={() => stopReceivingShare(user.id)}
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

export default ReceivedShares;
