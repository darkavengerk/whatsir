-- whatsir: SECURITY DEFINER 함수들의 search_path에 `extensions` 추가
--
-- 배경:
--   Supabase는 pgcrypto를 `extensions` 스키마에 설치한다.
--   기존 RPC들이 `set search_path = public` 만 지정해서 `gen_random_bytes` 를
--   찾지 못해 "function gen_random_bytes(integer) does not exist" 에러가 발생.
--
-- 해결:
--   create_meeting_as_owner / create_activity 를 CREATE OR REPLACE로 재정의하며
--   search_path = public, extensions 로 확장. 함수 본문은 동일하고 속성만 수정.
--
-- 시그니처는 기존 0004, 0005와 동일하므로 DROP 없이 REPLACE로 커버된다.

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- create_meeting_as_owner
-- ---------------------------------------------------------------------------
create or replace function public.create_meeting_as_owner(
  p_name text,
  p_description text,
  p_nickname text default null
) returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user uuid := auth.uid();
  v_meeting uuid;
  v_token text;
begin
  if v_user is null then
    raise exception 'unauthenticated';
  end if;

  v_token := encode(gen_random_bytes(16), 'hex');

  insert into public.meetings (name, description, invite_token, created_by)
  values (p_name, nullif(p_description, ''), v_token, v_user)
  returning id into v_meeting;

  insert into public.meeting_members (meeting_id, user_id, role, nickname)
  values (v_meeting, v_user, 'owner', nullif(p_nickname, ''));

  return v_meeting;
end;
$$;

-- ---------------------------------------------------------------------------
-- create_activity
-- ---------------------------------------------------------------------------
create or replace function public.create_activity(
  p_meeting_id uuid,
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz default null,
  p_location text default null
) returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user uuid := auth.uid();
  v_activity uuid;
  v_token text;
  v_expires timestamptz;
begin
  if v_user is null then
    raise exception 'unauthenticated';
  end if;

  if not exists (
    select 1 from public.meeting_members
    where meeting_id = p_meeting_id
      and user_id = v_user
      and role in ('owner', 'host')
  ) then
    raise exception 'not_host';
  end if;

  v_token := encode(gen_random_bytes(16), 'hex');
  v_expires := coalesce(p_ends_at, p_starts_at + interval '12 hours');

  insert into public.activities (
    meeting_id,
    title,
    starts_at,
    ends_at,
    location,
    check_in_token,
    check_in_token_expires_at,
    created_by
  ) values (
    p_meeting_id,
    nullif(p_title, ''),
    p_starts_at,
    p_ends_at,
    nullif(p_location, ''),
    v_token,
    v_expires,
    v_user
  ) returning id into v_activity;

  return v_activity;
end;
$$;
