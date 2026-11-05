alter table public.creative_ideas
  add column queue_state text not null default 'candidate' check (queue_state in ('candidate','ready','parked')),
  add constraint creative_idea_ready_needs_brief check (queue_state <> 'ready' or length(trim(brief)) > 0);

create index creative_ideas_queue_idx on public.creative_ideas (queue_state, prioritized desc, updated_at desc, id);

alter table public.creative_tasks
  add column completed_at timestamptz;

-- Previous completions have no reliable timestamp. Leave them unknown.
create function public.record_creative_task_completion() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status <> 'done' then
    new.completed_at := null;
  elsif tg_op = 'INSERT' then
    new.completed_at := clock_timestamp();
  elsif old.status <> 'done' then
    new.completed_at := clock_timestamp();
  else
    new.completed_at := old.completed_at;
  end if;
  return new;
end;
$$;

create trigger creative_tasks_completion before insert or update on public.creative_tasks
for each row execute function public.record_creative_task_completion();

create function public.validate_creative_idea_assignment() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.source_idea_id is not distinct from old.source_idea_id then return new; end if;
  end if;
  if new.source_idea_id is not null then
    if new.assignee_id is null or new.due_on is null then
      raise exception 'Tentukan PIC dan deadline sebelum menjadikan ide sebagai tugas.';
    end if;
    perform 1 from public.creative_ideas
      where id = new.source_idea_id and queue_state = 'ready' for share;
    if not found then raise exception 'Ide belum siap dikerjakan. Segarkan bank ide.'; end if;
  end if;
  return new;
end;
$$;

create trigger creative_tasks_validate_idea before insert or update of source_idea_id on public.creative_tasks
for each row execute function public.validate_creative_idea_assignment();

create function public.creative_weekly_execution(p_campaign_id uuid, p_all boolean, p_today date)
returns table(total bigint, done bigint, blocked bigint, overdue bigint,
              target bigint, closed bigint, on_time bigint, review bigint, unplanned bigint)
language sql stable security invoker set search_path = '' as $$
  with bounds as (
    select date_trunc('week', p_today::timestamp)::date as week_start
  ), scoped as (
    select status, due_on, assignee_id, (completed_at at time zone 'Asia/Jakarta')::date as completed_on
    from public.creative_tasks
    where status <> 'cancelled'
      and (p_all or (p_campaign_id is null and campaign_id is null) or campaign_id = p_campaign_id)
  )
  select count(*),
         count(*) filter (where status = 'done'),
         count(*) filter (where status = 'blocked'),
         count(*) filter (where status <> 'done' and due_on < p_today),
         count(*) filter (where due_on >= week_start and due_on < week_start + 7),
         count(*) filter (where due_on >= week_start and due_on < week_start + 7 and status = 'done'),
         count(*) filter (where due_on >= week_start and due_on < week_start + 7 and completed_on <= due_on),
         count(*) filter (where status = 'review'),
         count(*) filter (where status <> 'done' and (assignee_id is null or due_on is null))
  from scoped cross join bounds;
$$;
revoke all on function public.creative_weekly_execution(uuid, boolean, date) from public, anon;
grant execute on function public.creative_weekly_execution(uuid, boolean, date) to authenticated;
