# TRD (Technical Requirements Document)

# Safe Track - 기술 요구사항 문서

## 1. 시스템 아키텍처

### 1.1 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │  Socket.IO   │  │   Leaflet    │      │
│  │   Components │  │    Client    │  │     Map      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │ WebSocket / HTTP
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────────────┐ │
│  │              Express + Socket.IO Server                │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│  │  │Controllers│  │ Services │  │  Models  │            │ │
│  │  └──────────┘  └──────────┘  └──────────┘            │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────────────┐ │
│  │                  PostgreSQL Database                    │ │
│  │         (Users, Sessions, Friends)                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              External APIs                              │ │
│  │  • OpenAI GPT-3.5-turbo                                │ │
│  │  • Overpass API (OpenStreetMap)                        │ │
│  │  • Google Traffic API                                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 기술 스택

#### 프론트엔드

- **프레임워크**: React 18.2.0
- **빌드 도구**: Vite 4.4.5
- **실시간 통신**: Socket.IO Client 4.7.2
- **지도**: Leaflet 1.9.4 + React-Leaflet 4.2.1
- **스타일링**: Vanilla CSS (레트로 테마)
- **상태 관리**: React Hooks (useState, useEffect, useCallback)

#### 백엔드

- **런타임**: Node.js >= 18.0.0
- **프레임워크**: Express 4.18.2
- **실시간 통신**: Socket.IO 4.7.2
- **데이터베이스**: PostgreSQL (pg 8.11.3)
- **인증**: bcrypt 5.1.0
- **AI**: OpenAI 6.6.0
- **환경변수**: dotenv 16.3.1

---

## 2. 데이터베이스 설계

### 2.1 스키마

#### users 테이블

