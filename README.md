# whatsir

오프라인 모임의 사람, 활동, 기록을 이어주는 앱.

- 모바일 우선 UI: 현장에서 출석/사진/후기/채팅
- 데스크톱 보조 UI: 누적된 데이터를 `3d-force-graph`로 탐색
- QR 기반 간편 출석: 가입 1회 이후 기기에서 자동 인식
- 다형적인 모임 유형: 보드게임 / 독서 / 영화 등. 용어(terminology)만 모임 설정으로 커스터마이즈

## Stack

| 역할 | 선택 |
| --- | --- |
| 프레임워크 | Next.js 16 (App Router) + React 19 |
| 스타일 | Tailwind CSS v4 |
| 백엔드/DB | Supabase (Postgres, Auth, Realtime, Storage) |
| 호스팅 | Vercel (Serverless/Edge) |
| 그래프 뷰 | `3d-force-graph` (도입 예정) |

Vercel 제약(WebSocket 불가, 요청 본문 4.5MB 한도)은 다음으로 우회한다:

- 실시간은 **Supabase Realtime**을 클라이언트가 직접 구독
- 사진 업로드는 클라이언트 → **Supabase Storage 직접 업로드**

## Layout

```
src/
  app/
    (auth)/           로그인·가입 (비인증 접근 가능)
    (app)/            인증 필요 영역 — layout.tsx에서 가드
      meetings/       내 모임 목록, 상세, 활동
      profile/        내 프로필
    (public)/         비인증 접근 가능
      check-in/[token]  QR 체크인
    graph/[meetingId] 데스크톱 그래프 탐색
  components/         ui/ (범용) · domain/ (도메인 특화)
  lib/
    supabase/         browser / server / middleware 클라이언트
    auth/device.ts    디바이스 토큰 기반 자동 인식
  types/
    database.ts       Supabase 생성 타입 (placeholder)
    domain.ts         앱 도메인 타입 + terminology resolver
supabase/
  migrations/
    0001_schema.sql   도메인 테이블 + graph_nodes / graph_edges 뷰
    0002_rls.sql      Row Level Security 정책
```

## Data model (요점)

모든 도메인 엔티티는 **1급 행(row)** 이다. 그래야 그래프에서 노드로 떠오를 수 있다.

- `profiles` · `meetings` · `topics` · `activities` · `subtopics` 가 노드
- `meeting_members` · `attendances` · `activity_subtopics` · `subtopic_topics` · `subtopic_participants` 가 엣지
- 세부활동(`subtopics`)은 활동에 종속되지 않고 **독립 엔티티**. 여러 활동이 같은 세부활동을 참조할 수 있다.
- `graph_nodes` / `graph_edges` 뷰가 그래프 UI를 위한 단일 진입점

RLS는 **"같은 모임 멤버이면 읽을 수 있다"** 가 공통 베이스, 쓰기는 `owner/host/member` 역할과 작성자 본인으로 분기. `is_meeting_member()`, `is_meeting_host()` 헬퍼로 중복 제거.

## Auth flows

### 1. 가입 (신규)

1. 이름 + 이메일 입력
2. Supabase `signInWithOtp` 로 일회용 코드 발송
3. OTP 검증 → `auth.users` 생성 + `profiles` insert
4. `registerDevice()` → 해시한 토큰을 `devices`에 저장, raw 토큰을 HttpOnly 쿠키로 설정
5. 이후 이 기기에서는 자동 로그인

### 2. QR 체크인 (기존 회원)

1. 주최자가 `activities.check_in_token` 으로 QR 생성
2. 참여자가 스캔 → `/check-in/[token]`
3. 서버가 **디바이스 쿠키로 user_id 판별** → admin client로 `attendances` upsert
4. 로그인 상태면 활동 페이지로, 아니면 확인 화면

### 3. QR 체크인 (신규)

1. 디바이스 쿠키가 없으면 → `/signup?return_to=/check-in/<token>` 로 유도
2. 가입 후 자동으로 원래 체크인 링크로 돌아옴

### 4. 기기 변경 (복구)

- `/login` 에서 가입 시 썼던 이메일로 OTP 로그인
- 로그인 성공 시 새 디바이스 등록 → 평소엔 다시 OTP 불필요

## 개발 셋업

```bash
# 1. Supabase 프로젝트 생성 (클라우드 또는 로컬)
npx supabase init
npx supabase start                       # 로컬 docker 스택

# 2. 마이그레이션 적용
npx supabase db reset                    # 로컬
# 또는 원격:
npx supabase db push

# 3. 타입 생성
npx supabase gen types typescript --local --schema public > src/types/database.ts

# 4. env 설정
cp .env.example .env.local
# URL / anon key / service role 채우기

# 5. 실행
npm run dev
```

## 배포 (Vercel)

1. Vercel 프로젝트에 이 저장소 연결
2. Env vars 에 `.env.example` 키들 추가 (Production / Preview 모두)
3. Supabase 프로젝트의 Auth Settings 에서 Site URL / Redirect URLs 에 Vercel 도메인 추가

## MVP 로드맵

- [x] 프로젝트 스캐폴드 · 스키마 · RLS 초안
- [ ] 이메일 OTP + 디바이스 토큰 등록 엔드포인트
- [ ] 모임 생성 / 초대 / 가입
- [ ] 활동 생성 + QR 출석
- [ ] 현장 착석자 뷰
- [ ] 세부활동 · 주제 관리 (보드게임)
- [ ] 사진 업로드 + 후기
- [ ] 활동 채팅 (Realtime, 전체)
- [ ] 데스크톱 그래프 뷰 (3d-force-graph)
- [ ] DM / 멘션
