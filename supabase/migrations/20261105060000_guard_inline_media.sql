-- Preserve existing assets. Validate only new URLs and newly introduced inline data.
create function public.guard_workspace_media_urls() returns trigger
language plpgsql set search_path = '' as $$
declare value text; prior_value text;
begin
  if tg_table_name = 'media_assets' then
    value := new.secure_url;
    if tg_op = 'UPDATE' then prior_value := old.secure_url; end if;
    if value is distinct from prior_value and value !~ '^https://res\.cloudinary\.com/[^/]+/(image|video|raw)/upload/.+' then
      raise exception 'Media baru wajib menggunakan URL Cloudinary.';
    end if;
  elsif tg_table_name = 'launch_projects' then
    value := new.reference_image_url;
    if tg_op = 'UPDATE' then prior_value := old.reference_image_url; end if;
  else
    value := new.image_url;
    if tg_op = 'UPDATE' then prior_value := old.image_url; end if;
  end if;
  if value is distinct from prior_value and trim(value) ~* '^data:' then
    raise exception 'Jangan simpan data gambar inline. Unggah ke Cloudinary.';
  end if;
  return new;
end;
$$;

create trigger guard_asset_url before insert or update of secure_url on public.media_assets
for each row execute function public.guard_workspace_media_urls();
create trigger guard_project_photo before insert or update of reference_image_url on public.launch_projects
for each row execute function public.guard_workspace_media_urls();
create trigger guard_reference_photo before insert or update of image_url on public.launch_references
for each row execute function public.guard_workspace_media_urls();

create function public.guard_paten_inline_media() returns trigger
language plpgsql set search_path = '' as $$
declare
  prior_payload jsonb := '{}'::jsonb;
  inline_path jsonpath := 'strict $.** ? (@.type() == "string" && @ like_regex "^[[:space:]]*data:" flag "i")';
begin
  if new.record_type <> 'article' then return new; end if;
  if tg_op = 'UPDATE' then prior_payload := old.payload; end if;
  if not jsonb_path_exists(new.payload, inline_path) then return new; end if;
  if exists (
    select jsonb_path_query(new.payload, inline_path)
    except select jsonb_path_query(prior_payload, inline_path)
  ) then
    raise exception 'Jangan simpan data gambar inline di artikel. Unggah ke Cloudinary.';
  end if;
  return new;
end;
$$;
create trigger guard_article_payload_media before insert or update of payload on public.paten_records
for each row execute function public.guard_paten_inline_media();
