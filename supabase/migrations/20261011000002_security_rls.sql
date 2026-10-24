-- =====================================================================
-- MariamCM — Migration 2 : sécurité (helpers, gardes, audit, RLS)
-- Principe : aucune table privée n'est lisible par un visiteur anonyme.
-- Le contenu public passe uniquement par des RPC dédiées (migration 3).
-- =====================================================================

-- ---------- Fonctions d'autorisation (SECURITY DEFINER, sans récursion RLS) ----
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.is_active
  );
$$;

create or replace function public.has_wedding_role(p_wedding uuid, p_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wedding_memberships m
    join public.profiles p on p.id = m.user_id
    where m.wedding_id = p_wedding
      and m.user_id = auth.uid()
      and m.member_role = p_role
      and p.role = p_role
      and p.is_active
  );
$$;

create or replace function public.is_wedding_member(p_wedding uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
      or public.has_wedding_role(p_wedding, 'couple')
      or public.has_wedding_role(p_wedding, 'hostess');
$$;

create or replace function public.can_manage_wedding(p_wedding uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or public.has_wedding_role(p_wedding, 'couple');
$$;

create or replace function public.can_check_in(p_wedding uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or public.has_wedding_role(p_wedding, 'hostess');
$$;

-- ---------- Journal d'audit (usage interne uniquement) ---------------------------
create or replace function public.log_audit(
  p_wedding uuid, p_action text, p_entity text, p_entity_id uuid, p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs (wedding_id, actor_id, action, entity, entity_id, metadata)
  values (p_wedding, auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

-- ---------- Création automatique du profil à l'inscription Auth -------------------
-- Le rôle vient de raw_app_meta_data (modifiable uniquement par le service_role),
-- JAMAIS de raw_user_meta_data (modifiable par l'utilisateur à l'inscription).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.app_role := 'couple';
begin
  begin
    v_role := coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'couple');
  exception when invalid_text_representation then
    v_role := 'couple';
  end;

  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'full_name', 120), ''), v_role);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Gardes anti-escalade ------------------------------------------------------
-- auth.uid() est NULL pour le service_role / l'éditeur SQL : ces contextes de confiance sont autorisés.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.id is distinct from old.id
       or new.role is distinct from old.role
       or new.is_active is distinct from old.is_active then
      raise exception 'forbidden_profile_change' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

create or replace function public.guard_wedding_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.id is distinct from old.id
       or new.slug is distinct from old.slug
       or new.status is distinct from old.status
       or new.published_at is distinct from old.published_at
       or new.created_by is distinct from old.created_by then
      raise exception 'forbidden_wedding_change' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger weddings_guard_update
  before update on public.weddings
  for each row execute function public.guard_wedding_update();

create or replace function public.stamp_wedding_publication()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;
create trigger weddings_stamp_publication
  before insert or update on public.weddings
  for each row execute function public.stamp_wedding_publication();

create or replace function public.stamp_guestbook_moderation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.moderated_by = auth.uid();
    new.moderated_at = now();
  end if;
  return new;
end;
$$;
create trigger guestbook_stamp_moderation
  before update on public.guestbook_messages
  for each row execute function public.stamp_guestbook_moderation();

-- ---------- Triggers d'audit -------------------------------------------------------------
create or replace function public.audit_wedding_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_audit(new.id, 'wedding.created', 'wedding', new.id,
      jsonb_build_object('slug', new.slug));
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      perform public.log_audit(new.id, 'wedding.status_changed', 'wedding', new.id,
        jsonb_build_object('from', old.status, 'to', new.status));
    end if;
  elsif tg_op = 'DELETE' then
    perform public.log_audit(null, 'wedding.deleted', 'wedding', old.id,
      jsonb_build_object('slug', old.slug));
  end if;
  return null;
end;
$$;
create trigger weddings_audit
  after insert or update or delete on public.weddings
  for each row execute function public.audit_wedding_change();

create or replace function public.audit_membership_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_audit(new.wedding_id, 'membership.added', 'membership', new.id,
      jsonb_build_object('user_id', new.user_id, 'member_role', new.member_role));
  elsif tg_op = 'DELETE' then
    perform public.log_audit(null, 'membership.removed', 'membership', old.id,
      jsonb_build_object('wedding_id', old.wedding_id, 'user_id', old.user_id,
                         'member_role', old.member_role));
  end if;
  return null;
end;
$$;
create trigger wedding_memberships_audit
  after insert or delete on public.wedding_memberships
  for each row execute function public.audit_membership_change();

create or replace function public.audit_profile_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    perform public.log_audit(null, 'profile.role_changed', 'profile', new.id,
      jsonb_build_object('from', old.role, 'to', new.role));
  end if;
  if new.is_active is distinct from old.is_active then
    perform public.log_audit(null, 'profile.active_changed', 'profile', new.id,
      jsonb_build_object('is_active', new.is_active));
  end if;
  return null;
end;
$$;
create trigger profiles_audit
  after update on public.profiles
  for each row execute function public.audit_profile_change();

-- ---------- Activation de la RLS --------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.weddings enable row level security;
alter table public.wedding_memberships enable row level security;
alter table public.tables enable row level security;
alter table public.guests enable row level security;
alter table public.guest_qr_tokens enable row level security;
alter table public.check_ins enable row level security;
alter table public.wedding_events enable row level security;
alter table public.story_milestones enable row level security;
alter table public.gallery_images enable row level security;
alter table public.guestbook_messages enable row level security;
alter table public.gifts enable row level security;
alter table public.rsvp_responses enable row level security;
alter table public.audit_logs enable row level security;
alter table public.contact_messages enable row level security;
alter table public.platform_settings enable row level security;

-- ---------- Politiques ------------------------------------------------------------------------
-- profiles : lecture de son propre profil (même désactivé, pour afficher le message adéquat)
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());  -- rôle/statut bloqués par le trigger
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- weddings
create policy weddings_select on public.weddings
  for select to authenticated
  using (public.is_wedding_member(id));
