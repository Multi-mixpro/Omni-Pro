-- Read-only checks. Run after the latest migrations. No row contents are returned.
select name, present from (values
  ('discussion_table', to_regclass('public.creative_campaign_comments') is not null),
  ('unit_summary_rpc', to_regprocedure('public.creative_unit_execution(uuid,boolean,date,uuid,boolean)') is not null),
  ('business_overview_rpc', to_regprocedure('public.business_execution_overview(date)') is not null),
  ('approval_guard', to_regprocedure('public.guard_launch_approval_decision()') is not null),
  ('inline_media_guard', to_regprocedure('public.guard_paten_inline_media()') is not null)
) as checks(name, present);

select relname as table_name, relrowsecurity as rls_enabled
from pg_class join pg_namespace on pg_namespace.oid = relnamespace
where nspname = 'public' and relname in
  ('launch_comments','creative_campaign_comments','creative_tasks','creative_campaigns','creative_ideas','paten_records')
order by relname;

-- Expected: no rows. Browser updates now use explicit refresh.
select tablename from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public'
  and tablename in ('launch_comments','creative_campaign_comments','creative_tasks','creative_campaigns','creative_ideas','paten_records');

-- Expected: zero for both. Existing unassigned campaigns are not mismatches.
select 'task_campaign_unit_mismatch' as check_name, count(*) as issues
from public.creative_tasks t join public.creative_campaigns c on c.id = t.campaign_id
where t.business_unit_id is distinct from c.business_unit_id
union all
select 'approval_status_mismatch', count(*)
from public.paten_records r join public.launch_approvals a on r.record_id = a.id::text
where r.record_type = 'approval' and not r.is_deleted and a.status is distinct from
  case r.payload->>'status'
    when 'Approved' then 'APPROVED' when 'Rejected' then 'REJECTED'
    when 'Revision Requested' then 'REVISION' when 'Pending' then 'PENDING'
    else null end;
