begin;

alter table public.creative_tasks add column checklist jsonb not null default '[]'::jsonb;

create function public.guard_creative_task_checklist()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if jsonb_typeof(new.checklist) <> 'array' then
    raise exception 'Checklist tugas harus berupa daftar.';
  end if;
  if jsonb_array_length(new.checklist) > 20 or exists (
    select 1 from jsonb_array_elements(new.checklist) as item(value)
    where jsonb_typeof(item.value -> 'label') is distinct from 'string'
       or char_length(btrim(item.value ->> 'label')) not between 1 and 160
       or jsonb_typeof(item.value -> 'done') is distinct from 'boolean'
  ) then
    raise exception 'Checklist maksimal 20 langkah, masing-masing 1–160 karakter.';
  end if;
  if new.status = 'done' and exists (
    select 1 from jsonb_array_elements(new.checklist) as item(value)
    where item.value -> 'done' = 'false'::jsonb
  ) then
    raise exception 'Selesaikan semua langkah checklist sebelum menutup tugas.';
  end if;
  return new;
end;
$$;

create trigger creative_task_checklist_guard
before insert or update of checklist, status on public.creative_tasks
for each row execute function public.guard_creative_task_checklist();

create table public.creative_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.creative_tasks(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index creative_task_comments_page_idx on public.creative_task_comments (task_id, created_at desc, id desc);
alter table public.creative_task_comments enable row level security;
revoke all on public.creative_task_comments from public, anon, authenticated;
grant select, insert on public.creative_task_comments to authenticated;

create policy creative_task_comments_read on public.creative_task_comments
for select to authenticated using (
  exists (select 1 from public.creative_tasks task where task.id = creative_task_comments.task_id)
);

create policy creative_task_comments_insert on public.creative_task_comments
for insert to authenticated with check (
  author_id = (select auth.uid())
  and ((select public.has_permission('creative.edit')) or (select public.has_permission('launch.admin')))
  and exists (select 1 from public.creative_tasks task where task.id = creative_task_comments.task_id)
);

commit;
