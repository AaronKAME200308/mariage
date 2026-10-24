-- =====================================================================
-- MariamCM — Migration 1 : schéma de base
-- Tables, contraintes, index, triggers d'intégrité.
-- Les politiques RLS sont dans la migration 2, les RPC dans la 3.
-- =====================================================================

-- ---------- Types énumérés -------------------------------------------
create type public.app_role as enum ('admin', 'couple', 'hostess');
create type public.wedding_status as enum ('draft', 'published', 'unpublished', 'archived');
create type public.rsvp_status as enum ('pending', 'confirmed', 'declined');
create type public.qr_status as enum ('active', 'revoked');
create type public.moderation_status as enum ('pending', 'approved', 'rejected');
create type public.gift_status as enum ('available', 'reserved', 'unavailable');
create type public.event_kind as enum (
  'civil_ceremony', 'religious_ceremony', 'reception', 'cocktail', 'dinner', 'party', 'other'
);
create type public.check_in_result as enum (
  'success', 'cancelled', 'duplicate', 'revoked', 'rsvp_declined', 'invalid_party_size'
);

-- ---------- Fonctions utilitaires -------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- profiles --------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  role public.app_role not null default 'couple',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- weddings --------------------------------------------------
create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  partner_one_name text not null check (char_length(partner_one_name) between 1 and 80),
  partner_two_name text not null check (char_length(partner_two_name) between 1 and 80),
  wedding_date timestamptz,
  timezone text not null default 'Africa/Douala',
  status public.wedding_status not null default 'draft',
  -- Thème : couleurs, polices, éléments décoratifs
  theme jsonb not null default '{}'::jsonb,
  -- Textes (titres, accroche, histoire du couple…)
  content jsonb not null default '{}'::jsonb,
  -- Paramètres : sections visibles, RSVP, livre d'or…
  settings jsonb not null default '{}'::jsonb,
  hero_image_path text,
  music_path text,
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weddings_slug_format check (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60
  ),
  -- Doit rester aligné avec les routes statiques du frontend
  constraint weddings_slug_not_reserved check (
    slug <> all (array[
      'admin', 'app', 'api', 'auth', 'login', 'connexion', 'mot-de-passe-oublie',
      'reinitialiser-mot-de-passe', 'couple', 'maries', 'hotesse', 'hostess', 'dashboard',
      'contact', 'acces', 'acces-refuse', 'mentions-legales', 'confidentialite', 'cgu',
      'assets', 'static', 'public', 'exemple', 'demo'
    ])
  ),
  constraint weddings_theme_is_object check (jsonb_typeof(theme) = 'object'),
  constraint weddings_content_is_object check (jsonb_typeof(content) = 'object'),
  constraint weddings_settings_is_object check (jsonb_typeof(settings) = 'object'),
  constraint weddings_published_has_date check (status <> 'published' or published_at is not null)
);
create index weddings_status_idx on public.weddings (status);
create index weddings_date_idx on public.weddings (wedding_date);
create trigger weddings_updated_at before update on public.weddings
  for each row execute function public.set_updated_at();

