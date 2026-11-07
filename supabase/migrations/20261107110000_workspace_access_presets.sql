begin;

insert into public.permissions(code,module,name)
values ('creative.tasks.remove','creative','Menghapus tugas Creative')
on conflict (code) do nothing;

-- Preserve the removal access of the existing Creative editors.
insert into public.role_permissions(role_id,permission_id)
select distinct rp.role_id, removal.id
from public.role_permissions rp
join public.permissions edit on edit.id = rp.permission_id and edit.code = 'creative.edit'
join public.permissions removal on removal.code = 'creative.tasks.remove'
where exists (select 1 from public.roles r where r.id = rp.role_id
  and r.code not in ('creative_producer', 'creative_producer_launch_view'))
on conflict do nothing;

insert into public.roles(code,name,description) values
  ('launch_viewer', 'Launching · Lihat saja', 'Melihat data Launching Artikel.'),
  ('workspace_viewer', 'Dua ruang kerja · Lihat saja', 'Melihat data Launching Artikel dan Creative.'),
  ('creative_producer', 'Creative · Produksi tanpa hapus', 'Mengelola pekerjaan Creative tanpa izin menghapus tugas.'),
  ('creative_producer_launch_view', 'Creative · Produksi + lihat Launching', 'Mengelola pekerjaan Creative tanpa izin menghapus tugas, serta melihat Launching Artikel.')
on conflict (code) do nothing;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from (values
  ('launch_viewer', 'launch.view'),
  ('workspace_viewer', 'launch.view'),
  ('workspace_viewer', 'creative.view'),
  ('creative_producer', 'creative.view'),
  ('creative_producer', 'creative.edit'),
  ('creative_producer_launch_view', 'creative.view'),
  ('creative_producer_launch_view', 'creative.edit'),
  ('creative_producer_launch_view', 'launch.view')
) as preset(role_code, permission_code)
join public.roles r on r.code = preset.role_code
join public.permissions p on p.code = preset.permission_code
on conflict do nothing;

create or replace function public.remove_creative_task(p_task uuid, p_version timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not coalesce(
    public.is_active_user() and (
      public.has_permission('launch.admin') or (
        public.has_permission('creative.view') and public.has_permission('creative.edit')
        and public.has_permission('creative.tasks.remove')
      )
    ), false
  ) then
    raise exception 'Anda tidak memiliki izin menghapus tugas.' using errcode = '42501';
  end if;

  update public.creative_tasks
  set deleted_at = now(), deleted_by = auth.uid(),
      deleted_source_idea_id = source_idea_id, source_idea_id = null,
      deleted_source_activation_id = source_activation_id, source_activation_id = null
  where id = p_task and updated_at = p_version and deleted_at is null;

  if not found then
    raise exception 'Tugas sudah berubah atau dihapus. Segarkan daftar sebelum mencoba lagi.'
      using errcode = '40001';
  end if;
end;
$$;

commit;
