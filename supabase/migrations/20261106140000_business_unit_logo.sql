alter table public.business_units
  add column logo_url text not null default ''
  check (char_length(logo_url) <= 1024 and (logo_url = '' or logo_url ~* '^https://[^[:space:]]+$'));
