-- Adaptador LOCAL de contratos Supabase; no se usa en Cloud ni es una migración.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;
create schema storage;
create table storage.buckets(id text primary key,name text not null,public boolean not null default false);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text not null,unique(bucket_id,name));
alter table storage.objects enable row level security;
grant usage on schema storage to anon,authenticated,service_role;
grant select,insert,update,delete on storage.objects to anon,authenticated;
-- Simula defaults amplios habituales de plataforma; las migraciones deben revocarlos.
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
