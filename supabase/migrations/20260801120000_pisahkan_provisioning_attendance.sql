-- Pisahkan provisioning Product Launch dari pengguna Attendance
--
-- Masalah:
-- Trigger on_auth_user_created_product_launch memanggil provision_auth_user()
-- untuk SETIAP akun auth baru, dan fungsi itu selalu membuat profil serta
-- memberi role Product Launch. Akibatnya akun yang dibuat khusus untuk sistem
-- Attendance tetap memperoleh akses Product Launch OS — bertentangan dengan
-- pemisahan pengguna antar sistem.
--
-- Perbaikan:
-- provision_auth_user() berhenti lebih awal bila akun ditandai sebagai pengguna
-- Attendance (raw_user_meta_data->>'system' = 'attendance'). Perilaku
-- pendaftaran Product Launch yang sudah ada tidak berubah sama sekali.

CREATE OR REPLACE FUNCTION public.provision_auth_user(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_auth auth.users%rowtype;
  v_invite public.team_invites%rowtype;
  v_has_invite boolean := false;
  v_base_username text;
  v_username text;
  v_full_name text;
  v_job_title text;
  v_role_code text;
  v_role_id uuid;
begin
  select * into v_auth
  from auth.users
  where id = p_user_id;

  if not found then
    raise exception 'Auth user % tidak ditemukan', p_user_id;
  end if;

  -- Akun milik sistem Attendance tidak di-provision ke Product Launch.
  -- Aksesnya diatur lewat public.attendance_memberships.
  if lower(coalesce(v_auth.raw_user_meta_data->>'system', '')) = 'attendance' then
    return;
  end if;

  select * into v_invite
  from public.team_invites
  where lower(trim(email)) = lower(trim(v_auth.email))
    and user_id is null
  order by created_at desc
  limit 1;
  v_has_invite := found;

  v_full_name := coalesce(
    case when v_has_invite then nullif(trim(v_invite.full_name), '') end,
    nullif(trim(v_auth.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(v_auth.raw_user_meta_data->>'name'), ''),
    nullif(initcap(replace(replace(split_part(coalesce(v_auth.email, ''), '@', 1), '.', ' '), '_', ' ')), ''),
    'Anggota Tim'
  );

  v_job_title := coalesce(
    case when v_has_invite then nullif(trim(v_invite.job_title), '') end,
    nullif(trim(v_auth.raw_user_meta_data->>'job_title'), '')
  );

  v_base_username := lower(regexp_replace(
    coalesce(
      case when v_has_invite then nullif(trim(v_invite.username), '') end,
      nullif(trim(v_auth.raw_user_meta_data->>'username'), ''),
      nullif(split_part(coalesce(v_auth.email, ''), '@', 1), ''),
      'anggota-' || left(replace(v_auth.id::text, '-', ''), 8)
    ),
    '[^a-zA-Z0-9._-]',
    '',
    'g'
  ));
  v_base_username := regexp_replace(v_base_username, '^[-._]+|[-._]+$', '', 'g');

  if length(v_base_username) < 3 then
    v_base_username := 'user-' || left(replace(v_auth.id::text, '-', ''), 8);
  end if;

  v_base_username := left(v_base_username, 40);
  v_username := v_base_username;

  if exists (
    select 1 from public.profiles
    where username = v_username and id <> v_auth.id
  ) then
    v_username := left(v_base_username, 31) || '-' || left(replace(v_auth.id::text, '-', ''), 8);
  end if;

  if v_has_invite then
    v_role_code := v_invite.role_code;
  else
    select code into v_role_code
    from public.roles
    where code = lower(nullif(trim(v_auth.raw_app_meta_data->>'app_role'), ''));
  end if;

  v_role_code := coalesce(nullif(trim(v_role_code), ''), 'product_team');

  select id into v_role_id
  from public.roles
  where code = v_role_code;

  if v_role_id is null then
    select id into v_role_id
    from public.roles
    where code = 'product_team';
  end if;

  insert into public.profiles (id, username, full_name, job_title)
  values (v_auth.id, v_username, v_full_name, v_job_title)
  on conflict (id) do update
    set username = excluded.username,
        full_name = excluded.full_name,
        job_title = coalesce(excluded.job_title, public.profiles.job_title);

  if v_role_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (v_auth.id, v_role_id)
    on conflict do nothing;
  end if;

  if v_has_invite then
    update public.team_invites
    set user_id = v_auth.id,
        accepted_at = now()
    where id = v_invite.id;
  end if;
end;
$function$;
