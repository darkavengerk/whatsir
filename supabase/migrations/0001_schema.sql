-- whatsir: core schema
-- Every domain entity is modelled as a first-class row so it can become a node
-- in the 3d-force-graph view. Relationships that the graph needs to traverse
-- live in dedicated link tables rather than being hidden inside JSON columns.

set search_path = public;

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users. Guests are real auth.users rows too
-- (created via anonymous sign-in + email OTP upgrade when recovering).
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url  text,
  email       citext unique,
  bio         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_touch_updated
before update on public.profiles
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- devices: "가입 1회 이후 자동 인식"의 실체.
-- 서버가 발급하는 long-lived token의 hash만 저장.
-- 쿠키 + localStorage에 원본 토큰이 들어가고, 서버는 hash로 조회/검증한다.
-- ---------------------------------------------------------------------------
create table public.devices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  token_hash   text not null unique,
  label        text,                 -- "iPhone 15", "크롬 브라우저" 등
  user_agent   text,
  last_seen_at timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index devices_user_idx on public.devices(user_id);

-- ---------------------------------------------------------------------------
-- meetings: 상위 컨테이너. terminology로 UI 라벨 커스터마이즈.
-- topic_schema는 나중에 "저자/감독" 같은 커스텀 필드를 등록할 때 대비한 슬롯.
-- MVP(보드게임)에선 비어 있어도 된다.
-- ---------------------------------------------------------------------------
create table public.meetings (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique,
  name          text not null,
  description   text,
  cover_url     text,
  terminology   jsonb not null default '{}'::jsonb,
  topic_schema  jsonb not null default '{}'::jsonb,
  is_public     boolean not null default false,
  created_by    uuid not null references public.profiles(id) on delete restrict,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger meetings_touch_updated
before update on public.meetings
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- meeting_members: 모임 멤버십. role은 RLS 판단 기준.
-- ---------------------------------------------------------------------------
create type public.meeting_role as enum ('owner', 'host', 'member', 'guest');

create table public.meeting_members (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       public.meeting_role not null default 'member',
  nickname   text,             -- 모임 안에서 다르게 부르고 싶을 때
  joined_at  timestamptz not null default now(),
  primary key (meeting_id, user_id)
);

create index meeting_members_user_idx on public.meeting_members(user_id);

-- ---------------------------------------------------------------------------
-- topics: 주제. 보드게임 모임이면 "게임", 독서 모임이면 "책".
-- custom JSONB로 자유로운 메타데이터. 향후 topic_schema와 연동 가능.
-- ---------------------------------------------------------------------------
create table public.topics (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid not null references public.meetings(id) on delete cascade,
  title       text not null,
  description text,
  image_url   text,
  custom      jsonb not null default '{}'::jsonb,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index topics_meeting_idx on public.topics(meeting_id);
create trigger topics_touch_updated
before update on public.topics
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- activities: 모임 회차. check_in_token이 QR에 들어간다.
-- ---------------------------------------------------------------------------
create table public.activities (
  id                         uuid primary key default gen_random_uuid(),
  meeting_id                 uuid not null references public.meetings(id) on delete cascade,
  title                      text,
  description                text,
  starts_at                  timestamptz not null,
  ends_at                    timestamptz,
  location                   text,
  check_in_token             text unique,
  check_in_token_expires_at  timestamptz,
  created_by                 uuid references public.profiles(id) on delete set null,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create index activities_meeting_idx on public.activities(meeting_id);
create index activities_starts_idx on public.activities(starts_at desc);
create trigger activities_touch_updated
before update on public.activities
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- attendances: 누가 그 회차에 왔나. seat_order로 현장 착석 UI.
-- ---------------------------------------------------------------------------
create table public.attendances (
  id            uuid primary key default gen_random_uuid(),
  activity_id   uuid not null references public.activities(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  seat_order    int,
  checked_in_at timestamptz not null default now(),
  left_at       timestamptz,
  unique (activity_id, user_id)
);

create index attendances_activity_idx on public.attendances(activity_id);
create index attendances_user_idx on public.attendances(user_id);

-- ---------------------------------------------------------------------------
-- subtopics: 세부활동. "활동에 종속"이 아니라 독립 노드로 존재하며
-- 여러 활동에 재등장할 수 있다 (예: "Catan - 확장판 세션").
-- ---------------------------------------------------------------------------
create table public.subtopics (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid not null references public.meetings(id) on delete cascade,
  title       text not null,
  description text,
  custom      jsonb not null default '{}'::jsonb,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index subtopics_meeting_idx on public.subtopics(meeting_id);
create trigger subtopics_touch_updated
before update on public.subtopics
for each row execute function public.touch_updated_at();

-- activity ↔ subtopic
create table public.activity_subtopics (
  activity_id uuid not null references public.activities(id) on delete cascade,
  subtopic_id uuid not null references public.subtopics(id) on delete cascade,
  ordering    int,
  notes       text,
  primary key (activity_id, subtopic_id)
);
create index activity_subtopics_subtopic_idx on public.activity_subtopics(subtopic_id);

-- subtopic ↔ topic (세부활동이 어떤 주제를 다뤘나)
create table public.subtopic_topics (
  subtopic_id uuid not null references public.subtopics(id) on delete cascade,
  topic_id    uuid not null references public.topics(id) on delete cascade,
  primary key (subtopic_id, topic_id)
);
create index subtopic_topics_topic_idx on public.subtopic_topics(topic_id);

-- subtopic ↔ user (누가 그 세부활동에 참여했나, role은 자유 텍스트)
create table public.subtopic_participants (
  subtopic_id uuid not null references public.subtopics(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text,     -- "winner", "dealer" 등
  custom      jsonb not null default '{}'::jsonb,
  primary key (subtopic_id, user_id)
);
create index subtopic_participants_user_idx on public.subtopic_participants(user_id);

-- ---------------------------------------------------------------------------
-- photos: Supabase Storage에 업로드 후 path만 저장.
-- activity_id를 필수로 둬서 권한 scope가 명확.
-- ---------------------------------------------------------------------------
create table public.photos (
  id           uuid primary key default gen_random_uuid(),
  activity_id  uuid not null references public.activities(id) on delete cascade,
  subtopic_id  uuid references public.subtopics(id) on delete set null,
  storage_path text not null,
  caption      text,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index photos_activity_idx on public.photos(activity_id);
create index photos_subtopic_idx on public.photos(subtopic_id);

-- ---------------------------------------------------------------------------
-- reviews: 후기. activity 또는 subtopic 둘 중 하나에 달린다.
-- ---------------------------------------------------------------------------
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid references public.activities(id) on delete cascade,
  subtopic_id uuid references public.subtopics(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  rating      int check (rating between 1 and 5),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (activity_id is not null or subtopic_id is not null)
);
create index reviews_activity_idx on public.reviews(activity_id);
create index reviews_subtopic_idx on public.reviews(subtopic_id);
create trigger reviews_touch_updated
before update on public.reviews
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- messages: 활동 단위 채팅. target_user_id가 차 있으면 DM.
-- Supabase Realtime의 'postgres_changes' 채널로 구독한다.
-- ---------------------------------------------------------------------------
create table public.messages (
  id             uuid primary key default gen_random_uuid(),
  activity_id    uuid not null references public.activities(id) on delete cascade,
  author_id      uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete cascade,
  reply_to       uuid references public.messages(id) on delete set null,
  body           text not null,
  created_at     timestamptz not null default now()
);
create index messages_activity_idx on public.messages(activity_id, created_at desc);
create index messages_target_idx on public.messages(target_user_id) where target_user_id is not null;

-- Realtime publication (Supabase convention)
alter publication supabase_realtime add table public.messages;

-- ---------------------------------------------------------------------------
-- Graph views: 3d-force-graph 렌더링용 통합 뷰.
-- 위 정규화된 테이블을 한 곳에 모아 node/edge 형태로 노출한다.
-- 뷰이므로 실제 데이터 중복 없음. RLS는 base table에서 걸리므로 뷰도 안전.
-- ---------------------------------------------------------------------------
create or replace view public.graph_nodes as
  select id, 'profile'::text  as kind, display_name as label, null::uuid as meeting_id from public.profiles
  union all
  select id, 'meeting',   name,         id          from public.meetings
  union all
  select id, 'topic',     title,        meeting_id  from public.topics
  union all
  select id, 'activity',  coalesce(title, to_char(starts_at,'YYYY-MM-DD')), meeting_id from public.activities
  union all
  select id, 'subtopic',  title,        meeting_id  from public.subtopics;

create or replace view public.graph_edges as
  select meeting_id as source, user_id   as target, 'member_of'::text as kind, meeting_id from public.meeting_members
  union all
  select activity_id, user_id, 'attended',         (select meeting_id from public.activities a where a.id = activity_id) from public.attendances
  union all
  select activity_id, subtopic_id, 'has_subtopic', (select meeting_id from public.activities a where a.id = activity_id) from public.activity_subtopics
  union all
  select subtopic_id, topic_id, 'about_topic',     (select meeting_id from public.subtopics s where s.id = subtopic_id) from public.subtopic_topics
  union all
  select subtopic_id, user_id, 'participated',     (select meeting_id from public.subtopics s where s.id = subtopic_id) from public.subtopic_participants;