-- ---------- wedding_memberships ----------------------------------------
create table public.wedding_memberships (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  member_role public.app_role not null check (member_role in ('couple', 'hostess')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (wedding_id, user_id)
);
create index wedding_memberships_user_idx on public.wedding_memberships (user_id);

-- Le rôle de la membership doit correspondre au rôle du profil.
create or replace function public.check_membership_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.app_role;
begin
  select role into v_role from public.profiles where id = new.user_id;
  if v_role is null then
    raise exception 'profile_not_found' using errcode = 'P0001';
  end if;
  if v_role <> new.member_role then
    raise exception 'membership_role_mismatch' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger wedding_memberships_check_role
  before insert or update on public.wedding_memberships
  for each row execute function public.check_membership_role();

-- ---------- tables (plan de salle) --------------------------------------
create table public.tables (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  capacity integer not null check (capacity between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wedding_id, name),
  -- Cible de la clé étrangère composite de guests (cohérence du mariage)
  unique (id, wedding_id)
);
create trigger tables_updated_at before update on public.tables
  for each row execute function public.set_updated_at();

-- ---------- guests ------------------------------------------------------
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  phone text check (phone is null or char_length(phone) <= 30),
  email text check (email is null or (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  rsvp_status public.rsvp_status not null default 'pending',
  allowed_companions integer not null default 0 check (allowed_companions between 0 and 20),
  confirmed_companions integer not null default 0 check (confirmed_companions >= 0),
  rsvp_message text check (rsvp_message is null or char_length(rsvp_message) <= 1000),
  rsvp_responded_at timestamptz,
  table_id uuid,
  -- Arrivée effective (distincte de la confirmation RSVP). Écrit uniquement par la RPC de contrôle.
  arrived_count integer not null default 0 check (arrived_count >= 0),
  arrived_at timestamptz,
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guests_confirmed_within_allowed check (confirmed_companions <= allowed_companions),
  constraint guests_companions_only_if_confirmed check (
    rsvp_status = 'confirmed' or confirmed_companions = 0
  ),
  constraint guests_arrived_within_party check (arrived_count <= 1 + allowed_companions),
  constraint guests_arrival_consistent check ((arrived_count = 0) = (arrived_at is null)),
  -- Garantit que la table appartient au même mariage que l'invité
  constraint guests_table_same_wedding foreign key (table_id, wedding_id)
    references public.tables (id, wedding_id) on delete set null (table_id),
  unique (id, wedding_id)
);
create index guests_wedding_idx on public.guests (wedding_id);
create index guests_table_idx on public.guests (table_id);
create index guests_wedding_rsvp_idx on public.guests (wedding_id, rsvp_status);
-- Empêche les doublons de noms au sein d'un même mariage
create unique index guests_wedding_name_unique
  on public.guests (wedding_id, lower(btrim(regexp_replace(full_name, '\s+', ' ', 'g'))));
create trigger guests_updated_at before update on public.guests
  for each row execute function public.set_updated_at();

-- Nombre de places occupées par un invité à sa table
create or replace function public.guest_seats(
  p_status public.rsvp_status, p_allowed integer, p_confirmed integer
) returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_status
    when 'declined' then 0
    when 'confirmed' then 1 + p_confirmed
    else 1 + p_allowed
  end;
$$;

-- Capacité des tables : verrou sur la ligne de la table pour sérialiser
-- les affectations concurrentes.
create or replace function public.enforce_table_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_capacity integer;
  v_used integer;
  v_needed integer;
begin
  if new.table_id is null then
    return new;
  end if;

  select capacity into v_capacity
  from public.tables where id = new.table_id for update;

  select coalesce(sum(public.guest_seats(rsvp_status, allowed_companions, confirmed_companions)), 0)
    into v_used
  from public.guests
  where table_id = new.table_id and id <> new.id;

  v_needed := public.guest_seats(new.rsvp_status, new.allowed_companions, new.confirmed_companions);

  if v_used + v_needed > v_capacity then
    raise exception 'table_capacity_exceeded' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger guests_enforce_table_capacity
  before insert or update of table_id, rsvp_status, allowed_companions, confirmed_companions
  on public.guests
  for each row execute function public.enforce_table_capacity();

-- Réduire la capacité d'une table en dessous de son occupation est interdit.
create or replace function public.enforce_table_capacity_on_resize()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used integer;
begin
  if new.capacity < old.capacity then
    select coalesce(sum(public.guest_seats(rsvp_status, allowed_companions, confirmed_companions)), 0)
      into v_used from public.guests where table_id = new.id;
    if v_used > new.capacity then
      raise exception 'table_capacity_exceeded' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;
create trigger tables_enforce_resize
  before update of capacity on public.tables
  for each row execute function public.enforce_table_capacity_on_resize();

-- Seule la RPC de contrôle d'accès peut modifier l'arrivée effective.
create or replace function public.guard_guest_arrival()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.arrived_count is distinct from old.arrived_count
      or new.arrived_at is distinct from old.arrived_at)
     and coalesce(current_setting('app.check_in_rpc', true), '') <> 'on' then
    raise exception 'arrival_write_forbidden' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger guests_guard_arrival
  before update of arrived_count, arrived_at on public.guests
  for each row execute function public.guard_guest_arrival();

-- Un invité ne peut pas être créé déjà "arrivé" par un client.
create or replace function public.guard_guest_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.arrived_count <> 0 or new.arrived_at is not null then
    raise exception 'arrival_write_forbidden' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger guests_guard_insert
  before insert on public.guests
  for each row execute function public.guard_guest_insert();

-- ---------- guest_qr_tokens ----------------------------------------------
-- Les jetons sont stockés dans une table privée (jamais lisible par les
-- visiteurs ni par les hôtesses) : le couple doit pouvoir réafficher le QR.
-- Un jeton est opaque (244 bits aléatoires) et ne contient aucune donnée personnelle.
create table public.guest_qr_tokens (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null,
  wedding_id uuid not null,
  token text not null unique check (char_length(token) >= 48),
  status public.qr_status not null default 'active',
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles (id) on delete set null,
  constraint guest_qr_tokens_guest_fk foreign key (guest_id, wedding_id)
    references public.guests (id, wedding_id) on delete cascade,
  constraint guest_qr_tokens_revoked_consistent check ((status = 'revoked') = (revoked_at is not null))
);
-- Un seul jeton actif par invité
create unique index guest_qr_tokens_one_active
  on public.guest_qr_tokens (guest_id) where status = 'active';
create index guest_qr_tokens_wedding_idx on public.guest_qr_tokens (wedding_id);

create or replace function public.generate_qr_token()
returns text
language sql
volatile
set search_path = ''
as $$
  select replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
$$;

-- Création automatique du jeton à la création d'un invité.
create or replace function public.create_guest_qr_token()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.guest_qr_tokens (guest_id, wedding_id, token)
  values (new.id, new.wedding_id, public.generate_qr_token());
  return new;
end;
$$;
create trigger guests_create_qr_token
  after insert on public.guests
  for each row execute function public.create_guest_qr_token();

-- ---------- check_ins -------------------------------------------------------
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null,
  guest_id uuid not null,
  hostess_id uuid references public.profiles (id) on delete set null,
  result public.check_in_result not null,
  method text not null default 'qr' check (method in ('qr', 'manual')),
  party_size integer not null default 0 check (party_size >= 0),
  checked_in_at timestamptz not null default now(),
  constraint check_ins_guest_fk foreign key (guest_id, wedding_id)
    references public.guests (id, wedding_id) on delete cascade
);
-- Filet de sécurité : au plus UN contrôle initial réussi par invité
create unique index check_ins_one_success_per_guest
  on public.check_ins (guest_id) where result = 'success';
