-- Blueprint bagian 9 (Kolaborasi Dua Sisi) & 6.2 (nav "Discussion"): saat ini
-- hanya ada log aktivitas otomatis. Tim dan owner butuh ruang diskusi bebas
-- dan kartu "Decision Required" untuk permintaan keputusan berbatas waktu.

begin;

create table if not exists public.launch_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.launch_projects(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null,
  is_decision_request boolean not null default false,
  decision_deadline date,
  decision_status text check (decision_status in ('OPEN','DECIDED')),
  decision_note text,
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists launch_comments_project_idx on public.launch_comments(project_id, created_at);

alter table public.launch_comments enable row level security;

create policy launch_comments_read on public.launch_comments
  for select using (has_permission('launch.view'));

create policy launch_comments_insert on public.launch_comments
  for insert with check (has_permission('launch.edit') or has_permission('launch.create'));

create policy launch_comments_update on public.launch_comments
  for update using (has_permission('launch.edit')) with check (has_permission('launch.edit'));

create policy launch_comments_delete on public.launch_comments
  for delete using (has_permission('launch.admin') or author_id = auth.uid());

drop trigger if exists set_updated_at on public.launch_comments;
create trigger set_updated_at before update on public.launch_comments
  for each row execute function public.set_updated_at();

-- Default decision_status when a comment is marked as a decision request.
create or replace function public.launch_comments_default_decision_status()
returns trigger language plpgsql as $$
begin
  if new.is_decision_request and new.decision_status is null then
    new.decision_status := 'OPEN';
  end if;
  return new;
end;
$$;

drop trigger if exists launch_comments_decision_status on public.launch_comments;
create trigger launch_comments_decision_status before insert on public.launch_comments
  for each row execute function public.launch_comments_default_decision_status();

create or replace function public.decide_comment_request(p_comment_id uuid, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare v_comment public.launch_comments%rowtype;
begin
  if not has_permission('launch.edit') then raise exception 'Akses memutuskan permintaan ditolak'; end if;
  select * into v_comment from public.launch_comments where id = p_comment_id for update;
  if not found then raise exception 'Diskusi tidak ditemukan'; end if;
  if not v_comment.is_decision_request then raise exception 'Diskusi ini bukan permintaan keputusan'; end if;

  update public.launch_comments
  set decision_status = 'DECIDED', decision_note = p_note, decided_by = auth.uid(), decided_at = now()
  where id = p_comment_id;

  insert into public.launch_activity(project_id, actor_id, event_type, message, metadata)
  values (v_comment.project_id, auth.uid(), 'DECISION_MADE', 'memutuskan permintaan keputusan: ' || p_note, jsonb_build_object('comment_id', p_comment_id));
end;
$$;

grant execute on function public.decide_comment_request(uuid,text) to authenticated;

comment on table public.launch_comments is 'Diskusi bebas dan Decision Request per artikel (Blueprint bagian 9 dan nav Discussion).';

commit;