```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### sessions 테이블

```sql
CREATE TABLE sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id),
  socket_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
);
```

#### friends 테이블

```sql
CREATE TABLE friends (
  user_id VARCHAR(50) NOT NULL REFERENCES users(id),
  friend_id VARCHAR(50) NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, friend_id)
);
```

### 2.2 인덱스

```sql
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_friends_user_id ON friends(user_id);
```

---

## 3. API 설계

### 3.1 HTTP REST API

#### GET /ping

- **설명**: 서버 상태 확인
- **응답**:

```json
{
  "status": "alive",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "onlineUsers": 10
}
```

### 3.2 Socket.IO 이벤트

#### 인증 이벤트

**register**

- **방향**: Client → Server
- **데이터**: `{ userId: string, password: string }`
- **응답**: `registerSuccess` | `registerError`

**login**

- **방향**: Client → Server
- **데이터**: `{ userId: string, password: string }`
- **응답**: `loginSuccess` | `loginError`

**validateSession**

- **방향**: Client → Server
- **데이터**: `{ sessionId: string }`
- **응답**: `sessionValid` | `sessionInvalid`

**logout**

- **방향**: Client → Server
- **데이터**: `{ userId: string }`

#### 사용자 이벤트

**checkUserId**

- **방향**: Client → Server
- **데이터**: `{ userId: string }`
- **응답**: `userIdCheckResult`

**searchUsers**

- **방향**: Client → Server
- **데이터**: `{ query: string }`
- **응답**: `searchResults`

**addFriend**

- **방향**: Client → Server
- **데이터**: `{ friendId: string }`
- **응답**: `friendAdded`

**getFriends**

- **방향**: Client → Server
- **응답**: `friendsList`

**removeFriend**

- **방향**: Client → Server
- **데이터**: `{ friendId: string }`
- **응답**: `friendRemoved`

#### 위치 이벤트

**startTracking**

- **방향**: Client → Server
- **데이터**: `{ userId: string }`

**locationUpdate**

- **방향**: Client → Server
- **데이터**: `{ userId: string, lat: number, lng: number }`
- **브로드캐스트**: `locationReceived`

**stopTracking**

- **방향**: Client → Server
- **데이터**: `{ userId: string }`

**requestLocationShare**

- **방향**: Client → Server
- **데이터**: `{ targetUserId: string }`
- **응답**: `shareRequestSent` | `shareRequestError`
- **타겟 알림**: `locationShareRequest`

**respondLocationShare**

- **방향**: Client → Server
- **데이터**: `{ requestId: string, accepted: boolean }`
- **응답**: `locationShareResponse`

**stopLocationShare**

- **방향**: Client → Server
- **데이터**: `{ targetUserId: string }`
- **타겟 알림**: `locationShareStopped`

**stopReceivingShare**

- **방향**: Client → Server
- **데이터**: `{ fromUserId: string }`

**requestCurrentLocation**

- **방향**: Client → Server
- **데이터**: `{ targetUserId: string }`

#### 채팅 이벤트

**sendMessage**

- **방향**: Client → Server
- **데이터**: `{ message: string }`
- **응답**: `messageSent` | `chatError`
- **수신자 알림**: `messageReceived`

**getConnectedUsers**

- **방향**: Client → Server
- **응답**: 연결된 사용자 목록

#### AI 채팅 이벤트

**sendMessageToAI**

- **방향**: Client → Server
- **데이터**: `{ message: string, location?: { lat: number, lng: number } }`
- **응답**: AI 응답 메시지

**clearAIConversation**

- **방향**: Client → Server

**getAIStatus**

- **방향**: Client → Server
- **응답**: AI 상태 정보

---

## 4. 프론트엔드 아키텍처

### 4.1 디렉토리 구조

```
src/
├── components/          # React 컴포넌트
│   ├── AuthForm.jsx
│   ├── ChatSection.jsx
│   ├── AIChatSection.jsx
│   ├── FakeCall.jsx
│   ├── FriendsList.jsx
│   ├── LocationTracking.jsx
│   ├── ProfileSection.jsx
│   ├── RadioPlayer.jsx
│   ├── ReceivedShares.jsx
│   ├── SharedUsers.jsx
│   ├── ShareRequests.jsx
│   ├── UserList.jsx
│   └── UserSearch.jsx
├── hooks/              # 커스텀 훅
│   ├── useAuth.js
│   ├── useChat.js
│   ├── useLocationShare.js
│   ├── useLocationTracking.js
│   ├── useSocket.js
│   └── useVoiceSettings.js
├── services/           # 서비스 레이어
│   ├── audioService.js
│   ├── pushNotification.js
│   └── speechService.js
├── utils/              # 유틸리티
│   └── localStorage.js
├── constants/          # 상수
│   └── app.js
├── App.jsx            # 메인 앱
├── MapView.jsx        # 지도 컴포넌트
├── main.jsx           # 엔트리 포인트
└── index.css          # 글로벌 스타일
```

### 4.2 커스텀 훅 설계

#### useAuth

- **책임**: 사용자 인증 및 세션 관리
- **상태**: userId, password, isRegistered, isLoginMode
- **액션**: handleAuth, handleLogout, handleUserIdChange

#### useLocationTracking

- **책임**: GPS 위치 추적 및 시뮬레이션
- **상태**: isTracking, isSimulating, currentLocation
- **액션**: startTracking, stopTracking, startSimulation

#### useLocationShare

- **책임**: 위치 공유 요청 및 관리
- **상태**: shareRequests, sharedUsers, receivedShares
- **액션**: requestLocationShare, respondToRequest, stopLocationShare

#### useChat

- **책임**: 실시간 채팅 메시지 관리
- **상태**: chatMessages, chatInput
- **액션**: sendMessage, getConnectedUsers

#### useSocket

- **책임**: Socket.IO 연결 및 이벤트 핸들링
- **기능**: 자동 재연결, 세션 복원, 이벤트 리스너 등록

#### useVoiceSettings

- **책임**: TTS 음성 설정 관리
- **상태**: voiceEnabled, selectedVoice, availableVoices
- **액션**: handleVoiceToggle, handleVoiceChange

### 4.3 서비스 레이어

#### speechService

```javascript
{
  speak(text, voice),
    notifyTrackingStarted(),
    notifyTrackingStopped(),
    notifyShareRequest(userName),
    notifyShareAccepted(userName),
    notifyShareRejected(userName),
    notifyLocationShareStopped(userName),
    notifyFriendRequestAccepted(userName);
}
```

#### audioService

```javascript
{
  playMessageNotification(), playRadio(url), stopRadio();
}
```

#### pushNotificationService

```javascript
{
  requestPermission(),
    showLocationShareRequest(userName),
    showLocationShareAccepted(userName),
    showNewMessage(userName, message),
    showFriendAdded(friendId);
}
```

---

## 5. 백엔드 아키텍처

### 5.1 디렉토리 구조

```
src/
├── config/             # 설정
│   ├── database.js
│   └── server.js
├── constants/          # 상수
│   └── app.js
├── controllers/        # 컨트롤러
│   ├── AuthController.js
│   ├── UserController.js
│   ├── LocationController.js
│   ├── ChatController.js
│   └── AIChatController.js
├── services/           # 서비스 레이어
│   ├── AuthService.js
│   ├── UserService.js
│   ├── LocationService.js
│   ├── ChatService.js
│   ├── AIChatService.js
│   └── KeepAliveService.js
├── models/             # 데이터 모델
│   ├── User.js
│   ├── Session.js
│   └── Friend.js
├── middleware/         # 미들웨어
│   └── expressConfig.js
├── socket/             # 소켓 핸들러
│   └── SocketEventHandler.js
├── utils/              # 유틸리티
│   └── database.js
├── app.js             # 앱 클래스
└── index.js           # 엔트리 포인트
```

### 5.2 서비스 레이어 설계

#### UserService

```javascript
{
  onlineUsers: Map<userId, { name, socketId, isTracking }>,
  addOnlineUser(userId, socketId),
  removeOnlineUser(userId),
  getOnlineUser(userId),
  getAllOnlineUsers(),
  setUserTracking(userId, isTracking),
  searchUsers(query),
  getFriends(userId),
  addFriend(userId, friendId),
  removeFriend(userId, friendId)
}
```

#### LocationService

```javascript
{
  locations: Map<userId, { lat, lng, timestamp }>,
  locationHistory: Map<userId, Array<location>>,
  sharePermissions: Map<userId, Set<targetUserId>>,
  shareRequests: Map<requestId, { from, to, status }>,
  updateLocation(userId, lat, lng),
  getLocation(userId),
  getLocationHistory(userId),
  removeLocation(userId),
  createShareRequest(fromUserId, targetUserId),
  acceptShareRequest(requestId),
  rejectShareRequest(requestId),
  stopLocationShare(fromUserId, targetUserId),
  getSharedUsers(userId),
  getAllowedUsers(userId)
}
```

#### ChatService

```javascript
{
  canSendMessage(fromUserId, targetUserId),
    getConnectedUsers(fromUserId),
    createMessage(fromUserId, targetUserId, message),
    createGroupMessage(fromUserId, message);
}
```

#### AIChatService

```javascript
{
  conversations: Map<userId, Array<message>>,
  openai: OpenAI,
  createConversation(userId),
  addMessage(userId, message, isUser),
  getConversation(userId),
  generateResponse(userId, message, location),
  getSimpleResponse(message, location),
  clearConversation(userId),
  isEnabled(),
  getStats()
}
```

### 5.3 컨트롤러 레이어

각 컨트롤러는 Socket.IO 이벤트를 처리하고 서비스 레이어를 호출합니다.

**AuthController**: 회원가입, 로그인, 로그아웃, 세션 검증
**UserController**: 사용자 검색, 친구 관리, 재연결
**LocationController**: 위치 추적, 위치 공유 요청/응답
**ChatController**: 메시지 전송, 연결된 사용자 조회
**AIChatController**: AI 메시지 전송, 대화 초기화

---

## 6. 실시간 통신 설계

### 6.1 Socket.IO 설정

#### 서버

```javascript
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3001", "https://safe-track.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});
```

#### 클라이언트

```javascript
const socket = io(serverUrl, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
});
```

### 6.2 연결 관리

#### 자동 재연결

- 연결 끊김 시 자동 재연결 시도
- 세션 ID로 자동 로그인
- 공유 상태 복원

#### Keep-alive

- 클라이언트: 5분마다 ping 전송
- 서버: 5분마다 자체 ping (Render 무료 플랜 대응)

#### 연결 해제 처리

- 사용자 추적 중지
- 위치 데이터 삭제
- 온라인 사용자 목록에서 제거
- 다른 사용자에게 상태 업데이트 브로드캐스트

---

## 7. 보안 설계

### 7.1 인증 및 세션

#### 비밀번호 해싱

```javascript
const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hashedPassword);
```

#### 세션 생성

```javascript
const sessionId = crypto.randomBytes(32).toString("hex");
// 64자 16진수 문자열
```

#### 세션 만료

- 유효기간: 7일
- 자동 정리: 1시간마다 만료된 세션 삭제

### 7.2 데이터 검증

#### 입력 검증

- userId: 4자 이상, 특수문자 제한
- password: 4자 이상
- 위치 데이터: 위도(-90~90), 경도(-180~180)

#### SQL Injection 방지

```javascript
await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
```

### 7.3 권한 관리

#### 위치 공유 권한

- 양방향 권한 확인
- 공유 수락 시에만 위치 전송
- 공유 중지 시 권한 즉시 제거

#### 채팅 권한

- 위치 공유 중인 사용자와만 채팅 가능
- 메시지 전송 전 권한 확인

---

## 8. 성능 최적화

### 8.1 프론트엔드

#### React 최적화

- useCallback으로 함수 메모이제이션
- useMemo로 계산 결과 캐싱
- 컴포넌트 분리로 불필요한 리렌더링 방지

#### 지도 최적화

- 각 사용자의 최신 위치만 표시
- 응급시설 마커는 지도 이동 시에만 재검색
- 마커 애니메이션 CSS로 처리

#### 로컬 스토리지

- 세션 정보 저장 (자동 로그인)
- 친구 목록 캐싱
- 공유 상태 저장 (재연결 시 복원)

### 8.2 백엔드

#### 메모리 관리

- 위치 히스토리 최대 50개로 제한
- AI 대화 히스토리 최대 10개로 제한
- 만료된 세션 자동 정리

#### 데이터베이스

- 인덱스 활용 (user_id, expires_at)
- 커넥션 풀 사용
- Prepared Statement로 쿼리 최적화

#### 네트워크

- CORS 설정으로 불필요한 요청 차단
- Gzip 압축 (Express 미들웨어)
- 위치 업데이트 배치 처리 (2초 간격)

---

## 9. 배포 아키텍처

### 9.1 프론트엔드 (Vercel)

#### 빌드 설정

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

#### 환경변수

- `VITE_SERVER_URL`: 백엔드 서버 URL

### 9.2 백엔드 (Render)

#### 서비스 설정

- **타입**: Web Service
- **환경**: Node.js
- **빌드 명령**: `npm install`
- **시작 명령**: `node server.js`

#### 환경변수

- `DB_HOST`: PostgreSQL 호스트
- `DB_PORT`: PostgreSQL 포트 (5432)
- `DB_NAME`: 데이터베이스 이름
- `DB_USER`: 데이터베이스 사용자
- `DB_PASSWORD`: 데이터베이스 비밀번호
- `OPENAI_API_KEY`: OpenAI API 키
- `RENDER_EXTERNAL_URL`: Render 서비스 URL

### 9.3 데이터베이스 (Render PostgreSQL)

#### 설정

- **버전**: PostgreSQL 14+
- **백업**: 자동 백업 활성화
- **연결**: SSL 필수

---

## 10. 모니터링 및 로깅

### 10.1 서버 모니터링

#### Health Check

```javascript
GET /ping
{
  "status": "alive",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "onlineUsers": 10
}
```

#### Keep-alive

- 5분마다 자체 ping으로 서버 활성 상태 유지
- Render 무료 플랜 슬립 방지

### 10.2 로깅

#### 서버 로그

- 사용자 연결/해제
- 위치 업데이트
- 위치 공유 요청/응답
- 에러 발생 (스택 트레이스 포함)

#### 클라이언트 로그

- 서버 연결 상태
- Socket.IO 이벤트
- GPS 위치 정보
- 에러 발생

---

## 11. 테스트 전략

### 11.1 단위 테스트

- 서비스 레이어 로직
- 유틸리티 함수
- 데이터 모델

### 11.2 통합 테스트

- Socket.IO 이벤트 흐름
- 데이터베이스 CRUD
- 외부 API 호출

### 11.3 E2E 테스트

- 회원가입/로그인 플로우
- 위치 공유 시나리오
- 채팅 기능

---

## 12. 기술적 제약사항

### 12.1 브라우저 API 제약

- Geolocation API: HTTPS 필수 (배포 환경)
- Web Speech API: 브라우저별 음성 지원 차이
- Push Notification API: 사용자 권한 필요

### 12.2 외부 API 제약

- OpenAI API: 요청 제한 (분당 3,500 토큰)
- Overpass API: 타임아웃 25초
- Google Traffic API: 무료 사용 제한

### 12.3 인프라 제약

- Render 무료 플랜: 15분 비활성 시 슬립
- Vercel 무료 플랜: 빌드 시간 제한
- PostgreSQL: 동시 연결 수 제한

---

## 13. 확장 가능성

### 13.1 수평 확장

- Socket.IO Redis Adapter로 다중 서버 지원
- 로드 밸런서 추가
- 데이터베이스 읽기 복제본

### 13.2 수직 확장

- 서버 인스턴스 스펙 업그레이드
- 데이터베이스 성능 향상
- CDN 추가 (정적 파일)

### 13.3 기능 확장

- 마이크로서비스 분리 (인증, 위치, 채팅)
- 메시지 큐 도입 (RabbitMQ, Kafka)
- 캐싱 레이어 (Redis)

---

**문서 버전**: 1.0
**작성일**: 2025-10-23
**작성자**: Ailink - 전면수
