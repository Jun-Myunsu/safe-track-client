# Safe Track Client - 밤길 안전 위치 공유

실시간 위치 공유 클라이언트 - React + Vite

## 기술 스택
- **프론트엔드**: Vite + React + Socket.IO Client
- **지도**: Leaflet + React-Leaflet
- **스타일링**: CSS

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

# 배포된 서버 사용용:
# VITE_SERVER_URL=https://safe-track-server.onrender.com
```

### 3. 개발 서버 실행
```bash
npm run dev
# http://localhost:3001에서 실행
```

## Vercel 배포

### 1. GitHub에 코드 업로드
```bash
git init
git add .
git commit -m "Initial client setup"
git remote add origin [YOUR_GITHUB_REPO]
git push -u origin main
```

### 2. Vercel 설정
1. Vercel.com에서 "New Project" 생성
2. GitHub 저장소 연결
3. 환경변수 설정:
   - `VITE_SERVER_URL`: 배포된 서버 URL
4. 자동 배포 시작

## 주요 기능
- 사용자 등록 및 로그인
- 실시간 위치 추적 (GPS)
- 가상 이동 시뮬레이션
- 위치 공유 요청/수락
- 실시간 채팅
- 지도 기반 위치 표시

## 사용법
1. 사용자 ID와 비밀번호로 등록/로그인
2. "실제 위치 추적" 또는 "가상 이동 테스트" 시작
3. 다른 사용자에게 위치 공유 요청
4. 실시간으로 위치 확인 및 채팅