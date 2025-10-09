function AuthForm({ 
  isLoginMode, 
  setIsLoginMode, 
  userId, 
  password, 
  setPassword,
  userIdAvailable,
  isCheckingUserId,
  handleUserIdChange,
  handleAuth 
}) {
  return (
    <>
      <h3>{isLoginMode ? '로그인' : '회원가입'}</h3>
      <div className="input-group">
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="ID"
            value={userId}
            onChange={(e) => handleUserIdChange(e.target.value)}
          />
          {!isLoginMode && userId && (
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              {isCheckingUserId ? (
                <span style={{ color: '#666' }}>중복 체크 중...</span>
              ) : userIdAvailable === true ? (
                <span style={{ color: '#28a745' }}>✓ 사용 가능한 아이디입니다</span>
              ) : userIdAvailable === false ? (
                <span style={{ color: '#dc3545' }}>✗ 이미 사용 중인 아이디입니다</span>
              ) : null}
            </div>
          )}
        </div>
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button 
          className="btn btn-primary" 
          onClick={handleAuth}
        >
          {isLoginMode ? '로그인' : '가입'}
        </button>
      </div>
      
      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        {isLoginMode ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
        <button 
          onClick={() => setIsLoginMode(!isLoginMode)}
          style={{ background: 'none', border: 'none', color: '#ffffff', textDecoration: 'underline', cursor: 'pointer', marginLeft: '5px' }}
        >
          {isLoginMode ? '회원가입' : '로그인'}
        </button>
      </p>
    </>
  )
}

export default AuthForm