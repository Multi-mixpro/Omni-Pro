-- Product Launch brief builder: multi-reference media, variants, sizing,
-- preliminary costing, and supplier/material preparation in one atomic command.

begin;

alter table public.launch_references
  add column if not exists media_asset_id uuid references public.media_assets(id) on delete set null,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_primary boolean not null default false;

create unique index if not exists launch_references_one_primary
  on public.launch_references(project_id) where is_primary;

alter table public.launch_material_candidates
  add column if not exists composition text,
  add column if not exists gsm numeric(10,2),
  add column if not exists width_cm numeric(10,2),
  add column if not exists color_notes text;

alter table public.launch_supplier_quotes
  add column if not exists supplier_role text not null default 'ALTERNATIVE'
    check (supplier_role in ('PRIMARY','ALTERNATIVE'));

create or replace function public.create_launch_project(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_owner uuid := public.role_user('owner', auth.uid());
  v_product uuid := public.role_user('product_lead', auth.uid());
  v_sourcing uuid := public.role_user('sourcing_lead', auth.uid());
  v_production uuid := public.role_user('production_qc', auth.uid());
  v_item jsonb;
  v_supplier_id uuid;
  v_candidate_id uuid;
  v_hpp_id uuid;
  v_size_chart_id uuid;
  v_sizes text[];
  v_reference_type text;
  v_material_role text;
  v_hpp_category text;
begin
  if not public.has_permission('launch.create') then
    raise exception 'Akses membuat artikel ditolak';
  end if;
  if nullif(trim(p_payload->>'article_name'),'') is null then
    raise exception 'Nama artikel wajib diisi';
  end if;
  if nullif(trim(p_payload->>'business_unit_id'),'') is null then
    raise exception 'Unit bisnis wajib diisi';
  end if;
  if nullif(trim(p_payload->>'category'),'') is null then
    raise exception 'Kategori wajib diisi';
  end if;

  insert into public.launch_projects(
    code, business_unit_id, owner_id, article_name, category, concept,
    source_notes, priority, target_date, created_by
  ) values (
    public.generate_launch_code(),
    (p_payload->>'business_unit_id')::uuid,
    v_owner,
    trim(p_payload->>'article_name'),
    trim(p_payload->>'category'),
    nullif(trim(p_payload->>'concept'),''),
    nullif(trim(p_payload->>'source_notes'),''),
    coalesce(nullif(p_payload->>'priority',''),'NORMAL'),
    nullif(p_payload->>'target_date','')::date,
    auth.uid()
  ) returning id into v_project_id;

  insert into public.launch_project_members(project_id, user_id, responsibility)
  select v_project_id, id, job_title from public.profiles where is_active;

  insert into public.launch_stage_runs(project_id, code, name, position, status, owner_id, due_date) values
    (v_project_id,'BRIEF','Brief & arahan',1,'IN_PROGRESS',v_owner,current_date),
    (v_project_id,'RESEARCH','Riset artikel',2,'NOT_STARTED',v_product,current_date + 3),
    (v_project_id,'SOURCING','Bahan & supplier',3,'NOT_STARTED',v_sourcing,current_date + 7),
    (v_project_id,'SAMPLING','Sampling',4,'NOT_STARTED',v_production,current_date + 14),
    (v_project_id,'COSTING','HPP & harga',5,'NOT_STARTED',v_product,current_date + 17),
    (v_project_id,'SPECIFICATION','Warna & size chart',6,'NOT_STARTED',v_production,current_date + 20),
    (v_project_id,'QC','Quality control',7,'NOT_STARTED',v_production,current_date + 24),
    (v_project_id,'OWNER_APPROVAL','Approval owner',8,'NOT_STARTED',v_owner,current_date + 25),
    (v_project_id,'PRODUCTION_READY','Siap produksi',9,'NOT_STARTED',v_owner,current_date + 26);

  insert into public.launch_tasks(project_id, stage_code, title, status, priority, assignee_id, due_date, created_by) values
    (v_project_id,'BRIEF','Validasi arahan dan hasil yang diharapkan','TODO','HIGH',v_owner,current_date,auth.uid()),
    (v_project_id,'RESEARCH','Pelajari seluruh gambar, link, dan insight referensi','TODO','HIGH',v_product,current_date + 3,auth.uid()),
    (v_project_id,'SOURCING','Validasi bahan, supplier utama/alternatif, MOQ, dan lead time','TODO','HIGH',v_sourcing,current_date + 7,auth.uid()),
    (v_project_id,'SAMPLING','Buat dan dokumentasikan sample pertama','TODO','HIGH',v_production,current_date + 14,auth.uid()),
    (v_project_id,'COSTING','Lengkapi draft HPP dan harga rekomendasi','TODO','HIGH',v_product,current_date + 17,auth.uid()),
    (v_project_id,'SPECIFICATION','Validasi warna, ukuran, dan chart size','TODO','NORMAL',v_production,current_date + 20,auth.uid()),
    (v_project_id,'QC','Jalankan QC pada master sample','TODO','HIGH',v_production,current_date + 24,auth.uid()),
    (v_project_id,'OWNER_APPROVAL','Berikan keputusan produksi massal','TODO','HIGH',v_owner,current_date + 25,auth.uid());

  -- URL images and learning links. Local images are attached by the client
  -- after Cloudinary upload because their bytes cannot be part of this RPC.
  for v_item in select value from jsonb_array_elements(coalesce(p_payload->'references','[]'::jsonb))
  loop
    v_reference_type := case
      when upper(coalesce(v_item->>'reference_type','PRODUCT')) in ('PRODUCT','MATERIAL','PRICE','CONSTRUCTION','MARKET','OTHER')
        then upper(coalesce(v_item->>'reference_type','PRODUCT'))
      else 'OTHER'
    end;
    if nullif(trim(coalesce(v_item->>'source_url','')),'') is not null
       or nullif(trim(coalesce(v_item->>'image_url','')),'') is not null then
      insert into public.launch_references(
        project_id, title, reference_type, source_url, image_url, insight,
        sort_order, is_primary, created_by
      ) values (
        v_project_id,
        coalesce(nullif(trim(v_item->>'title'),''),'Referensi artikel'),
        v_reference_type,
        nullif(trim(v_item->>'source_url'),''),
        nullif(trim(v_item->>'image_url'),''),
        nullif(trim(v_item->>'insight'),''),
        coalesce(nullif(v_item->>'sort_order','')::integer,0),
        coalesce((v_item->>'is_primary')::boolean,false),
        auth.uid()
      );
    end if;
  end loop;

  update public.launch_projects p
  set reference_image_url = r.image_url
  from (
    select image_url from public.launch_references
    where project_id = v_project_id and image_url is not null
    order by is_primary desc, sort_order, created_at
    limit 1
  ) r
  where p.id = v_project_id;

  for v_item in select value from jsonb_array_elements(coalesce(p_payload->'colorways','[]'::jsonb))
  loop
    if nullif(trim(coalesce(v_item->>'name','')),'') is not null then
      insert into public.launch_colorways(project_id, name, color_code, hex_code, panel_notes, status, created_by)
      values (
        v_project_id,
        trim(v_item->>'name'),
        nullif(trim(v_item->>'color_code'),''),
        nullif(trim(v_item->>'hex_code'),''),
        nullif(trim(v_item->>'panel_notes'),''),
        'CANDIDATE',
        auth.uid()
      ) on conflict (project_id, name) do nothing;
    end if;
  end loop;

  -- Materials remain project candidates until the team approves them. Supplier
  -- contacts are reused from the shared supplier master when names match.
  for v_item in select value from jsonb_array_elements(coalesce(p_payload->'materials','[]'::jsonb))
  loop
    if nullif(trim(coalesce(v_item->>'proposed_name','')),'') is null then continue; end if;
    v_material_role := case when upper(coalesce(v_item->>'role','MAIN')) in ('MAIN','LINING','RIB','ACCESSORY','PACKAGING','OTHER')
      then upper(coalesce(v_item->>'role','MAIN')) else 'OTHER' end;

    insert into public.launch_material_candidates(
      project_id, proposed_name, role, estimated_consumption, unit,
      suitability_notes, risk_notes, composition, gsm, width_cm, color_notes,
      status, created_by
    ) values (
      v_project_id,
      trim(v_item->>'proposed_name'),
      v_material_role,
      nullif(v_item->>'estimated_consumption','')::numeric,
      coalesce(nullif(trim(v_item->>'unit'),''),'meter'),
      nullif(trim(v_item->>'suitability_notes'),''),
      nullif(trim(v_item->>'risk_notes'),''),
      nullif(trim(v_item->>'composition'),''),
      nullif(v_item->>'gsm','')::numeric,
      nullif(v_item->>'width_cm','')::numeric,
      nullif(trim(v_item->>'color_notes'),''),
      'CANDIDATE',
      auth.uid()
    ) returning id into v_candidate_id;

    v_supplier_id := null;
    if nullif(trim(coalesce(v_item->>'supplier_name','')),'') is not null then
      select id into v_supplier_id from public.suppliers
      where lower(trim(name)) = lower(trim(v_item->>'supplier_name'))
      order by created_at limit 1;

      if v_supplier_id is null then
        insert into public.suppliers(
          name, category, contact_name, phone, city, address, lead_time_days,
          minimum_order_notes, quality_notes, created_by
        ) values (
          trim(v_item->>'supplier_name'),
          v_material_role,
          nullif(trim(v_item->>'contact_name'),''),
          nullif(trim(v_item->>'phone'),''),
          nullif(trim(v_item->>'city'),''),
          nullif(trim(v_item->>'address'),''),
          nullif(v_item->>'lead_time_days','')::integer,
          nullif(trim(v_item->>'moq_notes'),''),
          nullif(trim(v_item->>'supplier_notes'),''),
          auth.uid()
        ) returning id into v_supplier_id;
      end if;

      insert into public.launch_supplier_quotes(
        project_id, supplier_id, material_candidate_id, item_name, price,
        unit, moq, lead_time_days, notes, status, supplier_role, created_by
      ) values (
        v_project_id,
        v_supplier_id,
        v_candidate_id,
        trim(v_item->>'proposed_name'),
        coalesce(nullif(v_item->>'unit_price','')::numeric,0),
        coalesce(nullif(trim(v_item->>'unit'),''),'meter'),
        nullif(v_item->>'moq','')::numeric,
        nullif(v_item->>'lead_time_days','')::integer,
        nullif(trim(v_item->>'supplier_notes'),''),
        'CANDIDATE',
        case when upper(coalesce(v_item->>'supplier_role','ALTERNATIVE')) = 'PRIMARY' then 'PRIMARY' else 'ALTERNATIVE' end,
        auth.uid()
      );
    end if;
  end loop;

  select coalesce(array_agg(value), '{}'::text[]) into v_sizes
  from jsonb_array_elements_text(coalesce(p_payload->'sizes','[]'::jsonb));
  if cardinality(v_sizes) > 0 then
    insert into public.launch_size_charts(project_id, name, version, unit, sizes, status, notes, created_by)
    values (
      v_project_id,
      coalesce(nullif(trim(p_payload->>'size_chart_name'),''),'Draft chart size'),
      1,
      coalesce(nullif(trim(p_payload->>'size_unit'),''),'cm'),
      v_sizes,
      'DRAFT',
      'Draft awal dari brief owner; wajib divalidasi tim sampling.',
      auth.uid()
    ) returning id into v_size_chart_id;

    for v_item in select value from jsonb_array_elements(coalesce(p_payload->'measurements','[]'::jsonb))
    loop
      if nullif(trim(coalesce(v_item->>'point_name','')),'') is not null then
        insert into public.launch_size_chart_measurements(
          size_chart_id, point_code, point_name, position,
          tolerance_plus, tolerance_minus, values
        ) values (
          v_size_chart_id,
          coalesce(nullif(trim(v_item->>'point_code'),''),'P' || lpad(coalesce(v_item->>'position','1'),2,'0')),
          trim(v_item->>'point_name'),
          coalesce(nullif(v_item->>'position','')::integer,1),
          coalesce(nullif(v_item->>'tolerance_plus','')::numeric,0),
          coalesce(nullif(v_item->>'tolerance_minus','')::numeric,0),
          coalesce(v_item->'values','{}'::jsonb)
        ) on conflict (size_chart_id, point_code) do nothing;
      end if;
    end loop;
  end if;

  if jsonb_array_length(coalesce(p_payload->'hpp_lines','[]'::jsonb)) > 0
     or nullif(p_payload->>'target_margin_percent','') is not null then
    insert into public.launch_hpp_versions(
      project_id, version, status, target_margin_percent, notes, created_by
    ) values (
      v_project_id, 1, 'DRAFT',
      nullif(p_payload->>'target_margin_percent','')::numeric,
      'Draft awal dari brief; harga wajib divalidasi tim costing.',
      auth.uid()
    ) returning id into v_hpp_id;

    for v_item in select value from jsonb_array_elements(coalesce(p_payload->'hpp_lines','[]'::jsonb))
    loop
      if nullif(trim(coalesce(v_item->>'item_name','')),'') is null then continue; end if;
      v_hpp_category := case when upper(coalesce(v_item->>'category','OTHER')) in
        ('MATERIAL','ACCESSORY','LABOR','PRINTING','EMBROIDERY','PACKAGING','OVERHEAD','OTHER')
        then upper(coalesce(v_item->>'category','OTHER')) else 'OTHER' end;
      insert into public.launch_hpp_lines(
        hpp_version_id, category, item_name, quantity, unit,
        unit_price, waste_percent, notes
      ) values (
        v_hpp_id,
        v_hpp_category,
        trim(v_item->>'item_name'),
        coalesce(nullif(v_item->>'quantity','')::numeric,1),
        coalesce(nullif(trim(v_item->>'unit'),''),'pcs'),
        coalesce(nullif(v_item->>'unit_price','')::numeric,0),
        coalesce(nullif(v_item->>'waste_percent','')::numeric,0),
        nullif(trim(v_item->>'notes'),'')
      );
    end loop;
  end if;

  insert into public.launch_activity(project_id, actor_id, event_type, message, metadata)
  values (
    v_project_id,
    auth.uid(),
    'PROJECT_CREATED',
    'membuat brief artikel lengkap dan membuka ruang kerja.',
    jsonb_build_object(
      'references', jsonb_array_length(coalesce(p_payload->'references','[]'::jsonb)),
      'colors', jsonb_array_length(coalesce(p_payload->'colorways','[]'::jsonb)),
      'materials', jsonb_array_length(coalesce(p_payload->'materials','[]'::jsonb)),
      'sizes', jsonb_array_length(coalesce(p_payload->'sizes','[]'::jsonb)),
      'hpp_lines', jsonb_array_length(coalesce(p_payload->'hpp_lines','[]'::jsonb))
    )
  );

  return v_project_id;
end;
$$;

grant execute on function public.create_launch_project(jsonb) to authenticated;

comment on column public.launch_references.is_primary is 'Marks the reference used as the project cover image.';
comment on column public.launch_supplier_quotes.supplier_role is 'Owner brief preference only; selection still requires sourcing validation.';

commit;
