-- SQL Editor retry: preserve existing rows and restore the schema objects.
create table if not exists public.creative_channel_activations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.creative_campaigns(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 160),
  platform text not null check (platform in ('marketplace','instagram','tiktok','facebook','youtube','whatsapp','website','other')),
  channel_name text not null default '' check (length(channel_name) <= 80),
  distribution text not null check (distribution in ('paid','organic')),
  status text not null default 'planned' check (status in ('planned','running','review','evaluated','cancelled')),
  assignee_id uuid references public.profiles(id) on delete set null,
  starts_on date,
  ends_on date,
  review_on date not null,
  budget_idr bigint not null default 0 check (budget_idr between 0 and 999999999999),
  spent_idr bigint not null default 0 check (spent_idr between 0 and 999999999999),
  metric text not null check (metric in ('reach','clicks','leads','orders')),
  target_result integer not null default 0 check (target_result >= 0),
  actual_result integer not null default 0 check (actual_result >= 0),
  evaluation text not null default '' check (length(evaluation) <= 2000),
  decision text check (decision in ('continue','adjust','stop')),
  updated_at timestamptz not null default clock_timestamp(),
  check (starts_on is null or ends_on is null or starts_on <= ends_on),
  check (starts_on is null or review_on >= starts_on),
  check (distribution <> 'organic' or (budget_idr = 0 and spent_idr = 0)),
  check (status <> 'evaluated' or (decision is not null and length(trim(evaluation)) > 0))
);
do $$
declare missing text;
begin
  select string_agg(col, ', ') into missing
  from unnest(array['id','campaign_id','name','platform','channel_name','distribution','status',
    'assignee_id','starts_on','ends_on','review_on','budget_idr','spent_idr','metric',
    'target_result','actual_result','evaluation','decision','updated_at']) as required(col)
  where not exists (select 1 from pg_attribute where attrelid='public.creative_channel_activations'::regclass
    and attname=required.col and attnum>0 and not attisdropped);
  if missing is not null then
    raise exception 'Tabel creative_channel_activations sudah ada dengan skema berbeda. Kolom belum ada: %',missing;
  end if;
end $$;

create index if not exists creative_activations_campaign_review_idx on public.creative_channel_activations(campaign_id, review_on, id);
create index if not exists creative_activations_review_idx on public.creative_channel_activations(review_on, id);
drop trigger if exists creative_activations_touch on public.creative_channel_activations;
create trigger creative_activations_touch before update on public.creative_channel_activations
for each row execute function public.touch_creative_row();

alter table public.creative_channel_activations enable row level security;
revoke all on public.creative_channel_activations from anon, authenticated;
grant select, insert, update on public.creative_channel_activations to authenticated;
drop policy if exists activation_read on public.creative_channel_activations;
drop policy if exists activation_insert on public.creative_channel_activations;
drop policy if exists activation_update on public.creative_channel_activations;
create policy activation_read on public.creative_channel_activations for select to authenticated
  using ((select public.is_active_user()) and ((select public.has_permission('launch.view')) or (select public.has_permission('launch.admin'))));
create policy activation_insert on public.creative_channel_activations for insert to authenticated
  with check ((select public.is_active_user()) and ((select public.has_permission('launch.edit')) or (select public.has_permission('launch.admin'))));
create policy activation_update on public.creative_channel_activations for update to authenticated
  using ((select public.is_active_user()) and ((select public.has_permission('launch.edit')) or (select public.has_permission('launch.admin'))))
  with check ((select public.is_active_user()) and ((select public.has_permission('launch.edit')) or (select public.has_permission('launch.admin'))));

create or replace function public.creative_channel_summary(p_today date, p_unit_id uuid, p_unassigned boolean, p_campaign_id uuid)
returns table(platform text, budget bigint, spent bigint, pending_review bigint, overdue bigint, evaluated bigint)
language sql stable security invoker set search_path = '' as $$
  select a.platform, sum(a.budget_idr)::bigint, sum(a.spent_idr)::bigint,
         count(*) filter (where a.status not in ('evaluated','cancelled') and a.review_on <= p_today + 7),
         count(*) filter (where a.status not in ('evaluated','cancelled') and a.review_on < p_today),
         count(*) filter (where a.status = 'evaluated')
  from public.creative_channel_activations a
  join public.creative_campaigns c on c.id = a.campaign_id
  where (p_campaign_id is null or a.campaign_id = p_campaign_id)
    and (case when p_unassigned then c.business_unit_id is null
              when p_unit_id is not null then c.business_unit_id = p_unit_id else true end)
  group by a.platform;
$$;
revoke all on function public.creative_channel_summary(date,uuid,boolean,uuid) from public, anon;
grant execute on function public.creative_channel_summary(date,uuid,boolean,uuid) to authenticated;

create or replace function public.creative_planned_calendar_events(p_from date, p_until date, p_unit_id uuid, p_unassigned boolean, p_campaign_id uuid, p_standalone boolean)
returns table(item_id uuid, title text, platform text, event_day date, kind text, status text)
language sql stable security invoker set search_path = '' as $$
  select t.id, t.title, t.platform, event.day, event.kind, t.status
  from public.creative_tasks t
  cross join lateral (values (t.due_on, 'deadline'), (t.publish_on, 'publish')) as event(day,kind)
  where event.day >= p_from and event.day < p_until and t.status <> 'cancelled'
    and ((t.due_on >= p_from and t.due_on < p_until) or (t.publish_on >= p_from and t.publish_on < p_until))
    and (case when p_standalone then t.campaign_id is null when p_campaign_id is not null then t.campaign_id = p_campaign_id else true end)
    and (case when p_unassigned then t.business_unit_id is null when p_unit_id is not null then t.business_unit_id = p_unit_id else true end)
  union all
  select a.id, a.name, a.platform, a.review_on, 'evaluation', a.status
  from public.creative_channel_activations a
  join public.creative_campaigns c on c.id = a.campaign_id
  where not p_standalone and a.review_on >= p_from and a.review_on < p_until and a.status <> 'cancelled'
    and (p_campaign_id is null or a.campaign_id = p_campaign_id)
    and (case when p_unassigned then c.business_unit_id is null when p_unit_id is not null then c.business_unit_id = p_unit_id else true end);
$$;
revoke all on function public.creative_planned_calendar_events(date,date,uuid,boolean,uuid,boolean) from public, anon;
grant execute on function public.creative_planned_calendar_events(date,date,uuid,boolean,uuid,boolean) to authenticated;

-- Retrying this file after Command Center must not replace its combined calendar.
do $$
begin
  if to_regprocedure('public.creative_recorded_publications_calendar(date,date,uuid,boolean,uuid,boolean)') is null then
    execute $ddl$
      create or replace function public.creative_calendar_events(p_from date, p_until date, p_unit_id uuid, p_unassigned boolean, p_campaign_id uuid, p_standalone boolean)
      returns table(item_id uuid,title text,platform text,event_day date,kind text,status text)
      language sql stable security invoker set search_path = '' as $body$
        select * from public.creative_planned_calendar_events(p_from,p_until,p_unit_id,p_unassigned,p_campaign_id,p_standalone);
      $body$
    $ddl$;
  end if;
end $$;
revoke all on function public.creative_calendar_events(date,date,uuid,boolean,uuid,boolean) from public, anon;
grant execute on function public.creative_calendar_events(date,date,uuid,boolean,uuid,boolean) to authenticated;
