create table public.creative_accounts (
  id uuid primary key default gen_random_uuid(),
  business_unit_id uuid not null references public.business_units,
  platform text not null check (platform in ('instagram','tiktok','youtube','facebook','whatsapp','marketplace','website','other')),
  handle text not null check (length(trim(handle)) between 1 and 100),
  profile_url text not null default '' check (profile_url = '' or profile_url ~* '^https?://[^[:space:]]+$'),
  owner_id uuid references public.profiles on delete set null,
  is_active boolean not null default true,
  updated_at timestamptz not null default clock_timestamp()
);
create unique index creative_accounts_identity on public.creative_accounts(business_unit_id, platform, lower(trim(handle)));
create trigger creative_accounts_touch before update on public.creative_accounts
for each row execute function public.touch_creative_row();

create table public.creative_account_snapshots (
  account_id uuid not null references public.creative_accounts on delete restrict,
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  source text not null default 'platform' check (source in ('platform','csv')),
  followers integer check (followers >= 0),
  views bigint check (views >= 0),
  reach bigint check (reach >= 0),
  link_clicks bigint check (link_clicks >= 0),
  recorded_at timestamptz not null default now(),
  primary key (account_id,period_start,period_end,source),
  check (followers is not null or views is not null or reach is not null or link_clicks is not null)
);
create index creative_snapshots_recent on public.creative_account_snapshots(account_id, period_end desc, period_start desc, source);

create table public.creative_publications (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.creative_tasks on delete restrict,
  account_id uuid not null references public.creative_accounts on delete restrict,
  published_url text not null check (length(published_url) <= 1024 and published_url ~* '^https?://[^[:space:]]+$'),
  published_at timestamptz not null,
  recorded_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  unique (task_id,account_id)
);
create index creative_publications_account_date on public.creative_publications(account_id,published_at desc,id);

create table public.creative_publication_snapshots (
  publication_id uuid not null references public.creative_publications on delete restrict,
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  views bigint check (views >= 0),
  reach bigint check (reach >= 0),
  link_clicks bigint check (link_clicks >= 0),
  recorded_at timestamptz not null default now(),
  primary key(publication_id,period_start,period_end),
  check (views is not null or reach is not null or link_clicks is not null)
);

create table public.creative_task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.creative_tasks on delete restrict,
  kind text not null check (kind in ('status','publication','nudge')),
  detail text not null,
  actor_id uuid references public.profiles on delete set null,
  recipient_id uuid references public.profiles on delete set null,
  day_wib date not null default ((now() at time zone 'Asia/Jakarta')::date),
  created_at timestamptz not null default now()
);
create index creative_task_events_history on public.creative_task_events(task_id,created_at desc,id);
create index creative_task_events_inbox on public.creative_task_events(recipient_id,created_at desc,id) where kind = 'nudge';
create unique index creative_task_nudge_once on public.creative_task_events(task_id,recipient_id,day_wib) where kind = 'nudge';
alter table public.creative_tasks add column review_note text not null default '' check (length(review_note) <= 1000);

