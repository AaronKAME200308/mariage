-- =====================================================================
-- MariamCM — Migration 3 : fonctions RPC
--  * Lecture publique d'un site publié (aucun accès direct aux tables)
--  * RSVP, livre d'or, contact (validation + limitation de débit)
--  * Contrôle d'accès atomique (QR code) + gestion des jetons
-- Toutes sont SECURITY DEFINER avec search_path vide et revalident
-- l'identité et les permissions de l'appelant à l'intérieur.
-- =====================================================================

create or replace function public.normalize_name(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')));
$$;

-- ---------- Lecture publique d'un site de mariage -----------------------------------------------
create or replace function public.get_public_wedding(p_slug text, p_preview boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_w public.weddings;
begin
  select * into v_w from public.weddings where slug = lower(btrim(p_slug));
  if not found then
    return null;
  end if;

  -- Inconnu et non publié se confondent volontairement (pas de fuite d'existence).
  -- L'aperçu est réservé à ceux qui gèrent le mariage.
  if v_w.status <> 'published'
     and not (coalesce(p_preview, false) and public.can_manage_wedding(v_w.id)) then
    return null;
  end if;

  return jsonb_build_object(
    'wedding', jsonb_build_object(
      'id', v_w.id,
      'slug', v_w.slug,
      'partner_one_name', v_w.partner_one_name,
      'partner_two_name', v_w.partner_two_name,
      'wedding_date', v_w.wedding_date,
      'timezone', v_w.timezone,
      'status', v_w.status,
      'theme', v_w.theme,
      'content', v_w.content,
      'settings', v_w.settings,
      'hero_image_path', v_w.hero_image_path,
      'music_path', v_w.music_path
    ),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id, 'kind', e.kind, 'title', e.title, 'starts_at', e.starts_at,
        'ends_at', e.ends_at, 'venue_name', e.venue_name, 'address', e.address,
        'description', e.description, 'map_url', e.map_url, 'dress_code', e.dress_code
      ) order by e.sort_order, e.starts_at)
      from public.wedding_events e where e.wedding_id = v_w.id
    ), '[]'::jsonb),
    'milestones', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'title', m.title, 'description', m.description,
        'happened_on', m.happened_on, 'image_path', m.image_path
      ) order by m.sort_order, m.happened_on)
      from public.story_milestones m where m.wedding_id = v_w.id
    ), '[]'::jsonb),
    'gallery', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'storage_path', g.storage_path, 'caption', g.caption,
        'width', g.width, 'height', g.height
      ) order by g.sort_order, g.created_at)
      from public.gallery_images g where g.wedding_id = v_w.id
    ), '[]'::jsonb),
    'gifts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id, 'name', f.name, 'description', f.description,
        'image_path', f.image_path, 'suggested_amount', f.suggested_amount,
        'currency', f.currency, 'external_url', f.external_url, 'status', f.status
      ) order by f.sort_order, f.created_at)
      from public.gifts f where f.wedding_id = v_w.id
    ), '[]'::jsonb),
    'guestbook', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id, 'author_name', b.author_name, 'message', b.message, 'created_at', b.created_at
      ) order by b.created_at desc)
      from public.guestbook_messages b
      where b.wedding_id = v_w.id and b.status = 'approved'
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------- RSVP public ---------------------------------------------------------------------------
-- Codes de retour : ok, wedding_not_found, rsvp_closed, invalid_input, rate_limited,
-- guest_not_found (volontairement identique pour "inconnu" et "coordonnées différentes"),
-- companions_exceeded, table_full, rsvp_locked, duplicate
create or replace function public.submit_rsvp(
  p_slug text,
  p_full_name text,
  p_status public.rsvp_status,
  p_companions integer default 0,
  p_phone text default null,
  p_email text default null,
  p_message text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_w public.weddings;
  v_g public.guests;
  v_rsvp jsonb;
  v_deadline timestamptz;
  v_name text := btrim(coalesce(p_full_name, ''));
  v_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), '');
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_companions integer := coalesce(p_companions, 0);
  v_unlisted_max integer;
