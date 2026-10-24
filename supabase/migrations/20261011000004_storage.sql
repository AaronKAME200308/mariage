-- =====================================================================
-- MariamCM — Migration 4 : Supabase Storage
-- Convention de chemin : {wedding_id}/{dossier}/{fichier}
--   dossiers : hero | story | gallery | gifts   (wedding-images)
--              music                              (wedding-audio)
-- Les buckets sont publics en LECTURE (URL non devinable) car leur contenu est
-- destiné à l'affichage public ; l'écriture exige les droits sur le mariage.
-- Limites de taille et types MIME appliqués par Supabase au niveau du bucket.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('wedding-images', 'wedding-images', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('wedding-audio', 'wedding-audio', true, 15728640,
   array['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Extrait l'identifiant du mariage du premier segment du chemin (NULL si invalide).
create or replace function public.storage_wedding_id(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(p_name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and split_part(p_name, '/', 3) <> ''
    then split_part(p_name, '/', 1)::uuid
  end;
$$;
revoke execute on function public.storage_wedding_id(text) from public, anon;
grant execute on function public.storage_wedding_id(text) to authenticated;

create policy wedding_images_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'wedding-images'
    and public.storage_wedding_id(name) is not null
    and public.can_manage_wedding(public.storage_wedding_id(name))
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'avif')
  );
create policy wedding_images_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'wedding-images'
    and public.storage_wedding_id(name) is not null
    and public.can_manage_wedding(public.storage_wedding_id(name))
  )
  with check (
    bucket_id = 'wedding-images'
    and public.storage_wedding_id(name) is not null
    and public.can_manage_wedding(public.storage_wedding_id(name))
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'avif')
  );
create policy wedding_images_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'wedding-images'
    and public.storage_wedding_id(name) is not null
    and public.can_manage_wedding(public.storage_wedding_id(name))
  );
create policy wedding_images_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'wedding-images'
    and public.storage_wedding_id(name) is not null
    and public.can_manage_wedding(public.storage_wedding_id(name))
  );

create policy wedding_audio_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'wedding-audio'
    and public.storage_wedding_id(name) is not null
    and public.can_manage_wedding(public.storage_wedding_id(name))
    and lower(storage.extension(name)) in ('mp3', 'm4a', 'ogg', 'wav')
  );
create policy wedding_audio_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'wedding-audio'
    and public.storage_wedding_id(name) is not null
    and public.can_manage_wedding(public.storage_wedding_id(name))
  )
  with check (
    bucket_id = 'wedding-audio'
    and public.storage_wedding_id(name) is not null
    and public.can_manage_wedding(public.storage_wedding_id(name))
    and lower(storage.extension(name)) in ('mp3', 'm4a', 'ogg', 'wav')
  );
create policy wedding_audio_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'wedding-audio'
    and public.storage_wedding_id(name) is not null
    and public.can_manage_wedding(public.storage_wedding_id(name))
  );
create policy wedding_audio_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'wedding-audio'
    and public.storage_wedding_id(name) is not null
    and public.can_manage_wedding(public.storage_wedding_id(name))
  );
