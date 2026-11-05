-- Keep existing article and global messages. Reject new messages without a project.
drop policy launch_comments_insert on public.launch_comments;
create policy launch_comments_insert on public.launch_comments
  for insert to authenticated with check (
    project_id is not null and author_id = (select auth.uid())
    and (select public.is_active_user())
    and ((select public.has_permission('launch.edit')) or (select public.has_permission('launch.create'))
         or (select public.has_permission('launch.admin')))
    and (is_decision_request or length(trim(body)) between 1 and 2000)
  );

create index launch_comments_discussion_idx
  on public.launch_comments (project_id, created_at desc, id desc)
  where not is_decision_request and project_id is not null;

create table public.creative_campaign_comments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.creative_campaigns(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index creative_campaign_comments_page_idx
  on public.creative_campaign_comments (campaign_id, created_at desc, id desc);

alter table public.creative_campaign_comments enable row level security;
revoke all on public.creative_campaign_comments from anon, authenticated;
grant select on public.creative_campaign_comments to authenticated;
grant insert (campaign_id, author_id, body) on public.creative_campaign_comments to authenticated;

create policy creative_campaign_comments_read on public.creative_campaign_comments
  for select to authenticated using (
    (select public.is_active_user()) and
    ((select public.has_permission('launch.view')) or (select public.has_permission('launch.admin')))
  );
create policy creative_campaign_comments_insert on public.creative_campaign_comments
  for insert to authenticated with check (
    author_id = (select auth.uid()) and (select public.is_active_user()) and
    ((select public.has_permission('launch.edit')) or (select public.has_permission('launch.admin')))
  );
