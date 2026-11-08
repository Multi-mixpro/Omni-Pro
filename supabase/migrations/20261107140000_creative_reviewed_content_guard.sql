begin;

create function public.guard_creative_reviewed_content()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.status in ('ready','done') and new.status in ('ready','done')
    and (old.reviewed_at is not null or old.approved_at is not null)
    and row(new.title,new.brief,new.creative_brief,new.deliverable,new.acceptance_criteria,
      new.platform,new.additional_platforms,new.format,new.output_url)
      is distinct from
      row(old.title,old.brief,old.creative_brief,old.deliverable,old.acceptance_criteria,
      old.platform,old.additional_platforms,old.format,old.output_url)
  then
    raise exception 'Kembalikan status ke Dikerjakan sebelum mengubah hasil atau brief yang sudah disetujui.';
  end if;
  return new;
end;
$$;

create trigger creative_task_reviewed_content_guard
before update of title,brief,creative_brief,deliverable,acceptance_criteria,
  platform,additional_platforms,format,output_url on public.creative_tasks
for each row execute function public.guard_creative_reviewed_content();

commit;
