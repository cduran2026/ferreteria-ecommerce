begin;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete restrict,
 display_name text not null default '' check (length(display_name) <= 150), created_at timestamptz not null default now()
);
-- Sin rol en metadata editable, sin autoasignación privilegiada.
create table public.staff_roles (
 user_id uuid primary key references auth.users(id) on delete restrict,
 role text not null check (role in ('admin','operator')), active boolean not null default true,
 assigned_by uuid references auth.users(id) on delete restrict, assigned_at timestamptz not null default now()
);
create function app_private.has_role(allowed text[]) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.staff_roles where user_id=(select auth.uid()) and active and role=any(allowed));
$$;
create function app_private.require_staff(allowed text[]) returns void language plpgsql set search_path = '' as $$
begin if auth.uid() is null or not app_private.has_role(allowed) then raise exception 'forbidden' using errcode='42501'; end if; end $$;
create function public.set_staff_role(target uuid, new_role text, enabled boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
 perform pg_advisory_xact_lock(721033);
 perform app_private.require_staff(array['admin']);
 if target is null or enabled is null or new_role not in ('admin','operator') or new_role is null then raise exception 'invalid_role' using errcode='22023'; end if;
 if exists(select 1 from public.staff_roles where user_id=target and active and role='admin') and (not enabled or new_role<>'admin') and (select count(*) from public.staff_roles where active and role='admin') <= 1 then raise exception 'last_admin' using errcode='23514'; end if;
 insert into public.staff_roles(user_id,role,active,assigned_by) values(target,new_role,enabled,auth.uid())
 on conflict(user_id) do update set role=excluded.role,active=excluded.active,assigned_by=excluded.assigned_by,assigned_at=now();
end $$;
-- Denegación desde la creación; grants/políticas específicos se agregan en la migración final.
alter table public.profiles enable row level security;
revoke all on public.profiles from public,anon,authenticated,service_role;
alter table public.staff_roles enable row level security;
revoke all on public.staff_roles from public,anon,authenticated,service_role;
revoke all on all functions in schema app_private from public,anon,authenticated,service_role;
revoke all on function public.set_staff_role(uuid,text,boolean) from public,anon,authenticated,service_role;
commit;
