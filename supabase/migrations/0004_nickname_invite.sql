-- whatsir: per-meeting nickname + invite/join
--
-- 요약:
-- 1. meetings 테이블에 invite_token 컬럼 추가 (고유 초대 토큰)
-- 2. create_meeting_as_owner 재정의: p_nickname 추가 + invite_token 자동 생성
-- 3. join_meeting_by_invite 함수 신설: 초대 토큰으로 멤버 가입 + 닉네임 저장

set search_path = public;

-- ---------------------------------------------------------------------------
-- meetings.invite_token
-- ---------------------------------------------------------------------------
alter table public.meetings
  add column if not exists invite_token text unique;

-- ---------------------------------------------------------------------------
-- create_meeting_as_owner (p_nickname 추가)
-- 기존 시그니처가 다르므로 먼저 drop.
-- ---------------------------------------------------------------------------
drop function if exists public.create_meeting_as_owner(text, text);

create or replace function public.create_meeting_as_owner(
  p_name text,
  p_description text,
  p_nickname text default null
) returns uuid
language plpgsql
security definer
set search_path = public
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

revoke all on function public.create_meeting_as_owner(text, text, text) from public;
grant execute on function public.create_meeting_as_owner(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- join_meeting_by_invite
-- 초대 토큰으로 모임에 가입 + 모임별 닉네임 저장.
-- 이미 멤버면 nickname만 업데이트(선택).
-- ---------------------------------------------------------------------------
create or replace function public.join_meeting_by_invite(
  p_invite_token text,
  p_nickname text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_meeting uuid;
begin
  if v_user is null then
    raise exception 'unauthenticated';
  end if;

  select id into v_meeting
    from public.meetings
    where invite_token = p_invite_token;

  if v_meeting is null then
    raise exception 'invalid_invite';
  end if;

  insert into public.meeting_members (meeting_id, user_id, role, nickname)
  values (v_meeting, v_user, 'member', nullif(p_nickname, ''))
  on conflict (meeting_id, user_id) do update
    set nickname = coalesce(nullif(excluded.nickname, ''), public.meeting_members.nickname);

  return v_meeting;
end;
$$;

revoke all on function public.join_meeting_by_invite(text, text) from public;
grant execute on function public.join_meeting_by_invite(text, text) to authenticated;