create policy weddings_insert on public.weddings
  for insert to authenticated
  with check (public.is_admin());
create policy weddings_update on public.weddings
  for update to authenticated
  using (public.can_manage_wedding(id)) with check (public.can_manage_wedding(id));
create policy weddings_delete on public.weddings
  for delete to authenticated
  using (public.is_admin());

-- wedding_memberships : uniquement l'admin les crée ; chacun voit les siennes
create policy memberships_select on public.wedding_memberships
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy memberships_insert on public.wedding_memberships
  for insert to authenticated
  with check (public.is_admin());
create policy memberships_update on public.wedding_memberships
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy memberships_delete on public.wedding_memberships
  for delete to authenticated
  using (public.is_admin());

-- Tables gérées par admin + couple du mariage (macro répétée pour clarté et auditabilité)
create policy tables_all on public.tables
  for all to authenticated
  using (public.can_manage_wedding(wedding_id)) with check (public.can_manage_wedding(wedding_id));

create policy guests_all on public.guests
  for all to authenticated
  using (public.can_manage_wedding(wedding_id)) with check (public.can_manage_wedding(wedding_id));

-- QR : lecture seule pour admin/couple ; création/révocation via RPC dédiées
create policy qr_tokens_select on public.guest_qr_tokens
  for select to authenticated
  using (public.can_manage_wedding(wedding_id));

-- Historique : lecture admin/couple ; les hôtesses passent par une RPC à champs minimaux
create policy check_ins_select on public.check_ins
  for select to authenticated
  using (public.can_manage_wedding(wedding_id));

create policy events_all on public.wedding_events
  for all to authenticated
  using (public.can_manage_wedding(wedding_id)) with check (public.can_manage_wedding(wedding_id));

create policy milestones_all on public.story_milestones
  for all to authenticated
  using (public.can_manage_wedding(wedding_id)) with check (public.can_manage_wedding(wedding_id));

create policy gallery_all on public.gallery_images
  for all to authenticated
  using (public.can_manage_wedding(wedding_id)) with check (public.can_manage_wedding(wedding_id));

create policy gifts_all on public.gifts
  for all to authenticated
  using (public.can_manage_wedding(wedding_id)) with check (public.can_manage_wedding(wedding_id));

-- Livre d'or : pas d'INSERT direct (RPC avec limitation de débit) ; modération par admin/couple
create policy guestbook_select on public.guestbook_messages
  for select to authenticated
  using (public.can_manage_wedding(wedding_id));
create policy guestbook_update on public.guestbook_messages
  for update to authenticated
  using (public.can_manage_wedding(wedding_id)) with check (public.can_manage_wedding(wedding_id));
create policy guestbook_delete on public.guestbook_messages
  for delete to authenticated
  using (public.can_manage_wedding(wedding_id));

create policy rsvp_responses_select on public.rsvp_responses
  for select to authenticated
  using (public.can_manage_wedding(wedding_id));

create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (public.is_admin());

create policy contact_messages_select on public.contact_messages
  for select to authenticated using (public.is_admin());
create policy contact_messages_update on public.contact_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy contact_messages_delete on public.contact_messages
  for delete to authenticated using (public.is_admin());

create policy platform_settings_select_public on public.platform_settings
  for select to anon, authenticated
  using (is_public);
create policy platform_settings_select_admin on public.platform_settings
  for select to authenticated
  using (public.is_admin());
create policy platform_settings_write on public.platform_settings
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Privilèges (défense en profondeur, en plus de la RLS) --------------------------------
revoke all on all tables in schema public from anon;
grant select on public.platform_settings to anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- Les écritures sur l'audit et les contrôles ne passent jamais par le client
revoke insert, update, delete on public.audit_logs from authenticated;
revoke insert, update, delete on public.check_ins from authenticated;
revoke insert, update, delete on public.guest_qr_tokens from authenticated;
revoke insert, delete on public.rsvp_responses from authenticated;
revoke insert on public.guestbook_messages from authenticated;
revoke insert on public.contact_messages from authenticated;

-- Fonctions : fermées par défaut, ouvertes explicitement
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function
  public.is_admin(),
  public.has_wedding_role(uuid, public.app_role),
  public.is_wedding_member(uuid),
  public.can_manage_wedding(uuid),
  public.can_check_in(uuid)
to authenticated;
