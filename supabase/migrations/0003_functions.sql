-- whatsir: RPC functions
--
-- 클라이언트가 "한 번에" 실행해야 원자성이 필요한 조합들을 DB function으로 제공한다.

set search_path = public;

-- ---------------------------------------------------------------------------
-- create_meeting_as_owner
-- 모임 생성자가 곧 owner가 되도록 meetings insert + meeting_members insert를
-- 한 트랜잭션에서 수행한다.
-- 반환: 생성된 meeting id
-- ---------------------------------------------------------------------------
create or replace function public.create_meeting_as_owner(
  p_name text,
  p_description text
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

  insert into public.meetings (name, description, created_by)
  values (p_name, nullif(p_description, ''), v_user)
  returning id into v_meeting;

  insert into public.meeting_members (meeting_id, user_id, role)
  values (v_meeting, v_user, 'owner');

  return v_meeting;
end;
$$;

revoke all on function public.create_meeting_as_owner(text, text) from public;
grant execute on function public.create_meeting_as_owner(text, text) to authenticated;
