-- Add 'threads' platform to all Creative Workspace platform CHECK constraints
do $$
declare
  rec record;
begin
  for rec in
    select con.conname, rel.relname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname in (
        'creative_tasks',
        'creative_ideas',
        'creative_channel_activations',
        'creative_accounts',
        'creative_copy_templates'
      )
      and con.contype = 'c'
      and (
        pg_get_constraintdef(con.oid) ilike '%platform%'
        or pg_get_constraintdef(con.oid) ilike '%additional_platforms%'
      )
  loop
    execute format('alter table public.%I drop constraint if exists %I', rec.relname, rec.conname);
  end loop;
end $$;

alter table public.creative_tasks
  add constraint creative_tasks_platform_check
    check (platform in ('instagram','threads','tiktok','youtube','facebook','whatsapp','marketplace','website','internal','other')),
  add constraint creative_tasks_additional_platforms_check
    check (
      not ('internal' = any(additional_platforms))
      and additional_platforms <@ array['instagram','threads','tiktok','youtube','facebook','whatsapp','marketplace','website','other']
    );

alter table public.creative_ideas
  add constraint creative_ideas_platform_check
    check (platform in ('instagram','threads','tiktok','youtube','facebook','whatsapp','marketplace','website','internal','other')),
  add constraint creative_ideas_additional_platforms_check
    check (
      not ('internal' = any(additional_platforms))
      and additional_platforms <@ array['instagram','threads','tiktok','youtube','facebook','whatsapp','marketplace','website','other']
    );

alter table public.creative_channel_activations
  add constraint creative_channel_activations_platform_check
    check (platform in ('marketplace','instagram','threads','tiktok','facebook','youtube','whatsapp','website','other'));

alter table public.creative_accounts
  add constraint creative_accounts_platform_check
    check (platform in ('instagram','threads','tiktok','youtube','facebook','whatsapp','marketplace','website','other'));

alter table public.creative_copy_templates
  add constraint creative_copy_templates_platform_check
    check (platform in ('instagram','threads','tiktok','youtube','facebook','whatsapp','marketplace','website','internal','other') or platform is null);
