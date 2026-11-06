-- Separate Creative Dashboard from Launching Article without reassigning existing users.
begin;

insert into public.permissions(code,module,name) values
  ('creative.view','creative','Melihat Creative Dashboard'),
  ('creative.edit','creative','Mengelola tugas, akun, dan kampanye kreatif')
on conflict (code) do nothing;

insert into public.roles(code,name,description) values
  ('creative_viewer','Creative · Lihat saja','Hanya membuka dan membaca Creative Dashboard.'),
  ('creative_operator','Creative · Operator','Hanya membuka dan mengelola Creative Dashboard.'),
  ('workspace_operator','Launching & Creative · Operator','Mengelola kedua workspace tanpa hak admin atau approval akhir.')
on conflict (code) do nothing;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where (r.code='creative_viewer' and p.code='creative.view')
   or (r.code in ('owner','creative_operator','workspace_operator') and p.code in ('creative.view','creative.edit'))
   or (r.code='workspace_operator' and p.code in (
     'launch.view','launch.create','launch.edit','launch.research.manage','launch.sourcing.manage',
     'launch.sample.manage','launch.hpp.manage','launch.spec.manage','launch.qc.manage','launch.media.manage'
   ))
on conflict do nothing;

-- Keep the existing policies (including private nudges), changing only the two permission predicates.
do $workspace_creative$
declare p record; statement text;
begin
  for p in
    select * from pg_policies where schemaname='public' and tablename in (
      'creative_campaigns','creative_tasks','creative_ideas','creative_campaign_comments',
      'creative_channel_activations','creative_accounts','creative_account_snapshots',
      'creative_publications','creative_publication_snapshots','creative_task_events'
    )
  loop
    if coalesce(p.qual,'') !~ 'launch\.(view|edit)' and coalesce(p.with_check,'') !~ 'launch\.(view|edit)' then
      continue;
    end if;
    statement := format('alter policy %I on public.%I',p.policyname,p.tablename);
    if p.qual is not null then
      statement := statement || ' using (' || replace(replace(p.qual,'launch.view','creative.view'),'launch.edit','creative.edit') || ')';
    end if;
    if p.with_check is not null then
      statement := statement || ' with check (' || replace(replace(p.with_check,'launch.view','creative.view'),'launch.edit','creative.edit') || ')';
    end if;
    execute statement;
  end loop;
end;
$workspace_creative$;

-- An authenticated account must have the workspace permission even when older
-- table policies allow a project member to read or write the row.
do $workspace_launch$
declare t record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind in ('r','p')
      and (left(c.relname,7)='launch_' or c.relname in ('paten_records','media_assets','suppliers','materials','material_suppliers','cost_components','audit_logs'))
  loop
    execute format('alter table public.%I enable row level security',t.relname);
    execute format('drop policy if exists workspace_launch_boundary on public.%I',t.relname);
    execute format(
      'create policy workspace_launch_boundary on public.%I as restrictive for all to authenticated using
       ((select public.is_active_user()) and ((select public.has_permission(''launch.view'')) or (select public.has_permission(''launch.admin''))))
       with check ((select public.is_active_user()) and ((select public.has_permission(''launch.view'')) or (select public.has_permission(''launch.admin''))))',t.relname);
  end loop;
end;
$workspace_launch$;

-- These internal helpers bypass RLS and are called by the authorized launch commands.
do $workspace_helpers$
begin
  if to_regprocedure('public.validate_launch_gate(uuid,text)') is not null then
    revoke execute on function public.validate_launch_gate(uuid,text) from public, anon, authenticated;
  end if;
  if to_regprocedure('public.recalculate_launch_progress(uuid)') is not null then
    revoke execute on function public.recalculate_launch_progress(uuid) from public, anon, authenticated;
  end if;
end;
$workspace_helpers$;

create or replace function public.record_creative_publication(p_task uuid, p_account uuid, p_url text, p_published_at timestamptz, p_version timestamptz)
returns uuid language plpgsql security definer set search_path = '' as $$
declare t public.creative_tasks%rowtype; a public.creative_accounts%rowtype; publication uuid;
begin
  if not (public.is_active_user() and (public.has_permission('creative.edit') or public.has_permission('launch.admin'))) then
    raise exception 'Tidak memiliki izin mencatat publikasi.' using errcode='42501';
  end if;
  select * into t from public.creative_tasks where id=p_task for update;
  if not found or t.updated_at is distinct from p_version then raise exception 'Tugas berubah. Segarkan sebelum mencoba lagi.' using errcode='40001'; end if;
  if t.status not in ('ready','done') or t.platform='internal' or t.workstream='operations' or t.source_activation_id is not null then
    raise exception 'Tugas ini belum siap atau tidak memerlukan publikasi.';
  end if;
  select * into a from public.creative_accounts where id=p_account and is_active for share;
  if not found or t.business_unit_id is distinct from a.business_unit_id then raise exception 'Pilih akun aktif dari unit tugas yang sama.'; end if;
  if p_published_at is null or p_published_at > now() then raise exception 'Gunakan waktu publikasi aktual, bukan jadwal mendatang.'; end if;
  insert into public.creative_publications(task_id,account_id,published_url,published_at,recorded_by)
  values(p_task,p_account,trim(p_url),p_published_at,auth.uid()) returning id into publication;
  update public.creative_tasks set status='done', blocker='' where id=p_task;
  insert into public.creative_task_events(task_id,kind,detail,actor_id)
  values (p_task,'publication',a.platform || ' · ' || a.handle,auth.uid());
  return publication;
end $$;

create or replace function public.nudge_creative_task(p_task uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare t public.creative_tasks%rowtype;
begin
  if not (public.is_active_user() and (public.has_permission('creative.edit') or public.has_permission('launch.admin'))) then
    raise exception 'Tidak memiliki izin meminta tindak lanjut.' using errcode='42501';
  end if;
  select * into t from public.creative_tasks where id=p_task for share;
  if not found or t.assignee_id is null or t.status in ('done','cancelled') then
    raise exception 'Tindak lanjut memerlukan tugas aktif dengan PIC.';
  end if;
  insert into public.creative_task_events(task_id,kind,detail,actor_id,recipient_id)
  values (t.id,'nudge','Mohon perbarui progres dan catat hambatan bila ada.',auth.uid(),t.assignee_id)
  on conflict do nothing;
  return found;
end $$;

-- Used by the already-admin-gated team API; replaces the role in one transaction.
create or replace function public.replace_workspace_user_role(p_user uuid,p_role uuid)
returns void language plpgsql security invoker set search_path = '' as $assign_role$
begin
  perform 1 from public.profiles where id=p_user for update;
  if not found then raise exception 'Profil pengguna tidak ditemukan.'; end if;
  insert into public.user_roles(user_id,role_id) values(p_user,p_role) on conflict do nothing;
  delete from public.user_roles where user_id=p_user and role_id<>p_role;
end;
$assign_role$;
revoke all on function public.replace_workspace_user_role(uuid,uuid) from public, anon, authenticated;
grant execute on function public.replace_workspace_user_role(uuid,uuid) to service_role;

commit;
