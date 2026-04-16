-- whatsir: Row Level Security
--
-- 원칙:
--  - 모든 도메인 테이블은 RLS 활성화 + 기본 deny.
--  - "같은 모임의 멤버이면 읽을 수 있다"가 공통 베이스.
--  - 쓰기는 role(owner/host/member)과 본인 소유 여부로 분기.
--  - is_member()/is_host() 헬퍼로 중복 제거.

set search_path = public;

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER로 RLS 재귀 회피)
-- ---------------------------------------------------------------------------
create or replace function public.is_meeting_member(m uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.meeting_members mm
    where mm.meeting_id = m
      and mm.user_id = auth.uid()
  );
$$;

create or replace function public.is_meeting_host(m uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.meeting_members mm
    where mm.meeting_id = m
      and mm.user_id = auth.uid()
      and mm.role in ('owner', 'host')
  );
$$;

create or replace function public.meeting_of_activity(a uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select meeting_id from public.activities where id = a;
$$;

create or replace function public.meeting_of_subtopic(s uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select meeting_id from public.subtopics where id = s;
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.profiles              enable row level security;
alter table public.devices               enable row level security;
alter table public.meetings              enable row level security;
alter table public.meeting_members       enable row level security;
alter table public.topics                enable row level security;
alter table public.activities            enable row level security;
alter table public.attendances           enable row level security;
alter table public.subtopics             enable row level security;
alter table public.activity_subtopics    enable row level security;
alter table public.subtopic_topics       enable row level security;
alter table public.subtopic_participants enable row level security;
alter table public.photos                enable row level security;
alter table public.reviews               enable row level security;
alter table public.messages              enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
--  - 본인 행 전체 권한
--  - 같은 모임 멤버는 서로의 프로필 읽기 가능
-- ---------------------------------------------------------------------------
create policy profiles_self_all
  on public.profiles
  for all
  using  (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_read_shared_meeting
  on public.profiles
  for select
  using (
    exists (
      select 1
      from public.meeting_members a
      join public.meeting_members b on a.meeting_id = b.meeting_id
      where a.user_id = auth.uid()
        and b.user_id = profiles.id
    )
  );

-- ---------------------------------------------------------------------------
-- devices: 본인 것만
-- ---------------------------------------------------------------------------
create policy devices_self_all
  on public.devices
  for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- meetings
-- ---------------------------------------------------------------------------
create policy meetings_member_read
  on public.meetings
  for select
  using (is_public or public.is_meeting_member(id));

create policy meetings_insert_any_auth
  on public.meetings
  for insert
  with check (created_by = auth.uid());

create policy meetings_host_write
  on public.meetings
  for update
  using (public.is_meeting_host(id))
  with check (public.is_meeting_host(id));

create policy meetings_owner_delete
  on public.meetings
  for delete
  using (
    exists (
      select 1 from public.meeting_members mm
      where mm.meeting_id = meetings.id
        and mm.user_id = auth.uid()
        and mm.role = 'owner'
    )
  );

-- ---------------------------------------------------------------------------
-- meeting_members
-- ---------------------------------------------------------------------------
create policy meeting_members_read
  on public.meeting_members
  for select
  using (public.is_meeting_member(meeting_id));

create policy meeting_members_self_insert
  on public.meeting_members
  for insert
  with check (user_id = auth.uid() or public.is_meeting_host(meeting_id));

create policy meeting_members_host_update
  on public.meeting_members
  for update
  using (public.is_meeting_host(meeting_id))
  with check (public.is_meeting_host(meeting_id));

create policy meeting_members_self_or_host_delete
  on public.meeting_members
  for delete
  using (user_id = auth.uid() or public.is_meeting_host(meeting_id));

-- ---------------------------------------------------------------------------
-- topics / activities / subtopics : 멤버 읽기, host 쓰기(+작성자 본인 수정)
-- ---------------------------------------------------------------------------
create policy topics_member_read       on public.topics      for select using (public.is_meeting_member(meeting_id));
create policy topics_member_insert     on public.topics      for insert with check (public.is_meeting_member(meeting_id) and created_by = auth.uid());
create policy topics_author_update     on public.topics      for update using (created_by = auth.uid() or public.is_meeting_host(meeting_id)) with check (public.is_meeting_member(meeting_id));
create policy topics_host_delete       on public.topics      for delete using (public.is_meeting_host(meeting_id));

create policy activities_member_read   on public.activities  for select using (public.is_meeting_member(meeting_id));
create policy activities_host_insert   on public.activities  for insert with check (public.is_meeting_host(meeting_id));
create policy activities_host_update   on public.activities  for update using (public.is_meeting_host(meeting_id)) with check (public.is_meeting_host(meeting_id));
create policy activities_host_delete   on public.activities  for delete using (public.is_meeting_host(meeting_id));

create policy subtopics_member_read    on public.subtopics   for select using (public.is_meeting_member(meeting_id));
create policy subtopics_member_insert  on public.subtopics   for insert with check (public.is_meeting_member(meeting_id) and created_by = auth.uid());
create policy subtopics_author_update  on public.subtopics   for update using (created_by = auth.uid() or public.is_meeting_host(meeting_id)) with check (public.is_meeting_member(meeting_id));
create policy subtopics_host_delete    on public.subtopics   for delete using (public.is_meeting_host(meeting_id));

-- ---------------------------------------------------------------------------
-- 관계 테이블들: scope가 되는 활동/세부활동의 모임 멤버만 접근
-- ---------------------------------------------------------------------------
create policy attendances_read
  on public.attendances for select
  using (public.is_meeting_member(public.meeting_of_activity(activity_id)));

create policy attendances_self_insert
  on public.attendances for insert
  with check (
    user_id = auth.uid()
    or public.is_meeting_host(public.meeting_of_activity(activity_id))
  );

create policy attendances_self_or_host_update
  on public.attendances for update
  using (
    user_id = auth.uid()
    or public.is_meeting_host(public.meeting_of_activity(activity_id))
  );

create policy attendances_self_or_host_delete
  on public.attendances for delete
  using (
    user_id = auth.uid()
    or public.is_meeting_host(public.meeting_of_activity(activity_id))
  );

create policy activity_subtopics_read
  on public.activity_subtopics for select
  using (public.is_meeting_member(public.meeting_of_activity(activity_id)));

create policy activity_subtopics_write
  on public.activity_subtopics for all
  using (public.is_meeting_member(public.meeting_of_activity(activity_id)))
  with check (public.is_meeting_member(public.meeting_of_activity(activity_id)));

create policy subtopic_topics_read
  on public.subtopic_topics for select
  using (public.is_meeting_member(public.meeting_of_subtopic(subtopic_id)));

create policy subtopic_topics_write
  on public.subtopic_topics for all
  using (public.is_meeting_member(public.meeting_of_subtopic(subtopic_id)))
  with check (public.is_meeting_member(public.meeting_of_subtopic(subtopic_id)));

create policy subtopic_participants_read
  on public.subtopic_participants for select
  using (public.is_meeting_member(public.meeting_of_subtopic(subtopic_id)));

create policy subtopic_participants_self_or_host_write
  on public.subtopic_participants for all
  using (
    user_id = auth.uid()
    or public.is_meeting_host(public.meeting_of_subtopic(subtopic_id))
  )
  with check (
    user_id = auth.uid()
    or public.is_meeting_host(public.meeting_of_subtopic(subtopic_id))
  );

-- ---------------------------------------------------------------------------
-- photos / reviews / messages
-- ---------------------------------------------------------------------------
create policy photos_member_read
  on public.photos for select
  using (public.is_meeting_member(public.meeting_of_activity(activity_id)));

create policy photos_member_insert
  on public.photos for insert
  with check (
    public.is_meeting_member(public.meeting_of_activity(activity_id))
    and uploaded_by = auth.uid()
  );

create policy photos_author_or_host_delete
  on public.photos for delete
  using (
    uploaded_by = auth.uid()
    or public.is_meeting_host(public.meeting_of_activity(activity_id))
  );

create policy reviews_member_read
  on public.reviews for select
  using (
    public.is_meeting_member(coalesce(
      public.meeting_of_activity(activity_id),
      public.meeting_of_subtopic(subtopic_id)
    ))
  );

create policy reviews_author_write
  on public.reviews for all
  using (author_id = auth.uid())
  with check (
    author_id = auth.uid()
    and public.is_meeting_member(coalesce(
      public.meeting_of_activity(activity_id),
      public.meeting_of_subtopic(subtopic_id)
    ))
  );

create policy messages_member_read
  on public.messages for select
  using (
    public.is_meeting_member(public.meeting_of_activity(activity_id))
    and (
      target_user_id is null
      or target_user_id = auth.uid()
      or author_id      = auth.uid()
    )
  );

create policy messages_member_insert
  on public.messages for insert
  with check (
    author_id = auth.uid()
    and public.is_meeting_member(public.meeting_of_activity(activity_id))
  );

create policy messages_author_delete
  on public.messages for delete
  using (author_id = auth.uid());
