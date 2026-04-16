-- whatsir: activity 생성 RPC
--
-- activities insert + check_in_token 자동 발급을 원자적으로 처리.
-- 호출자가 해당 모임의 owner/host여야 한다 (RLS도 같은 제약이 걸려있지만
-- 여기서도 명시적으로 막아 에러 메시지를 명확히 낸다).

set search_path = public;

create or replace function public.create_activity(
  p_meeting_id uuid,
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz default null,
  p_location text default null
) returns uuid
language plpgsql
security definer
set search_path = public
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

revoke all on function public.create_activity(uuid, text, timestamptz, timestamptz, text) from public;
grant execute on function public.create_activity(uuid, text, timestamptz, timestamptz, text) to authenticated;
