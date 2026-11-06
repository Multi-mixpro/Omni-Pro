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
    select case when p_group='team' then t.assignee_id else t.campaign_id end as subject,
           t.status,t.due_on,b.monday
    from public.creative_tasks t cross join boundaries b
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
