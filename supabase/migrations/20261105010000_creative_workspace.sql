create table public.creative_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  objective text not null default '' check (length(objective) <= 2000),
  owner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'planned' check (status in ('planned','active','completed','archived')),
  starts_on date,
  ends_on date,
  budget_idr bigint not null default 0 check (budget_idr between 0 and 999999999999),
  spent_idr bigint not null default 0 check (spent_idr between 0 and 999999999999),
  updated_at timestamptz not null default clock_timestamp(),
  check (starts_on is null or ends_on is null or starts_on <= ends_on)
);

create table public.creative_tasks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.creative_campaigns(id) on delete restrict,
  title text not null check (length(trim(title)) between 1 and 160),
  brief text not null default '' check (length(brief) <= 2000),
  assignee_id uuid references public.profiles(id) on delete set null,
  platform text not null check (platform in ('instagram','tiktok','youtube','facebook','whatsapp','marketplace','website','internal','other')),
  format text not null default '' check (length(format) <= 80),
  status text not null default 'todo' check (status in ('todo','doing','review','ready','done','blocked','cancelled')),
  priority text not null default 'normal' check (priority in ('normal','high','urgent')),
  due_on date,
  publish_on date,
  output_url text not null default '' check (output_url = '' or (length(output_url) <= 1024 and output_url ~* '^https?://[^[:space:]]+$')),
  blocker text not null default '' check (length(blocker) <= 500),
  updated_at timestamptz not null default clock_timestamp(),
  check (status <> 'blocked' or length(trim(blocker)) > 0)
);

create index creative_tasks_campaign_due_idx on public.creative_tasks (campaign_id, due_on, id);
create index creative_tasks_due_idx on public.creative_tasks (due_on, id);
create index creative_tasks_publish_idx on public.creative_tasks (publish_on, id);
create index creative_tasks_assignee_idx on public.creative_tasks (assignee_id);
create index creative_campaigns_name_idx on public.creative_campaigns (name, id);

create function public.touch_creative_row() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := greatest(clock_timestamp(), old.updated_at + interval '1 microsecond');
  return new;
end;
$$;
create trigger creative_tasks_touch before update on public.creative_tasks
for each row execute function public.touch_creative_row();
create trigger creative_campaigns_touch before update on public.creative_campaigns
for each row execute function public.touch_creative_row();

do $$
declare t text;
begin
  foreach t in array array['creative_campaigns','creative_tasks'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update on public.%I to authenticated', t);
    execute format('create policy creative_read on public.%I for select to authenticated using ((select public.is_active_user()) and ((select public.has_permission(''launch.view'')) or (select public.has_permission(''launch.admin''))))', t);
    execute format('create policy creative_insert on public.%I for insert to authenticated with check ((select public.is_active_user()) and ((select public.has_permission(''launch.edit'')) or (select public.has_permission(''launch.admin''))))', t);
    execute format('create policy creative_update on public.%I for update to authenticated using ((select public.is_active_user()) and ((select public.has_permission(''launch.edit'')) or (select public.has_permission(''launch.admin'')))) with check ((select public.is_active_user()) and ((select public.has_permission(''launch.edit'')) or (select public.has_permission(''launch.admin''))))', t);
  end loop;
end $$;

-- RLS still applies. Return only counts for all, one campaign, or standalone tasks.
create function public.creative_task_summary(p_campaign_id uuid, p_all boolean)
returns table(total bigint, done bigint, blocked bigint, overdue bigint)
language sql stable security invoker set search_path = '' as $$
  select count(*) filter (where status <> 'cancelled'),
         count(*) filter (where status = 'done'),
         count(*) filter (where status = 'blocked'),
         count(*) filter (where status not in ('done','cancelled') and due_on < (now() at time zone 'Asia/Jakarta')::date)
  from public.creative_tasks
  where p_all or (p_campaign_id is null and campaign_id is null) or campaign_id = p_campaign_id;
$$;
revoke all on function public.creative_task_summary(uuid, boolean) from public, anon;
grant execute on function public.creative_task_summary(uuid, boolean) to authenticated;
