create table public.creative_ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 160),
  brief text not null default '' check (length(brief) <= 2000),
  platform text not null check (platform in ('instagram','tiktok','youtube','facebook','whatsapp','marketplace','website','internal','other')),
  reference_urls text[] not null default '{}',
  prioritized boolean not null default false,
  updated_at timestamptz not null default clock_timestamp(),
  check (cardinality(reference_urls) <= 5 and octet_length(reference_urls::text) <= 5200)
);

create index creative_ideas_priority_idx on public.creative_ideas (prioritized desc, updated_at desc, id);
create trigger creative_ideas_touch before update on public.creative_ideas
for each row execute function public.touch_creative_row();

alter table public.creative_tasks add column source_idea_id uuid
  unique references public.creative_ideas(id) on delete restrict;

alter table public.creative_ideas enable row level security;
revoke all on public.creative_ideas from anon, authenticated;
grant select, insert, update on public.creative_ideas to authenticated;
create policy creative_idea_read on public.creative_ideas for select to authenticated
  using ((select public.is_active_user()) and ((select public.has_permission('launch.view')) or (select public.has_permission('launch.admin'))));
create policy creative_idea_insert on public.creative_ideas for insert to authenticated
  with check ((select public.is_active_user()) and ((select public.has_permission('launch.edit')) or (select public.has_permission('launch.admin'))));
create policy creative_idea_update on public.creative_ideas for update to authenticated
  using ((select public.is_active_user()) and ((select public.has_permission('launch.edit')) or (select public.has_permission('launch.admin'))))
  with check ((select public.is_active_user()) and ((select public.has_permission('launch.edit')) or (select public.has_permission('launch.admin'))));
