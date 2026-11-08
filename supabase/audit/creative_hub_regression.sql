-- Run in SQL Editor. All fixtures and changes are rolled back.
begin;

do $fixture$
declare
  actor uuid;
  unit_id uuid;
  instagram_id uuid := gen_random_uuid();
  youtube_id uuid := gen_random_uuid();
  facebook_id uuid := gen_random_uuid();
  task_id uuid := gen_random_uuid();
  single_id uuid := gen_random_uuid();
begin
  select p.id into actor from public.profiles p
  join public.user_roles ur on ur.user_id = p.id
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions perm on perm.id = rp.permission_id
  where p.is_active and perm.code = 'launch.admin' limit 1;
  if actor is null then raise exception 'Audit requires an active admin fixture identity.'; end if;
  select id into unit_id from public.business_units where is_active order by (code = 'DEMO_CREATIVE') desc, code limit 1;
  if unit_id is null then raise exception 'Audit requires an active business unit.'; end if;
  perform set_config('request.jwt.claim.sub', actor::text, true);

  insert into public.creative_accounts(id,business_unit_id,platform,handle)
  values (instagram_id,unit_id,'instagram','audit-' || instagram_id),
    (youtube_id,unit_id,'youtube','audit-' || youtube_id),
    (facebook_id,unit_id,'facebook','audit-' || facebook_id);
  insert into public.creative_tasks(id,business_unit_id,title,platform,additional_platforms,
    assignee_id,due_on,status,deliverable,acceptance_criteria,completion_note,updated_at)
  values (task_id,unit_id,'[AUDIT ROLLBACK] Multi platform','instagram',array['youtube'],
      actor,current_date,'ready','Konten siap tayang','Sesuai brief','Hasil sudah diperiksa','2020-01-01'),
    (single_id,unit_id,'[AUDIT ROLLBACK] Single platform','instagram','{}',
      actor,current_date,'ready','Konten siap tayang','Sesuai brief','Hasil sudah diperiksa','2020-01-01');
  perform set_config('audit.task_id', task_id::text, true);
  perform set_config('audit.single_id', single_id::text, true);
  perform set_config('audit.instagram', instagram_id::text, true);
  perform set_config('audit.youtube', youtube_id::text, true);
  perform set_config('audit.facebook', facebook_id::text, true);
end;
$fixture$;

set local role authenticated;

do $regression$
declare
  v_task_id uuid := current_setting('audit.task_id')::uuid;
  v_single_id uuid := current_setting('audit.single_id')::uuid;
  version timestamptz;
  next_version timestamptz;
  result_status text;
  expected_message text;
begin
  select updated_at into strict version from public.creative_tasks where id = v_single_id;
  begin
    perform public.record_creative_publication(v_single_id,current_setting('audit.facebook')::uuid,
      'https://example.com/audit-wrong-platform', now() - interval '1 hour', version);
    raise exception 'AUDIT FAILED: single-platform task accepted another platform.';
  exception when raise_exception then
    get stacked diagnostics expected_message = message_text;
    if expected_message <> 'Pilih akun dari salah satu platform tugas.' then raise; end if;
  end;
  if exists (select 1 from public.creative_publications where task_id = v_single_id) then
    raise exception 'AUDIT FAILED: rejected publication persisted.';
  end if;

  select updated_at into strict version from public.creative_tasks where id = v_task_id;
  perform public.record_creative_publication(v_task_id,current_setting('audit.instagram')::uuid,
    'https://example.com/audit-instagram', now() - interval '1 hour', version);
  select status,updated_at into strict result_status,next_version from public.creative_tasks where id = v_task_id;
  if result_status <> 'ready' or next_version = version then
    raise exception 'AUDIT FAILED: partial publication must stay ready and update task version.';
  end if;
  begin
    perform public.record_creative_publication(v_task_id,current_setting('audit.youtube')::uuid,
      'https://example.com/audit-stale', now() - interval '1 hour', version);
    raise exception 'AUDIT FAILED: stale version was accepted.';
  exception when serialization_failure then null;
  end;
  perform public.record_creative_publication(v_task_id,current_setting('audit.youtube')::uuid,
    'https://example.com/audit-youtube', now() - interval '1 hour', next_version);
  select status,updated_at into strict result_status,next_version from public.creative_tasks where id = v_task_id;
  if result_status <> 'done' then raise exception 'AUDIT FAILED: all platforms must complete the task.'; end if;

  update public.creative_tasks set reviewer_id = auth.uid(), approver_id = auth.uid(), status = 'review' where id = v_single_id;
  update public.creative_tasks set status = 'ready' where id = v_single_id;
  update public.creative_tasks set approved_at = now() where id = v_single_id;
  begin
    update public.creative_tasks set brief = 'Changed after approval' where id = v_single_id;
    raise exception 'AUDIT FAILED: approved content changed without reopening.';
  exception when raise_exception then
    get stacked diagnostics expected_message = message_text;
    if expected_message <> 'Kembalikan status ke Dikerjakan sebelum mengubah hasil atau brief yang sudah disetujui.' then raise; end if;
  end;
  update public.creative_tasks set status = 'doing', brief = 'Reopened for revision' where id = v_single_id;
  if exists (select 1 from public.creative_tasks where id = v_single_id and (approved_at is not null or reviewed_at is not null)) then
    raise exception 'AUDIT FAILED: reopened content retained approval.';
  end if;

  perform public.remove_creative_task(v_task_id,next_version);
  if exists (select 1 from public.creative_tasks t where t.id = v_task_id) then
    raise exception 'AUDIT FAILED: removed task is still visible through RLS.';
  end if;
  if (select count(*) from public.creative_publications p where p.task_id = v_task_id) <> 2 then
    raise exception 'AUDIT FAILED: removal lost publication history.';
  end if;
  begin
    perform public.record_creative_publication(v_task_id,current_setting('audit.instagram')::uuid,
      'https://example.com/audit-removed', now() - interval '1 hour', next_version);
    raise exception 'AUDIT FAILED: removed task accepted a publication.';
  exception when serialization_failure then null;
  end;
end;
$regression$;

reset role;
select 'Creative publication, concurrency, RLS, approval invalidation, and retained history checks passed; fixtures will be rolled back.' as result;
rollback;
