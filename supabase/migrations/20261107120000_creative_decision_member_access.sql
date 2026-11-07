begin;

create function public.guard_creative_decision_member_access()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  previous_reviewer uuid;
  previous_approver uuid;
  member_id uuid;
begin
  if tg_op = 'UPDATE' then
    previous_reviewer := old.reviewer_id;
    previous_approver := old.approver_id;
  end if;

  for member_id in
    select distinct candidate.id
    from (values (new.reviewer_id, previous_reviewer), (new.approver_id, previous_approver)) candidate(id, previous_id)
    where candidate.id is not null and candidate.id is distinct from candidate.previous_id
  loop
    if not exists (
      select 1
      from public.profiles p
      join public.user_roles ur on ur.user_id = p.id
      join public.role_permissions rp on rp.role_id = ur.role_id
      join public.permissions perm on perm.id = rp.permission_id
      where p.id = member_id and p.is_active
      group by p.id
      having bool_or(perm.code = 'launch.admin')
        or (bool_or(perm.code = 'creative.view') and bool_or(perm.code = 'creative.edit'))
    ) then
      raise exception 'Reviewer dan pemberi persetujuan harus memiliki akses edit Creative.' using errcode = '42501';
    end if;
  end loop;
  return new;
end;
$$;

revoke all on function public.guard_creative_decision_member_access() from public, anon, authenticated;

create trigger creative_decision_member_access
before insert or update of reviewer_id, approver_id on public.creative_tasks
for each row execute function public.guard_creative_decision_member_access();

commit;
