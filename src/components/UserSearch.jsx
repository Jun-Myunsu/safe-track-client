import { useState, useEffect } from 'react'

function UserSearch({ socket, userId, friends, setStatus }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = () => {
    if (!searchQuery.trim() || !socket) return
    
    setIsSearching(true)
    socket.emit('searchUsers', { query: searchQuery.trim() })
  }

  const addFriend = (targetUserId) => {
    if (!socket) return
    socket.emit('addFriend', { targetUserId })
    setSearchResults(prev => prev.filter(user => user.id !== targetUserId))
  }

  useEffect(() => {
    if (!socket) return

    const handleSearchResults = (data) => {
      setSearchResults(data.users.filter(user => 
        user.id !== userId && !friends.some(friend => friend.id === user.id)
      ))
      setIsSearching(false)
    }

    const handleFriendAdded = (data) => {
      setStatus(`✅ ${data.friendId}를 친구로 추가했습니다`)
      setTimeout(() => setStatus(''), 3000)
    }

    socket.on('searchResults', handleSearchResults)
    socket.on('friendAdded', handleFriendAdded)

    return () => {
      socket.off('searchResults', handleSearchResults)
      socket.off('friendAdded', handleFriendAdded)
    }
  }, [socket, userId, friends, setStatus])

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="사용자 ID 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="input-group"
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '2px solid #555555',
            borderRadius: '0',
            fontSize: '1.2rem',
            background: '#1a1a1a',
            color: '#e0e0e0',
            fontFamily: '"VT323", monospace'
          }}
        />
        <button
          className="btn"
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          style={{ fontSize: '1.1rem', padding: '8px 12px' }}
        >
          {isSearching ? '검색중...' : '검색'}
        </button>
      </div>
      
      {searchResults.length > 0 && (
        <div>
          {searchResults.map(user => (
            <div key={user.id} className="user-item" style={{ padding: '10px', margin: '0 0 6px 0' }}>
              <span style={{ fontSize: '1.2rem', fontFamily: '"VT323", monospace' }}>{user.id}</span>
              <button
                className="btn btn-secondary"
                onClick={() => addFriend(user.id)}
                style={{ fontSize: '1.1rem', padding: '4px 8px' }}
              >
                추가
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserSearch