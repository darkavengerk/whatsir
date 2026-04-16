-- whatsir: activity에 주제 추가
--
-- "이 회차에서 X를 했어"를 한 번에 처리. 세부 로직:
-- 1. topic이 없으면 생성, 있으면 재사용 (meeting_id + title 조합으로)
-- 2. 세부활동(subtopic)을 새로 만들어 activity와 topic을 잇는다
--    세부활동은 그래프에서 독립 노드로 기능.
-- 3. 이미 같은 subtopic이 이 activity에 연결돼있으면 중복 생성을 피함
--    (단순화를 위해 일단 매 호출마다 새 subtopic 생성 — 같은 주제를 여러 번
--     하는 케이스가 자연스럽기 때문)
-- 호출자는 모임 멤버여야 한다.

set search_path = public;

create or replace function public.add_topic_to_activity(
  p_activity_id uuid,
  p_topic_title text
) returns uuid  -- 생성된 subtopic id
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_meeting uuid;
  v_topic uuid;
  v_subtopic uuid;
  v_title text := btrim(p_topic_title);
begin
  if v_user is null then
    raise exception 'unauthenticated';
  end if;
  if v_title = '' then
    raise exception 'empty_topic';
  end if;

  select meeting_id into v_meeting
    from public.activities
    where id = p_activity_id;

  if v_meeting is null then
    raise exception 'activity_not_found';
  end if;

  if not exists (
    select 1 from public.meeting_members
    where meeting_id = v_meeting and user_id = v_user
  ) then
    raise exception 'not_member';
  end if;

  select id into v_topic
    from public.topics
    where meeting_id = v_meeting and lower(title) = lower(v_title)
    limit 1;

  if v_topic is null then
    insert into public.topics (meeting_id, title, created_by)
    values (v_meeting, v_title, v_user)
    returning id into v_topic;
  end if;

  insert into public.subtopics (meeting_id, title, created_by)
  values (v_meeting, v_title, v_user)
  returning id into v_subtopic;

  insert into public.activity_subtopics (activity_id, subtopic_id)
  values (p_activity_id, v_subtopic);

  insert into public.subtopic_topics (subtopic_id, topic_id)
  values (v_subtopic, v_topic);

  return v_subtopic;
end;
$$;

revoke all on function public.add_topic_to_activity(uuid, text) from public;
grant execute on function public.add_topic_to_activity(uuid, text) to authenticated;
