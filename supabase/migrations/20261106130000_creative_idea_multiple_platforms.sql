begin;

alter table public.creative_ideas
  add column additional_platforms text[] not null default '{}',
  add constraint creative_ideas_additional_platforms_check check (
    array_position(additional_platforms, null) is null
    and additional_platforms <@ array['instagram','tiktok','youtube','facebook','whatsapp','marketplace','website','other']
    and not platform = any(additional_platforms)
    and (platform <> 'internal' or cardinality(additional_platforms) = 0)
  );

commit;
