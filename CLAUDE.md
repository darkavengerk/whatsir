@AGENTS.md

# whatsir

오프라인 모임의 사람/활동/세부활동을 독립 노드로 기록하여 `3d-force-graph`로 탐색 가능한 앱.

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind CSS v4
- Supabase (Postgres / Auth / Realtime / Storage)
- Vercel (서버리스 배포)

## Development: TDD 필수

**모든 기능은 TDD 사이클로 개발한다.**

### Red → Green → Refactor

1. **Red**: 원하는 동작을 설명하는 테스트를 먼저 작성한다. 실행해서 실패하는 것을 눈으로 확인한다. "함수가 없음" / "import 실패" 같은 컴파일 에러도 Red로 인정.
2. **Green**: 테스트를 통과시키는 **최소한의 코드**만 작성한다. 미래를 위한 추상화·설정 옵션 금지.
3. **Refactor**: 중복·가독성을 정리한다. 테스트가 여전히 통과해야 한다.

### 실무 규칙

- 구현 먼저 짜고 테스트를 나중에 맞추는 행위 금지. 테스트가 항상 선행.
- 테스트는 **퍼블릭 API 레벨**에서. 내부 private 함수·구현 디테일은 테스트하지 않는다.
- 테스트 하나에 하나의 명제. `describe`는 대상(object), `it`는 행동(behavior).
- 테스트가 통과했으면 통과 로그를 확인하고 이동. "지나가겠지" 추측 금지.
- 실패하는 테스트를 그대로 커밋하지 말 것. 커밋 단위 안에서 Red 확인 → Green 도달 → 커밋.

### 테스트 도구

- **Vitest** (단위/통합)
- **React Testing Library** (컴포넌트, 도입 시점에 추가)
- **Playwright** (E2E, 필요 시 추가)
- 파일 위치: 구현 파일 옆 `*.test.ts(x)` — 예: `signup.ts` ↔ `signup.test.ts`

### 실행

```bash
npm test            # watch
npm run test:run    # 1회 실행 (CI 용)
```

## 아키텍처 규칙

- **Server Component 기본**. Client Component는 상호작용 경계에서만.
- Supabase는 `requireClient()` (Server) / `createClient()` (Browser) 경유해서만 사용.
- 보안의 주체는 **RLS**. 애플리케이션 코드가 검사하지 않는다. service role은 필수 flow(QR 체크인, 디바이스 등록)에서만.
- 도메인 로직은 `src/features/<domain>/` 아래 **순수 함수**로 뽑아 테스트 가능하게.
- Server Action은 얇은 어댑터. 비즈니스 로직은 features 모듈에 둔다.
- Edge runtime 안전성: middleware는 `supabase-config-edge.ts` 만 import.
- 추상화는 **세 번째 중복부터**. YAGNI를 기본값으로.

## Supabase

- 설정 우선순위: env vars → `.whatsir/supabase.json` (gitignored, dev only)
- `/settings` UI로 부트스트랩 가능 (개발/self-host). Vercel 프로덕션은 env vars 필수.
- 스키마 변경: `supabase/migrations/NNNN_name.sql` 새 파일로 추가. 기존 파일은 이미 적용됐으면 수정 금지.
- RLS 정책은 스키마 DDL과 별도 파일로 분리.
- 타입 재생성: `npx supabase gen types typescript --project-id <id> --schema public > src/types/database.ts`

## 언어

- 코드/주석/커밋 메시지: 한국어 OK
- 사용자 향 UI 문구: 한국어, 친근한 반말 톤
- 식별자(변수/함수/파일명): 영어
