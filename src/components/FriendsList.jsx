function FriendsList({
  friends,
  onRequestShare,
  sharedUsers,
  receivedShares,
  socket,
  pendingRequests,
}) {
  const isAlreadySharing = (targetUserId) => {
    return (
      sharedUsers.some((user) => user.id === targetUserId) ||
      receivedShares.some((user) => user.id === targetUserId)
    );
  };

  if (friends.length === 0) {
    return (
      <p
        style={{
          fontSize: "1.1rem",
          opacity: 0.6,
          margin: "8px 0",
          fontFamily: '"VT323", monospace',
        }}
      >
        추가된 친구가 없습니다
      </p>
    );
  }

  return (
    <div>
      {friends.map((friend) => {
        const alreadySharing = isAlreadySharing(friend.id);
        return (
          <div
            key={friend.id}
            className={`friend-item ${!friend.isOnline ? "offline" : ""}`}
          >
            <div className="friend-info">
              <span className="friend-name">{friend.name || friend.id}</span>
              <span className="friend-status">
                {friend.isOnline ? (friend.isTracking ? "🟢" : "🟡") : "⚪"}
              </span>
            </div>
            <div className="friend-actions">
              {friend.isOnline && (
                <button
                  className="btn-mini"
                  onClick={() =>
                    !alreadySharing &&
                    !pendingRequests.has(friend.id) &&
                    onRequestShare(friend.id)
                  }
                  disabled={alreadySharing || pendingRequests.has(friend.id)}
                >
                  {alreadySharing
                    ? "공유중"
                    : pendingRequests.has(friend.id)
                    ? "요청중"
                    : "요청"}
                </button>
              )}
              <button
                className="btn-mini btn-remove"
                onClick={() =>
                  socket.emit("removeFriend", { friendId: friend.id })
                }
                disabled={alreadySharing}
              >
                삭제
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default FriendsList;
