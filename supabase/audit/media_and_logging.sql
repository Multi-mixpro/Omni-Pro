-- Read-only. Run once per project in Supabase SQL Editor.
-- The report returns counts and sizes only; no photo data or credentials.
with sources as (
  select 'media_assets.secure_url' as source, secure_url as value from public.media_assets
  union all select 'launch_projects.reference_image_url', reference_image_url from public.launch_projects
  union all select 'launch_references.image_url', image_url from public.launch_references
  union all
    select 'paten_records.article.payload', item #>> '{}'
    from public.paten_records r
    cross join lateral jsonb_path_query(r.payload,
      'strict $.** ? (@.type() == "string" && @ like_regex "^[[:space:]]*(data:|https?://)" flag "i")') as j(item)
    where r.record_type = 'article' and not r.is_deleted
), classified as (
  select source, value, case
    when trim(value) ~* '^data:[^,]*;base64,' then 'Base64'
    when trim(value) ~* '^data:' then 'Data inline lain'
    when trim(value) ~* '^https://res\.cloudinary\.com/' then 'Cloudinary'
    else 'URL/nilai lain'
  end as storage
  from sources where value is not null and trim(value) <> ''
)
select source, storage, count(*) as reference_count, sum(octet_length(value)) as stored_text_bytes
from classified group by source, storage order by source, storage;

select name, setting, unit, source
from pg_settings
where name in ('log_statement','log_min_duration_statement','log_connections','log_disconnections','log_min_messages','pgaudit.log')
order by name;
