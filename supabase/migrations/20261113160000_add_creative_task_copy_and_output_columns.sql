begin;

-- Add copy_template_id and output_type columns to public.creative_tasks
-- so both older cached clients and newer clients work seamlessly without PGRST204 schema cache errors.
alter table public.creative_tasks
  add column if not exists copy_template_id text,
  add column if not exists output_type text not null default 'video'
    check (output_type in ('post', 'image', 'carousel', 'video', 'story', 'live', 'other'));

-- Ensure deliverable and acceptance_criteria auto-fill sensible defaults when left blank
-- so creating or starting a task never fails if those optional fields are left empty in the UI.
create or replace function public.guard_creative_task_completion_requirements()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.requires_completion_evidence := new.source_activation_id is null;
  else
    new.requires_completion_evidence := old.requires_completion_evidence;
  end if;

  if btrim(coalesce(new.deliverable, '')) = '' then
    new.deliverable := coalesce(nullif(btrim(new.title), ''), 'Hasil produksi konten');
  end if;

  if btrim(coalesce(new.acceptance_criteria, '')) = '' then
    new.acceptance_criteria := 'Sesuai brief dan standar kualitas visual perusahaan';
  end if;

  if new.requires_completion_evidence and new.status in ('doing', 'review', 'ready', 'done') then
    if new.assignee_id is null or new.due_on is null then
      raise exception 'Isi PIC utama dan deadline pengerjaan sebelum mengubah status ke Dikerjakan / Review / Siap Tayang / Selesai.';
    end if;
    if new.status in ('review', 'ready', 'done') and btrim(new.completion_note) = ''
      and btrim(coalesce(new.output_url, '')) = ''
      and not exists (select 1 from public.creative_publications p where p.task_id = new.id) then
      raise exception 'Lampirkan tautan hasil atau isi catatan bukti sebelum melanjutkan ke Review / Siap Tayang / Selesai.';
    end if;
  end if;

  if new.status = 'done' and new.workstream <> 'operations' and new.source_activation_id is null
    and cardinality(new.additional_platforms) > 0
    and (tg_op = 'INSERT' or old.status is distinct from new.status)
    and exists (
      select 1 from unnest(array_prepend(new.platform, new.additional_platforms)) as required(platform)
      where not exists (
        select 1 from public.creative_publications p
        join public.creative_accounts account on account.id = p.account_id
        where p.task_id = new.id and account.platform = required.platform
      )
    ) then
    raise exception 'Catat bukti tayang untuk setiap platform sebelum menyelesaikan tugas.';
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';

commit;
