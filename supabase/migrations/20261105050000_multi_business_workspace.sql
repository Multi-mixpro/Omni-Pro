alter table public.business_units
  add column description text not null default '',
  add column sector text not null default 'other' check (sector in ('garment','fnb','other'));
update public.business_units set sector = 'garment'
where code in ('GG_SUPPLY','GUDSKUY','MAINLINE') and sector = 'other';

alter table public.creative_campaigns add column business_unit_id uuid references public.business_units(id);
alter table public.creative_tasks add column business_unit_id uuid references public.business_units(id);
alter table public.creative_tasks add column workstream text not null default 'creative'
  check (workstream in ('creative','marketing','operations'));
alter table public.creative_ideas add column business_unit_id uuid references public.business_units(id);
create index creative_campaigns_unit_idx on public.creative_campaigns (business_unit_id, name, id);
create index creative_tasks_unit_idx on public.creative_tasks (business_unit_id, due_on, id);
create index creative_ideas_unit_idx on public.creative_ideas (business_unit_id, prioritized desc, updated_at desc, id);

-- Campaign tasks always inherit the unit of their campaign, including during reassignment.
create function public.inherit_creative_campaign_unit() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.campaign_id is not null then
    select business_unit_id into new.business_unit_id
    from public.creative_campaigns where id = new.campaign_id for share;
    if not found then raise exception 'Kampanye tidak tersedia.'; end if;
  end if;
  return new;
end;
$$;
create trigger creative_task_inherit_unit before insert or update of campaign_id, business_unit_id on public.creative_tasks
for each row execute function public.inherit_creative_campaign_unit();

create function public.sync_creative_campaign_unit() returns trigger
language plpgsql set search_path = '' as $$
begin
  update public.creative_tasks set business_unit_id = new.business_unit_id
  where campaign_id = new.id and business_unit_id is distinct from new.business_unit_id;
  return new;
end;
$$;
create trigger creative_campaign_sync_unit after update of business_unit_id on public.creative_campaigns
for each row when (old.business_unit_id is distinct from new.business_unit_id)
execute function public.sync_creative_campaign_unit();

create function public.creative_unit_execution(p_campaign_id uuid, p_all boolean, p_today date, p_unit_id uuid, p_unassigned boolean)
returns table(total bigint, done bigint, blocked bigint, overdue bigint,
              target bigint, closed bigint, on_time bigint, review bigint, unplanned bigint)
language sql stable security invoker set search_path = '' as $$
  with bounds as (select date_trunc('week', p_today::timestamp)::date as week_start)
  select count(*), count(*) filter (where status = 'done'), count(*) filter (where status = 'blocked'),
         count(*) filter (where status <> 'done' and due_on < p_today),
         count(*) filter (where due_on >= week_start and due_on < week_start + 7),
         count(*) filter (where due_on >= week_start and due_on < week_start + 7 and status = 'done'),
         count(*) filter (where due_on >= week_start and due_on < week_start + 7
                           and (completed_at at time zone 'Asia/Jakarta')::date <= due_on),
         count(*) filter (where status = 'review'),
         count(*) filter (where status <> 'done' and (assignee_id is null or due_on is null))
  from public.creative_tasks cross join bounds
  where status <> 'cancelled'
    and (p_all or campaign_id is not distinct from p_campaign_id)
    and (case when p_unassigned then business_unit_id is null
              when p_unit_id is not null then business_unit_id = p_unit_id else true end);
$$;
revoke all on function public.creative_unit_execution(uuid, boolean, date, uuid, boolean) from public, anon;
grant execute on function public.creative_unit_execution(uuid, boolean, date, uuid, boolean) to authenticated;

create function public.business_execution_overview(p_today date)
returns table(unit_id uuid, article_count bigint, article_overdue bigint,
              creative_target bigint, creative_closed bigint, creative_overdue bigint)
language sql stable security invoker set search_path = '' as $$
  with bounds as (select date_trunc('week', p_today::timestamp)::date as week_start),
  articles as (
    select business_unit_id, count(*) as active, count(*) filter (where target_date < p_today) as overdue
    from public.launch_projects where status <> 'ARCHIVED' group by business_unit_id
  ), creative as (
    select business_unit_id,
           count(*) filter (where due_on >= week_start and due_on < week_start + 7) as target,
           count(*) filter (where due_on >= week_start and due_on < week_start + 7 and status = 'done') as closed,
           count(*) filter (where status <> 'done' and due_on < p_today) as overdue
    from public.creative_tasks cross join bounds where status <> 'cancelled' group by business_unit_id
  ), units as (
    select id from public.business_units where is_active
    union select business_unit_id from articles
    union select business_unit_id from creative
  )
  select u.id, coalesce(a.active,0), coalesce(a.overdue,0), coalesce(c.target,0), coalesce(c.closed,0), coalesce(c.overdue,0)
  from units u
  left join articles a on a.business_unit_id is not distinct from u.id
  left join creative c on c.business_unit_id is not distinct from u.id;
$$;
revoke all on function public.business_execution_overview(date) from public, anon;
grant execute on function public.business_execution_overview(date) to authenticated;

-- Editors can request an approval; only authorized approvers can decide it
-- or edit a record that has already been decided, including via the bridge.
create function public.guard_launch_approval_decision() returns trigger
language plpgsql set search_path = '' as $$
declare prior_status text; next_status text;
begin
  if auth.uid() is null then return new; end if;
  if tg_table_name = 'paten_records' then
    if new.record_type = 'approval' then next_status := upper(new.payload->>'status'); end if;
    if tg_op = 'UPDATE' then
      if old.record_type = 'approval' then prior_status := upper(old.payload->>'status'); end if;
    end if;
  else
    next_status := new.status;
    if tg_op = 'UPDATE' then prior_status := old.status; end if;
  end if;
  if (coalesce(prior_status, 'PENDING') <> 'PENDING' or coalesce(next_status, 'PENDING') <> 'PENDING')
     and not (public.has_permission('launch.approve') or public.has_permission('launch.admin')) then
    raise exception 'Keputusan approval membutuhkan izin approver.' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger launch_approval_guard before insert or update on public.launch_approvals
for each row execute function public.guard_launch_approval_decision();
create trigger paten_approval_guard before insert or update on public.paten_records
for each row execute function public.guard_launch_approval_decision();