do $$
declare t text;
begin
  foreach t in array array['creative_accounts','creative_account_snapshots','creative_publications','creative_publication_snapshots','creative_task_events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('create policy command_read on public.%I for select to authenticated using ((select public.is_active_user()) and ((select public.has_permission(''launch.view'')) or (select public.has_permission(''launch.admin''))))', t);
    if t in ('creative_accounts','creative_account_snapshots','creative_publication_snapshots') then
      execute format('grant insert, update on public.%I to authenticated', t);
      execute format('create policy command_insert on public.%I for insert to authenticated with check ((select public.is_active_user()) and ((select public.has_permission(''launch.edit'')) or (select public.has_permission(''launch.admin''))))', t);
      execute format('create policy command_update on public.%I for update to authenticated using ((select public.is_active_user()) and ((select public.has_permission(''launch.edit'')) or (select public.has_permission(''launch.admin'')))) with check ((select public.is_active_user()) and ((select public.has_permission(''launch.edit'')) or (select public.has_permission(''launch.admin''))))', t);
    end if;
  end loop;
end $$;

drop policy command_read on public.creative_task_events;
create policy command_read on public.creative_task_events for select to authenticated using (
  (select public.is_active_user())
  and ((select public.has_permission('launch.view')) or (select public.has_permission('launch.admin')))
  and (kind <> 'nudge' or recipient_id = (select auth.uid()) or actor_id = (select auth.uid()) or (select public.has_permission('launch.admin')))
);

create function public.log_creative_task_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.creative_task_events(task_id,kind,detail,actor_id)
  values (new.id,'status',old.status || ' → ' || new.status ||
    case when old.status='review' and new.status='doing' and new.review_note<>'' then ': ' || new.review_note else '' end,auth.uid());
  return new;
end $$;
revoke all on function public.log_creative_task_status() from public;
create trigger creative_task_status_history after update of status on public.creative_tasks
for each row when (old.status is distinct from new.status) execute function public.log_creative_task_status();

create function public.record_creative_publication(p_task uuid, p_account uuid, p_url text, p_published_at timestamptz, p_version timestamptz)
returns uuid language plpgsql security definer set search_path = '' as $$
declare t public.creative_tasks%rowtype; a public.creative_accounts%rowtype; publication uuid;
begin
  if not (public.is_active_user() and (public.has_permission('launch.edit') or public.has_permission('launch.admin'))) then
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
revoke all on function public.record_creative_publication(uuid,uuid,text,timestamptz,timestamptz) from public, anon;
grant execute on function public.record_creative_publication(uuid,uuid,text,timestamptz,timestamptz) to authenticated;

create function public.nudge_creative_task(p_task uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare t public.creative_tasks%rowtype;
begin
  if not (public.is_active_user() and (public.has_permission('launch.edit') or public.has_permission('launch.admin'))) then
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
revoke all on function public.nudge_creative_task(uuid) from public, anon;
grant execute on function public.nudge_creative_task(uuid) to authenticated;

create function public.creative_board(p_unit uuid,p_unassigned boolean,p_campaign uuid,p_standalone boolean,
  p_filters jsonb,p_focus text,p_today date,p_page integer)
returns table(stage text,total bigint,items jsonb)
language sql stable security invoker set search_path = '' as $$
with window_dates as (select date_trunc('week',p_today::timestamp)::date as monday),
scoped as (
  select t.*, row_number() over (partition by t.status order by
    case when p_filters->>'order'='publish_on' then t.publish_on else t.due_on end nulls last,t.id) as position
  from public.creative_tasks t cross join window_dates
  where (case when p_unassigned then t.business_unit_id is null when p_unit is not null then t.business_unit_id=p_unit else true end)
    and (case when p_standalone then t.campaign_id is null when p_campaign is not null then t.campaign_id=p_campaign else true end)
    and (coalesce(p_filters->>'platform','')='' or t.platform=p_filters->>'platform')
    and (coalesce(p_filters->>'status','')='' or t.status=p_filters->>'status')
    and (coalesce(p_filters->>'workstream','')='' or t.workstream=p_filters->>'workstream')
    and (case coalesce(p_filters->>'assignee','') when '' then true when 'unassigned' then t.assignee_id is null else t.assignee_id::text=p_filters->>'assignee' end)
    and (case p_focus
      when 'week' then t.status<>'cancelled' and t.due_on>=monday and t.due_on<monday+7
      when 'publish' then t.status<>'cancelled' and t.publish_on>=monday and t.publish_on<monday+7
      when 'today' then t.status not in ('done','cancelled') and t.due_on=p_today
      when 'overdue' then t.status not in ('done','cancelled') and t.due_on<p_today
      when 'blocked' then t.status='blocked'
      when 'review' then t.status='review'
      when 'ready' then t.status='ready'
      when 'unplanned' then t.status not in ('done','cancelled') and (t.assignee_id is null or t.due_on is null)
      else true end)
), totals as (select status,count(*) as total from scoped group by status),
cards as (
  select s.status,jsonb_agg((to_jsonb(s)-'position') || jsonb_build_object(
    'campaign',case when c.id is not null then jsonb_build_object('name',c.name) end,
    'source_idea',case when i.id is not null then jsonb_build_object('title',i.title,'reference_urls',i.reference_urls) end)
    order by s.position) as items
  from scoped s left join public.creative_campaigns c on c.id=s.campaign_id
  left join public.creative_ideas i on i.id=s.source_idea_id
  where s.position > greatest(p_page,0)::bigint*6 and s.position <= (greatest(p_page,0)::bigint+1)*6
  group by s.status
)
select totals.status,totals.total,coalesce(cards.items,'[]'::jsonb) from totals left join cards on cards.status=totals.status;
$$;
revoke all on function public.creative_board(uuid,boolean,uuid,boolean,jsonb,text,date,integer) from public, anon;
grant execute on function public.creative_board(uuid,boolean,uuid,boolean,jsonb,text,date,integer) to authenticated;

alter table public.creative_channel_activations add column account_id uuid references public.creative_accounts on delete restrict;
create index creative_activations_account on public.creative_channel_activations(account_id,review_on desc) where account_id is not null;
create function public.validate_creative_activation_account() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if old.campaign_id is distinct from new.campaign_id and exists (
      select 1 from public.creative_tasks where source_activation_id=old.id
    ) then raise exception 'Aktivasi yang sudah memiliki tindak lanjut tidak bisa pindah kampanye.'; end if;
  end if;
  if new.account_id is not null and not exists (
    select 1 from public.creative_accounts a join public.creative_campaigns c on c.id=new.campaign_id
    where a.id=new.account_id and a.business_unit_id=c.business_unit_id and a.platform=new.platform
  ) then raise exception 'Akun harus sesuai unit kampanye dan platform aktivasi.'; end if;
  return new;
end $$;
create trigger creative_activation_account_guard before insert or update of account_id,campaign_id,platform
on public.creative_channel_activations for each row execute function public.validate_creative_activation_account();

create function public.guard_creative_account_identity() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if exists (select 1 from public.creative_publications where account_id=old.id)
     or exists (select 1 from public.creative_channel_activations where account_id=old.id) then
    raise exception 'Unit dan platform akun yang sudah dipakai tidak bisa diubah.';
  end if;
  return new;
end $$;
create trigger creative_account_identity_guard before update of business_unit_id,platform on public.creative_accounts
for each row when (old.business_unit_id is distinct from new.business_unit_id or old.platform is distinct from new.platform)
execute function public.guard_creative_account_identity();

create function public.guard_creative_campaign_account_unit() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if exists (
    select 1 from public.creative_channel_activations c join public.creative_accounts a on a.id=c.account_id
    where c.campaign_id=old.id and a.business_unit_id is distinct from new.business_unit_id
  ) or exists (
    select 1 from public.creative_tasks t join public.creative_publications p on p.task_id=t.id
    join public.creative_accounts a on a.id=p.account_id
    where t.campaign_id=old.id and a.business_unit_id is distinct from new.business_unit_id
  ) then raise exception 'Unit kampanye tidak bisa dipindah selama masih terhubung dengan akun unit lama.'; end if;
  return new;
end $$;
create trigger creative_campaign_account_unit_guard before update of business_unit_id on public.creative_campaigns
for each row when (old.business_unit_id is distinct from new.business_unit_id)
execute function public.guard_creative_campaign_account_unit();

alter table public.creative_tasks add column source_activation_id uuid unique references public.creative_channel_activations on delete restrict;
create function public.create_creative_activation_followup(p_activation uuid,p_pic uuid,p_due date)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare a public.creative_channel_activations%rowtype; task uuid;
begin
  select * into a from public.creative_channel_activations where id=p_activation;
  if not found or a.status<>'evaluated' then raise exception 'Tutup evaluasi sebelum membuat tindak lanjut.'; end if;
  if p_pic is null or p_due is null or not exists (select 1 from public.profiles p where p.id=p_pic and p.is_active) then
    raise exception 'Pilih PIC aktif dan deadline tindak lanjut.';
  end if;
  insert into public.creative_tasks(campaign_id,title,brief,platform,workstream,assignee_id,due_on,source_activation_id)
  values(a.campaign_id,left('Tindak lanjut: ' || a.name,160),a.evaluation,a.platform,'marketing',p_pic,p_due,a.id)
  on conflict (source_activation_id) do nothing returning id into task;
  if task is null then select id into task from public.creative_tasks where source_activation_id=p_activation; end if;
  return task;
end $$;
revoke all on function public.create_creative_activation_followup(uuid,uuid,date) from public, anon;
grant execute on function public.create_creative_activation_followup(uuid,uuid,date) to authenticated;

create function public.guard_creative_published_task_unit() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if exists (select 1 from public.creative_publications p join public.creative_accounts a on a.id=p.account_id
    where p.task_id=new.id and a.business_unit_id is distinct from new.business_unit_id) then
    raise exception 'Unit tugas tidak bisa dipindah setelah bukti tayang dicatat.';
  end if;
  return new;
end $$;
create trigger creative_published_task_unit_guard after update on public.creative_tasks
for each row when (old.business_unit_id is distinct from new.business_unit_id)
execute function public.guard_creative_published_task_unit();

create function public.creative_recorded_publications_calendar(p_from date,p_until date,p_unit uuid,p_unassigned boolean,p_campaign uuid,p_standalone boolean)
returns table(item_id uuid,title text,platform text,event_day date,kind text,status text)
language sql stable security invoker set search_path = '' as $$
  select p.id,t.title,a.platform,(p.published_at at time zone 'Asia/Jakarta')::date,'published','done'
  from public.creative_publications p join public.creative_tasks t on t.id=p.task_id
  join public.creative_accounts a on a.id=p.account_id
  where p.published_at >= (p_from::timestamp at time zone 'Asia/Jakarta')
    and p.published_at < (p_until::timestamp at time zone 'Asia/Jakarta')
    and (case when p_unassigned then t.business_unit_id is null when p_unit is not null then t.business_unit_id=p_unit else true end)
    and (case when p_standalone then t.campaign_id is null when p_campaign is not null then t.campaign_id=p_campaign else true end);
$$;
create index creative_publications_calendar on public.creative_publications(published_at,id);
revoke all on function public.creative_recorded_publications_calendar(date,date,uuid,boolean,uuid,boolean) from public, anon;
grant execute on function public.creative_recorded_publications_calendar(date,date,uuid,boolean,uuid,boolean) to authenticated;

-- Define the planned feed explicitly for both versions of the Hub migration.
create or replace function public.creative_planned_calendar_events(p_from date, p_until date, p_unit_id uuid, p_unassigned boolean, p_campaign_id uuid, p_standalone boolean)
returns table(item_id uuid,title text,platform text,event_day date,kind text,status text)
language sql stable security invoker set search_path = '' as $planned_calendar$
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
$planned_calendar$;
revoke all on function public.creative_planned_calendar_events(date,date,uuid,boolean,uuid,boolean) from public, anon;
grant execute on function public.creative_planned_calendar_events(date,date,uuid,boolean,uuid,boolean) to authenticated;

create or replace function public.creative_calendar_events(p_from date, p_until date, p_unit_id uuid, p_unassigned boolean, p_campaign_id uuid, p_standalone boolean)
returns table(item_id uuid,title text,platform text,event_day date,kind text,status text)
language sql stable security invoker set search_path = '' as $$
  select * from public.creative_planned_calendar_events(p_from,p_until,p_unit_id,p_unassigned,p_campaign_id,p_standalone)
  union all
  select * from public.creative_recorded_publications_calendar(p_from,p_until,p_unit_id,p_unassigned,p_campaign_id,p_standalone);
$$;
revoke all on function public.creative_calendar_events(date,date,uuid,boolean,uuid,boolean) from public, anon;
grant execute on function public.creative_calendar_events(date,date,uuid,boolean,uuid,boolean) to authenticated;

create function public.creative_command_summary(p_campaign_id uuid,p_all boolean,p_today date,p_unit_id uuid,p_unassigned boolean)
returns table(total bigint,done bigint,blocked bigint,overdue bigint,target bigint,closed bigint,on_time bigint,review bigint,unplanned bigint,published_week bigint)
language sql stable security invoker set search_path = '' as $$
  select stats.*, (
    select count(*) from public.creative_recorded_publications_calendar(
      date_trunc('week',p_today::timestamp)::date,
      date_trunc('week',p_today::timestamp)::date+7,
      p_unit_id,p_unassigned,p_campaign_id,not p_all and p_campaign_id is null
    )
  )
  from public.creative_unit_execution(p_campaign_id,p_all,p_today,p_unit_id,p_unassigned) stats;
$$;
revoke all on function public.creative_command_summary(uuid,boolean,date,uuid,boolean) from public, anon;
grant execute on function public.creative_command_summary(uuid,boolean,date,uuid,boolean) to authenticated;
