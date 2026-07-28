-- Blueprint bagian 8.3 (Dependency): task belum punya ketergantungan sama
-- sekali. Tambahkan predecessor + jenis dependency, dan pindahkan
-- penyelesaian task ke RPC agar predecessor yang belum selesai benar-benar
-- mencegah task turunannya ditandai selesai (Finish-to-Start/Finish-to-Finish).

begin;

alter table public.launch_tasks
  add column if not exists depends_on_task_id uuid references public.launch_tasks(id) on delete set null,
  add column if not exists dependency_type text not null default 'NONE'
    check (dependency_type in ('FS','SS','FF','NONE'));

create index if not exists launch_tasks_depends_on_idx on public.launch_tasks(depends_on_task_id);

create or replace function public.set_task_dependency(p_task_id uuid, p_depends_on_task_id uuid, p_dependency_type text)
returns void language plpgsql security definer set search_path = public as $$
declare v_task public.launch_tasks%rowtype;
begin
  if not has_permission('launch.edit') then raise exception 'Akses mengatur dependency ditolak'; end if;
  select * into v_task from public.launch_tasks where id = p_task_id;
  if not found then raise exception 'Tugas tidak ditemukan'; end if;
  if p_depends_on_task_id = p_task_id then raise exception 'Tugas tidak dapat bergantung pada dirinya sendiri'; end if;
  if p_depends_on_task_id is not null and not exists(select 1 from public.launch_tasks where id = p_depends_on_task_id and project_id = v_task.project_id) then
    raise exception 'Tugas rujukan tidak ditemukan pada artikel yang sama';
  end if;

  update public.launch_tasks
  set depends_on_task_id = p_depends_on_task_id,
      dependency_type = coalesce(nullif(p_dependency_type,''), 'NONE')
  where id = p_task_id;
end;
$$;

grant execute on function public.set_task_dependency(uuid,uuid,text) to authenticated;

create or replace function public.complete_launch_task(p_task_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_task public.launch_tasks%rowtype;
  v_predecessor public.launch_tasks%rowtype;
begin
  if not has_permission('launch.edit') then raise exception 'Akses menyelesaikan tugas ditolak'; end if;
  select * into v_task from public.launch_tasks where id = p_task_id for update;
  if not found then raise exception 'Tugas tidak ditemukan'; end if;

  if v_task.depends_on_task_id is not null and v_task.dependency_type in ('FS','FF') then
    select * into v_predecessor from public.launch_tasks where id = v_task.depends_on_task_id;
    if found and v_predecessor.status <> 'DONE' then
      raise exception 'Tugas ini menunggu "%" selesai terlebih dahulu', v_predecessor.title;
    end if;
  end if;

  update public.launch_tasks set status = 'DONE', completed_at = now() where id = p_task_id;
end;
$$;

grant execute on function public.complete_launch_task(uuid) to authenticated;

comment on column public.launch_tasks.dependency_type is 'FS=Finish-to-Start, SS=Start-to-Start, FF=Finish-to-Finish, NONE=tanpa dependency (Blueprint 8.3).';

commit;
