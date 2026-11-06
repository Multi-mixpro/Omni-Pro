begin;

alter table public.creative_tasks
  add column additional_platforms text[] not null default '{}',
  add column additional_assignee_ids uuid[] not null default '{}',
  add constraint creative_tasks_additional_platforms_check check (
    array_position(additional_platforms, null) is null
    and additional_platforms <@ array['instagram','tiktok','youtube','facebook','whatsapp','marketplace','website','other']
    and not platform = any(additional_platforms)
    and (platform <> 'internal' or cardinality(additional_platforms) = 0)
  ),
  add constraint creative_tasks_additional_assignees_check check (
    array_position(additional_assignee_ids, null) is null
    and (assignee_id is null or not assignee_id = any(additional_assignee_ids))
  );

create index creative_tasks_additional_platforms_idx on public.creative_tasks using gin (additional_platforms);
create index creative_tasks_additional_assignees_idx on public.creative_tasks using gin (additional_assignee_ids);

create function public.validate_creative_task_additional_choices()
returns trigger language plpgsql security invoker set search_path = '' as $guard$
declare
  existing_ids uuid[] := '{}';
begin
  if tg_op = 'UPDATE' then
    existing_ids := old.additional_assignee_ids;
  end if;
  if cardinality(new.additional_platforms) <> (select count(distinct choice) from unnest(new.additional_platforms) as choices(choice))
    or cardinality(new.additional_assignee_ids) <> (select count(distinct choice) from unnest(new.additional_assignee_ids) as choices(choice)) then
    raise exception 'Platform dan PIC tambahan tidak boleh berulang.';
  end if;
  if exists (
    select 1 from unnest(new.additional_assignee_ids) as choices(id)
    where not (choices.id = any(existing_ids))
      and not exists (select 1 from public.profiles p where p.id = choices.id and p.is_active)
  ) then
    raise exception 'PIC tambahan harus menggunakan profil aktif.';
  end if;
  return new;
end;
$guard$;

create trigger creative_task_additional_choices_guard
before insert or update of additional_platforms, additional_assignee_ids on public.creative_tasks
for each row execute function public.validate_creative_task_additional_choices();

create or replace function public.creative_board(p_unit uuid,p_unassigned boolean,p_campaign uuid,p_standalone boolean,
  p_filters jsonb,p_focus text,p_today date,p_page integer)
returns table(stage text,total bigint,items jsonb)
language sql stable security invoker set search_path = '' as $$
with window_dates as (select date_trunc('week',p_today::timestamp)::date as monday),
scoped as (
  select t.*, row_number() over (partition by t.status order by
    case when p_filters->>'order'='publish_on' then t.publish_on else t.due_on end nulls last,t.id) as position
  from public.creative_tasks t cross join window_dates
  where (case when p_unassigned then t.business_unit_id is null when p_unit is not null then t.business_unit_id=p_unit else true end)
    and (case when p_standalone then t.campaign_id is null when p_campaign is not null then t.campaign_id=p_campaign else true end)
    and (coalesce(p_filters->>'platform','')='' or t.platform=p_filters->>'platform' or (p_filters->>'platform') = any(t.additional_platforms))
    and (coalesce(p_filters->>'status','')='' or t.status=p_filters->>'status')
    and (coalesce(p_filters->>'workstream','')='' or t.workstream=p_filters->>'workstream')
    and (case coalesce(p_filters->>'assignee','') when '' then true when 'unassigned' then t.assignee_id is null and cardinality(t.additional_assignee_ids)=0 else t.assignee_id::text=p_filters->>'assignee' or (p_filters->>'assignee') = any(t.additional_assignee_ids::text[]) end)
    and (case p_focus
      when 'week' then t.status<>'cancelled' and t.due_on>=monday and t.due_on<monday+7
      when 'publish' then t.status<>'cancelled' and t.publish_on>=monday and t.publish_on<monday+7
      when 'today' then t.status not in ('done','cancelled') and t.due_on=p_today
      when 'overdue' then t.status not in ('done','cancelled') and t.due_on<p_today
      when 'blocked' then t.status='blocked'
      when 'review' then t.status='review'
      when 'ready' then t.status='ready'
      when 'unplanned' then t.status not in ('done','cancelled') and ((t.assignee_id is null and cardinality(t.additional_assignee_ids)=0) or t.due_on is null)
      else true end)
), totals as (select status,count(*) as total from scoped group by status),
cards as (
  select s.status,jsonb_agg((to_jsonb(s)-'position') || jsonb_build_object(
    'campaign',case when c.id is not null then jsonb_build_object('name',c.name) end,
    'source_idea',case when i.id is not null then jsonb_build_object('title',i.title,'reference_urls',i.reference_urls) end)
    order by s.position) as items
  from scoped s left join public.creative_campaigns c on c.id=s.campaign_id
  left join public.creative_ideas i on i.id=s.source_idea_id
  where s.position > greatest(p_page,0)::bigint*6 and s.position <= (greatest(p_page,0)::bigint+1)*6
  group by s.status
)
select totals.status,totals.total,coalesce(cards.items,'[]'::jsonb) from totals left join cards on cards.status=totals.status;
$$;

-- Compact operational performance, scoped by workspace RLS and loaded on demand.
create or replace function public.creative_workload_summary(
  p_group text, p_unit uuid, p_unassigned boolean, p_campaign uuid,
  p_standalone boolean, p_today date
)
returns table(subject_id uuid, open_count bigint, review_count bigint, blocked_count bigint,
              overdue_count bigint, week_target bigint, week_done bigint)
language sql stable security invoker set search_path = '' as $workload$
  with boundaries as (select date_trunc('week',p_today::timestamp)::date as monday),
  scoped as (
    select case when p_group='team' then assignment.user_id else t.campaign_id end as subject,
           t.status,t.due_on,b.monday
    from public.creative_tasks t cross join boundaries b
    cross join lateral unnest(case when p_group = 'team' and cardinality(t.additional_assignee_ids) > 0
      then array_remove(array_prepend(t.assignee_id, t.additional_assignee_ids), null)
      else array[t.assignee_id] end) as assignment(user_id)
    where p_group in ('team','campaign')
      and t.status <> 'cancelled'
      and (case when p_unassigned then t.business_unit_id is null
                when p_unit is not null then t.business_unit_id=p_unit else true end)
      and (case when p_standalone then t.campaign_id is null
                when p_campaign is not null then t.campaign_id=p_campaign else true end)
  )
  select subject, count(*) filter(where status<>'done'),
    count(*) filter(where status='review'), count(*) filter(where status='blocked'),
    count(*) filter(where status<>'done' and due_on<p_today),
    count(*) filter(where due_on>=monday and due_on<monday+7),
    count(*) filter(where status='done' and due_on>=monday and due_on<monday+7)
  from scoped
  group by subject;
$workload$;

revoke all on function public.creative_workload_summary(text,uuid,boolean,uuid,boolean,date) from public, anon;
grant execute on function public.creative_workload_summary(text,uuid,boolean,uuid,boolean,date) to authenticated;

commit;