begin
  select * into v_w from public.weddings where slug = lower(btrim(p_slug)) and status = 'published';
  if not found then
    return jsonb_build_object('ok', false, 'code', 'wedding_not_found');
  end if;

  v_rsvp := coalesce(v_w.settings -> 'rsvp', '{}'::jsonb);
  if coalesce((v_rsvp ->> 'enabled')::boolean, true) is not true then
    return jsonb_build_object('ok', false, 'code', 'rsvp_closed');
  end if;
  v_deadline := nullif(v_rsvp ->> 'deadline', '')::timestamptz;
  if v_deadline is not null and now() > v_deadline then
    return jsonb_build_object('ok', false, 'code', 'rsvp_closed');
  end if;

  if char_length(v_name) not between 2 and 120
     or p_status not in ('confirmed', 'declined')
     or v_companions not between 0 and 20
     or (p_message is not null and char_length(p_message) > 1000)
     or (v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'))
     or (v_phone is not null and char_length(v_phone) > 20) then
    return jsonb_build_object('ok', false, 'code', 'invalid_input');
  end if;

  -- Limitation de débit par mariage (anti-abus). Complétez par un captcha côté Supabase Auth/Edge si besoin.
  if (select count(*) from public.rsvp_responses
      where wedding_id = v_w.id and created_at > now() - interval '1 minute') >= 30 then
    return jsonb_build_object('ok', false, 'code', 'rate_limited');
  end if;

  select * into v_g from public.guests
  where wedding_id = v_w.id and public.normalize_name(full_name) = public.normalize_name(v_name)
  for update;

  if found then
    -- Si des coordonnées existent pour cet invité, l'une d'elles doit correspondre.
    if v_g.phone is not null or v_g.email is not null then
      if not (
        (v_phone is not null and regexp_replace(coalesce(v_g.phone, ''), '\D', '', 'g') = v_phone)
        or (v_email is not null and lower(coalesce(v_g.email, '')) = v_email)
      ) then
        return jsonb_build_object('ok', false, 'code', 'guest_not_found');
      end if;
    end if;

    if v_g.arrived_count > 0 then
      return jsonb_build_object('ok', false, 'code', 'rsvp_locked');
    end if;

    if p_status = 'confirmed' and v_companions > v_g.allowed_companions then
      return jsonb_build_object('ok', false, 'code', 'companions_exceeded',
                                'allowed_companions', v_g.allowed_companions);
    end if;

    begin
      update public.guests
      set rsvp_status = p_status,
          confirmed_companions = case when p_status = 'confirmed' then v_companions else 0 end,
          rsvp_message = nullif(btrim(coalesce(p_message, '')), ''),
          rsvp_responded_at = now(),
          phone = coalesce(phone, nullif(p_phone, '')),
          email = coalesce(email, v_email)
      where id = v_g.id;
    exception when raise_exception then
      if sqlerrm = 'table_capacity_exceeded' then
        return jsonb_build_object('ok', false, 'code', 'table_full');
      end if;
      raise;
    end;
  else
    -- Invité non listé : accepté seulement si le couple l'a explicitement autorisé.
    if coalesce((v_rsvp ->> 'allow_unlisted')::boolean, false) is not true then
      return jsonb_build_object('ok', false, 'code', 'guest_not_found');
    end if;
    v_unlisted_max := least(greatest(coalesce((v_rsvp ->> 'max_companions_unlisted')::integer, 0), 0), 20);
    if p_status = 'confirmed' and v_companions > v_unlisted_max then
      return jsonb_build_object('ok', false, 'code', 'companions_exceeded',
                                'allowed_companions', v_unlisted_max);
    end if;
    begin
      insert into public.guests (
        wedding_id, full_name, phone, email, rsvp_status, allowed_companions,
        confirmed_companions, rsvp_message, rsvp_responded_at
      ) values (
        v_w.id, v_name, nullif(p_phone, ''), v_email, p_status, v_unlisted_max,
        case when p_status = 'confirmed' then v_companions else 0 end,
        nullif(btrim(coalesce(p_message, '')), ''), now()
      ) returning * into v_g;
    exception when unique_violation then
      return jsonb_build_object('ok', false, 'code', 'duplicate');
    end;
  end if;

  insert into public.rsvp_responses (wedding_id, guest_id, submitted_name, status, companions, message)
  values (v_w.id, v_g.id, v_name, p_status,
          case when p_status = 'confirmed' then v_companions else 0 end,
          nullif(btrim(coalesce(p_message, '')), ''));

  return jsonb_build_object('ok', true, 'code', 'ok', 'status', p_status,
                            'guest_name', v_g.full_name);
end;
$$;

-- ---------- Livre d'or -------------------------------------------------------------------------------
create or replace function public.submit_guestbook_message(
  p_slug text, p_author_name text, p_message text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_w public.weddings;
  v_cfg jsonb;
  v_author text := btrim(coalesce(p_author_name, ''));
  v_msg text := btrim(coalesce(p_message, ''));
begin
  select * into v_w from public.weddings where slug = lower(btrim(p_slug)) and status = 'published';
  if not found then
    return jsonb_build_object('ok', false, 'code', 'wedding_not_found');
  end if;

  v_cfg := coalesce(v_w.settings -> 'guestbook', '{}'::jsonb);
  if coalesce((v_cfg ->> 'enabled')::boolean, true) is not true then
    return jsonb_build_object('ok', false, 'code', 'guestbook_closed');
  end if;

  if char_length(v_author) not between 1 and 80 or char_length(v_msg) not between 1 and 1000 then
    return jsonb_build_object('ok', false, 'code', 'invalid_input');
  end if;

  if (select count(*) from public.guestbook_messages
      where wedding_id = v_w.id and created_at > now() - interval '1 minute') >= 10 then
    return jsonb_build_object('ok', false, 'code', 'rate_limited');
  end if;

  -- Modération obligatoire par défaut ; l'approbation automatique doit être activée explicitement.
  insert into public.guestbook_messages (wedding_id, author_name, message, status)
  values (v_w.id, v_author, v_msg,
          case when coalesce((v_cfg ->> 'auto_approve')::boolean, false) then 'approved' else 'pending' end::public.moderation_status);

  return jsonb_build_object('ok', true, 'code', 'ok');
end;
$$;

-- ---------- Formulaire de contact de la plateforme ------------------------------------------------
create or replace function public.submit_contact_message(
  p_name text, p_email text, p_message text, p_subject text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_msg text := btrim(coalesce(p_message, ''));
  v_subject text := nullif(btrim(coalesce(p_subject, '')), '');
begin
  if char_length(v_name) not between 1 and 120
     or char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
     or char_length(v_msg) not between 5 and 3000
     or (v_subject is not null and char_length(v_subject) > 160) then
    return jsonb_build_object('ok', false, 'code', 'invalid_input');
  end if;

  if (select count(*) from public.contact_messages
      where created_at > now() - interval '1 minute') >= 20 then
    return jsonb_build_object('ok', false, 'code', 'rate_limited');
  end if;

  insert into public.contact_messages (name, email, subject, message)
  values (v_name, v_email, v_subject, v_msg);
  return jsonb_build_object('ok', true, 'code', 'ok');
end;
$$;

-- =====================================================================
-- Contrôle d'accès
-- =====================================================================

-- Cœur transactionnel (non exposé). Le verrou FOR UPDATE sur la ligne de l'invité
-- sérialise les scans concurrents : le second attend, puis voit arrived_count > 0.
create or replace function public.internal_check_in(
  p_wedding_id uuid, p_guest_id uuid, p_party_size integer, p_method text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.wedding_status;
  v_g public.guests;
  v_table text;
  v_max integer;
  v_party integer;
  v_now timestamptz := now();
begin
  select status into v_status from public.weddings where id = p_wedding_id;
  if v_status is null or v_status = 'archived' then
    return jsonb_build_object('ok', false, 'code', 'wedding_closed');
  end if;

  select * into v_g from public.guests
  where id = p_guest_id and wedding_id = p_wedding_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'unknown_guest');
  end if;

  select name into v_table from public.tables where id = v_g.table_id;
  v_max := 1 + v_g.allowed_companions;

  if v_g.rsvp_status = 'declined' then
    insert into public.check_ins (wedding_id, guest_id, hostess_id, result, method, party_size, checked_in_at)
    values (p_wedding_id, v_g.id, auth.uid(), 'rsvp_declined', p_method, 0, v_now);
    return jsonb_build_object('ok', false, 'code', 'rsvp_declined',
      'guest_name', v_g.full_name, 'table_name', v_table);
  end if;

  if v_g.arrived_count > 0 then
    insert into public.check_ins (wedding_id, guest_id, hostess_id, result, method, party_size, checked_in_at)
    values (p_wedding_id, v_g.id, auth.uid(), 'duplicate', p_method, 0, v_now);
    return jsonb_build_object('ok', false, 'code', 'already_checked_in',
      'guest_name', v_g.full_name, 'table_name', v_table,
      'allowed_party', v_max, 'arrived_count', v_g.arrived_count,
      'checked_in_at', v_g.arrived_at);
  end if;

  v_party := coalesce(
    p_party_size,
    1 + case when v_g.rsvp_status = 'confirmed' then v_g.confirmed_companions else v_g.allowed_companions end
  );
  if v_party < 1 or v_party > v_max then
    insert into public.check_ins (wedding_id, guest_id, hostess_id, result, method, party_size, checked_in_at)
    values (p_wedding_id, v_g.id, auth.uid(), 'invalid_party_size', p_method, 0, v_now);
    return jsonb_build_object('ok', false, 'code', 'party_size_exceeded',
      'guest_name', v_g.full_name, 'table_name', v_table, 'allowed_party', v_max);
  end if;

  perform set_config('app.check_in_rpc', 'on', true);
  update public.guests set arrived_count = v_party, arrived_at = v_now where id = v_g.id;
  perform set_config('app.check_in_rpc', 'off', true);

  begin
    insert into public.check_ins (wedding_id, guest_id, hostess_id, result, method, party_size, checked_in_at)
    values (p_wedding_id, v_g.id, auth.uid(), 'success', p_method, v_party, v_now);
  exception when unique_violation then
    -- Filet de sécurité : l'index unique a détecté un contrôle initial déjà réussi.
    raise exception 'already_checked_in' using errcode = 'P0001';
  end;

  return jsonb_build_object('ok', true, 'code', 'success',
    'guest_name', v_g.full_name, 'table_name', v_table,
    'allowed_party', v_max, 'party_size', v_party, 'arrived_count', v_party,
    'checked_in_at', v_now);
end;
$$;

-- Scan d'un QR code. p_wedding_id = mariage auquel l'hôtesse est rattachée.
create or replace function public.perform_check_in(
  p_wedding_id uuid, p_token text, p_party_size integer default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tok public.guest_qr_tokens;
  v_name text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'code', 'not_authenticated');
  end if;
  if not public.can_check_in(p_wedding_id) then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;

  if p_token is null or char_length(p_token) not between 48 and 200 then
    perform public.log_audit(p_wedding_id, 'check_in.unknown_token', 'wedding', p_wedding_id, '{}'::jsonb);
    return jsonb_build_object('ok', false, 'code', 'unknown_token');
  end if;

  select * into v_tok from public.guest_qr_tokens where token = p_token;
  if not found then
    perform public.log_audit(p_wedding_id, 'check_in.unknown_token', 'wedding', p_wedding_id, '{}'::jsonb);
    return jsonb_build_object('ok', false, 'code', 'unknown_token');
  end if;

  -- Code d'un autre mariage : refusé sans divulguer aucune information sur l'invité.
  if v_tok.wedding_id <> p_wedding_id then
    perform public.log_audit(p_wedding_id, 'check_in.wrong_wedding', 'wedding', p_wedding_id, '{}'::jsonb);
    return jsonb_build_object('ok', false, 'code', 'wrong_wedding');
  end if;

  if v_tok.status = 'revoked' then
    select full_name into v_name from public.guests where id = v_tok.guest_id;
    insert into public.check_ins (wedding_id, guest_id, hostess_id, result, method, party_size)
    values (v_tok.wedding_id, v_tok.guest_id, auth.uid(), 'revoked', 'qr', 0);
    return jsonb_build_object('ok', false, 'code', 'revoked_token', 'guest_name', v_name);
  end if;

  return public.internal_check_in(p_wedding_id, v_tok.guest_id, p_party_size, 'qr');
end;
$$;

-- Alternative sans caméra / QR illisible : l'hôtesse identifie l'invité par recherche.
create or replace function public.perform_check_in_by_guest(
  p_wedding_id uuid, p_guest_id uuid, p_party_size integer default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'code', 'not_authenticated');
  end if;
  if not public.can_check_in(p_wedding_id) then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;
  return public.internal_check_in(p_wedding_id, p_guest_id, p_party_size, 'manual');
end;
$$;

-- Annulation d'un contrôle (erreur de scan) : admin ou couple du mariage.
create or replace function public.cancel_check_in(p_guest_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_g public.guests;
begin
  select * into v_g from public.guests where id = p_guest_id;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'unknown_guest');
  end if;
  if not public.can_manage_wedding(v_g.wedding_id) then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;

  select * into v_g from public.guests where id = p_guest_id for update;
  if v_g.arrived_count = 0 then
    return jsonb_build_object('ok', false, 'code', 'not_checked_in');
  end if;

  perform set_config('app.check_in_rpc', 'on', true);
  update public.guests set arrived_count = 0, arrived_at = null where id = p_guest_id;
  perform set_config('app.check_in_rpc', 'off', true);

  update public.check_ins set result = 'cancelled'
  where guest_id = p_guest_id and result = 'success';

  perform public.log_audit(v_g.wedding_id, 'check_in.cancelled', 'guest', p_guest_id, '{}'::jsonb);
  return jsonb_build_object('ok', true, 'code', 'ok');
end;
$$;

-- Informations minimales pour l'interface hôtesse ------------------------------------------------
create or replace function public.recent_check_ins(p_wedding_id uuid, p_limit integer default 20)
returns table (
  guest_name text, table_name text, party_size integer, method text, checked_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.can_check_in(p_wedding_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select g.full_name, t.name, c.party_size, c.method, c.checked_in_at
    from public.check_ins c
    join public.guests g on g.id = c.guest_id
    left join public.tables t on t.id = g.table_id
    where c.wedding_id = p_wedding_id and c.result = 'success'
    order by c.checked_in_at desc
    limit least(greatest(coalesce(p_limit, 20), 1), 100);
end;
$$;

create or replace function public.check_in_stats(p_wedding_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.can_check_in(p_wedding_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return (
    select jsonb_build_object(
      'expected_guests', count(*) filter (where rsvp_status <> 'declined'),
      'arrived_guests', count(*) filter (where arrived_count > 0),
      'arrived_people', coalesce(sum(arrived_count), 0)
    )
    from public.guests where wedding_id = p_wedding_id
  );
end;
$$;

create or replace function public.search_guests_for_check_in(p_wedding_id uuid, p_query text)
returns table (
  guest_id uuid, full_name text, table_name text, rsvp_status public.rsvp_status,
  allowed_companions integer, arrived_count integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_q text := btrim(coalesce(p_query, ''));
begin
  if not public.can_check_in(p_wedding_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if char_length(v_q) < 2 then
    return;
  end if;
  -- Échappement des jokers LIKE
  v_q := replace(replace(replace(v_q, '\', '\\'), '%', '\%'), '_', '\_');
  return query
    select g.id, g.full_name, t.name, g.rsvp_status, g.allowed_companions, g.arrived_count
    from public.guests g
    left join public.tables t on t.id = g.table_id
    where g.wedding_id = p_wedding_id and g.full_name ilike '%' || v_q || '%' escape '\'
    order by g.full_name
    limit 20;
end;
$$;

-- ---------- Révocation / renouvellement des jetons QR ---------------------------------------------------
create or replace function public.revoke_guest_qr(p_guest_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wedding uuid;
begin
  select wedding_id into v_wedding from public.guests where id = p_guest_id;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'unknown_guest');
  end if;
  if not public.can_manage_wedding(v_wedding) then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;

  update public.guest_qr_tokens
  set status = 'revoked', revoked_at = now(), revoked_by = auth.uid()
  where guest_id = p_guest_id and status = 'active';

  perform public.log_audit(v_wedding, 'qr.revoked', 'guest', p_guest_id, '{}'::jsonb);
  return jsonb_build_object('ok', true, 'code', 'ok');
end;
$$;

create or replace function public.renew_guest_qr(p_guest_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wedding uuid;
begin
  select wedding_id into v_wedding from public.guests where id = p_guest_id;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'unknown_guest');
  end if;
  if not public.can_manage_wedding(v_wedding) then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;

  -- Verrou sur l'invité : sérialise les renouvellements concurrents.
  perform 1 from public.guests where id = p_guest_id for update;

  update public.guest_qr_tokens
  set status = 'revoked', revoked_at = now(), revoked_by = auth.uid()
  where guest_id = p_guest_id and status = 'active';

  insert into public.guest_qr_tokens (guest_id, wedding_id, token)
  values (p_guest_id, v_wedding, public.generate_qr_token());

  perform public.log_audit(v_wedding, 'qr.renewed', 'guest', p_guest_id, '{}'::jsonb);
  return jsonb_build_object('ok', true, 'code', 'ok');
end;
$$;

-- ---------- Privilèges : tout fermé, puis ouverture explicite ---------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

-- Aides utilisées dans les politiques RLS
grant execute on function
  public.is_admin(),
  public.has_wedding_role(uuid, public.app_role),
  public.is_wedding_member(uuid),
  public.can_manage_wedding(uuid),
  public.can_check_in(uuid)
to authenticated;

-- RPC publiques (validation et limitation de débit internes)
grant execute on function
  public.get_public_wedding(text, boolean),
  public.submit_rsvp(text, text, public.rsvp_status, integer, text, text, text),
  public.submit_guestbook_message(text, text, text),
  public.submit_contact_message(text, text, text, text)
to anon, authenticated;

-- RPC réservées aux utilisateurs connectés (permissions revérifiées dans chaque fonction)
grant execute on function
  public.perform_check_in(uuid, text, integer),
  public.perform_check_in_by_guest(uuid, uuid, integer),
  public.cancel_check_in(uuid),
  public.recent_check_ins(uuid, integer),
  public.check_in_stats(uuid),
  public.search_guests_for_check_in(uuid, text),
  public.revoke_guest_qr(uuid),
  public.renew_guest_qr(uuid)
to authenticated;