create index check_ins_wedding_time_idx on public.check_ins (wedding_id, checked_in_at desc);

-- ---------- contenu du site ------------------------------------------------
create table public.wedding_events (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  kind public.event_kind not null default 'other',
  title text not null check (char_length(title) between 1 and 120),
  starts_at timestamptz,
  ends_at timestamptz,
  venue_name text check (venue_name is null or char_length(venue_name) <= 160),
  address text check (address is null or char_length(address) <= 300),
  description text check (description is null or char_length(description) <= 2000),
  map_url text check (map_url is null or map_url ~* '^https://'),
  dress_code text check (dress_code is null or char_length(dress_code) <= 160),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wedding_events_time_order check (ends_at is null or starts_at is null or ends_at >= starts_at)
);
create index wedding_events_wedding_idx on public.wedding_events (wedding_id, sort_order, starts_at);
create trigger wedding_events_updated_at before update on public.wedding_events
  for each row execute function public.set_updated_at();

create table public.story_milestones (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (description is null or char_length(description) <= 2000),
  happened_on date,
  image_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index story_milestones_wedding_idx on public.story_milestones (wedding_id, sort_order, happened_on);
create trigger story_milestones_updated_at before update on public.story_milestones
  for each row execute function public.set_updated_at();

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  storage_path text not null,
  caption text check (caption is null or char_length(caption) <= 200),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index gallery_images_wedding_idx on public.gallery_images (wedding_id, sort_order);

create table public.guestbook_messages (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  author_name text not null check (char_length(btrim(author_name)) between 1 and 80),
  message text not null check (char_length(btrim(message)) between 1 and 1000),
  status public.moderation_status not null default 'pending',
  moderated_by uuid references public.profiles (id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);
create index guestbook_wedding_status_idx on public.guestbook_messages (wedding_id, status, created_at desc);

create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  image_path text,
  suggested_amount numeric(12, 2) check (suggested_amount is null or suggested_amount >= 0),
  currency text not null default 'XAF' check (currency ~ '^[A-Z]{3}$'),
  external_url text check (external_url is null or external_url ~* '^https://'),
  status public.gift_status not null default 'available',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index gifts_wedding_idx on public.gifts (wedding_id, sort_order);
create trigger gifts_updated_at before update on public.gifts
  for each row execute function public.set_updated_at();

-- ---------- rsvp_responses (historique) ---------------------------------------
create table public.rsvp_responses (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  guest_id uuid references public.guests (id) on delete set null,
  submitted_name text not null check (char_length(submitted_name) between 1 and 120),
  status public.rsvp_status not null check (status in ('confirmed', 'declined')),
  companions integer not null default 0 check (companions between 0 and 20),
  message text check (message is null or char_length(message) <= 1000),
  created_at timestamptz not null default now()
);
create index rsvp_responses_wedding_idx on public.rsvp_responses (wedding_id, created_at desc);

-- ---------- audit_logs ----------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references public.weddings (id) on delete set null,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (char_length(action) <= 80),
  entity text check (entity is null or char_length(entity) <= 60),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_wedding_idx on public.audit_logs (wedding_id, created_at desc);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- ---------- messages de contact et paramètres plateforme -----------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  email text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject text check (subject is null or char_length(subject) <= 160),
  message text not null check (char_length(btrim(message)) between 5 and 3000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index contact_messages_created_idx on public.contact_messages (created_at desc);

create table public.platform_settings (
  key text primary key check (key ~ '^[a-z0-9_.]+$'),
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
create trigger platform_settings_updated_at before update on public.platform_settings
  for each row execute function public.set_updated_at();

insert into public.platform_settings (key, value, is_public) values
  ('contact', '{"email": null, "phone": null, "address": null}'::jsonb, true),
  ('social_links', '{"instagram": null, "facebook": null, "tiktok": null, "whatsapp": null}'::jsonb, true);
