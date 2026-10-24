import { PGlite } from '@electric-sql/pglite'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, '../../../supabase/migrations')

// Reproduit le minimum de l'environnement Supabase dont dépendent les migrations
// (rôles, schéma auth, schéma storage, privilèges par défaut).
const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_app_meta_data jsonb not null default '{}'::jsonb,
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;

  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;

  create schema storage;
  create table storage.buckets (
    id text primary key, name text, public boolean,
    file_size_limit bigint, allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id),
    name text
  );
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$
    select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
  $$;
  create function storage.extension(name text) returns text language sql immutable as $$
    select case when position('.' in name) > 0 then substring(name from '[^.]+$') else '' end
  $$;
  grant usage on schema storage to anon, authenticated;
  grant select, insert, update, delete on storage.objects to authenticated;
  grant execute on all functions in schema storage to anon, authenticated;
`

export async function createDb(): Promise<PGlite> {
  const db = new PGlite()
  await db.exec(SUPABASE_STUBS)
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()
  for (const file of files) {
    try {
      await db.exec(readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'))
    } catch (error) {
      throw new Error(`Migration ${file} en échec : ${(error as Error).message}`)
    }
  }
  return db
}

export type Actor = { uid: string | null; role: 'anon' | 'authenticated' }

/** Exécute fn avec l'identité d'un utilisateur (JWT simulé + rôle Postgres), puis restaure. */
export async function as<T>(db: PGlite, actor: Actor, fn: () => Promise<T>): Promise<T> {
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [actor.uid ?? ''])
  await db.exec(`set role ${actor.role}`)
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
    await db.query(`select set_config('request.jwt.claim.sub', '', false)`)
  }
}

export const user = (uid: string): Actor => ({ uid, role: 'authenticated' })
export const anon: Actor = { uid: null, role: 'anon' }
