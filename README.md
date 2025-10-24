# Safe Track - 위치 공유 앱

실시간 위치 공유 및 안전 관리 웹 애플리케이션

## 설계문서 및 PPT 자료는 ==> docs 폴더에 있음.

## PPT Url : https://safe-track-f1ay2r7.gamma.site/

## 배포 url => https://safe-track-client.vercel.app

## 기술 스택

### 프론트엔드

- **프레임워크**: Vite + React
- **실시간 통신**: Socket.IO Client
- **지도**: Leaflet + React-Leaflet
- **스타일링**: CSS (레트로 테마)
- **음성**: Web Speech API
- **알림**: Push Notification API

### 백엔드

- **서버**: Node.js + Express + Socket.IO
- **데이터베이스**: PostgreSQL
- **AI**: OpenAI GPT-3.5-turbo

## 로컬 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env
# .env 파일에서 VITE_SERVER_URL 수정

# 로컬 서버 테스트용:
# VITE_SERVER_URL=http://localhost:3000
```

### 3. 개발 서버 실행

```bash
npm run dev
# http://localhost:3001에서 실행
```

### 4. 서버 실행 (별도)

```bash
cd safe-track-server
npm install
node server.js
# http://localhost:3000에서 실행
```

## 배포

https://safe-track-client.vercel.app/

### 프론트엔드 (Vercel)

1. GitHub 저장소 연결
2. 환경변수 설정: `VITE_SERVER_URL`
3. 자동 배포

### 백엔드 (Render)

1. PostgreSQL 데이터베이스 생성
2. 환경변수 설정:
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
   - `OPENAI_API_KEY`
3. Node.js 서버 배포

## 라이선스

MIT License

## 주요 기능

### 🔐 사용자 관리

- 회원가입 및 로그인 (세션 기반 인증)
- 자동 로그인 (세션 유지)
- 아이디 중복 체크
- 친구 추가 및 관리

### 📍 위치 추적

- 실시간 GPS 위치 추적
- 가상 이동 시뮬레이션 (광주 시청 → 상무역)
- 다중 지도 타입 (일반/위성/상세/지형)
- 응급시설 표시 (병원/경찰서/파출소)

### 🤝 위치 공유

- 1:1 위치 공유 요청/수락
- 실시간 위치 업데이트
- 공유 중복 방지 (한 번에 한 명만)
- 양방향 위치 공유

### 💬 채팅

- 위치 공유 중인 사용자와 실시간 채팅
- AI 채팅 (연결된 사용자 없을 때)

### 🎵 부가 기능

- 음성 알림 (TTS)
- 라디오 플레이어
- 가짜 통화 (SOS 기능)
- 푸시 알림
- 레트로 UI/UX

## 사용법

### 1. 회원가입/로그인

- ID와 비밀번호 입력 (4자리 이상)
- 엔터 키로 빠른 로그인

### 2. 친구 추가

- 사용자 검색으로 친구 추가
- 친구 목록에서 위치 공유 요청

### 3. 위치 공유

- 실제 위치 추적 또는 가상 이동 시작
- 친구에게 위치 공유 요청
- 상대방 수락 시 실시간 위치 확인

### 4. 채팅 및 안전 기능

- 위치 공유 중 실시간 채팅
- SOS 버튼으로 가짜 통화
- AI 친구와 대화

## 프로젝트 구조

```
safe-track/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── AuthForm.jsx
│   │   ├── ChatSection.jsx
│   │   ├── AIChatSection.jsx
│   │   ├── FakeCall.jsx
│   │   ├── LocationTracking.jsx
│   │   └── ...
│   ├── hooks/              # 커스텀 훅
│   │   ├── useAuth.js
│   │   ├── useChat.js
│   │   ├── useSocket.js
│   │   └── ...
│   ├── services/           # 서비스 레이어
│   │   ├── speechService.js
│   │   ├── audioService.js
│   │   └── pushNotification.js
│   ├── App.jsx            # 메인 앱
│   ├── MapView.jsx        # 지도 컴포넌트
│   └── index.css          # 글로벌 스타일
└── safe-track-server/     # 백엔드 서버
    ├── src/
    │   ├── controllers/
    │   ├── services/
    │   └── models/
    └── server.js
```

## 특징

- ✅ 완전한 반응형 디자인 (모바일/데스크톱)
- ✅ 레트로 스타일 UI
- ✅ 실시간 양방향 통신
- ✅ AI 어시스턴트
- ✅ 세션 기반 자동 로그인
- ✅ 음성 알림 및 TTS
