-- FASE 2: Autenticación y roles
-- Tablas: roles, profiles + RLS + triggers

-- ============ ROLES ============
create table if not exists public.roles (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  descripcion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.roles (nombre, descripcion) values
  ('ADMINISTRADOR', 'Acceso total: productos, inventario, ventas, cotizaciones, catálogo, reportes, usuarios y configuración'),
  ('VENDEDOR', 'Consultas, ventas, cotizaciones y catálogo')
on conflict (nombre) do nothing;

-- ============ PROFILES ============
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '',
  rol_id bigint references public.roles (id),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger para actualizar updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- Crear profile automáticamente al registrar usuario
-- El primer usuario del sistema obtiene rol ADMINISTRADOR, el resto VENDEDOR.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol_id bigint;
begin
  select r.id into v_rol_id from public.roles r where r.nombre = 'VENDEDOR';
  if not exists (select 1 from public.profiles) then
    select r.id into v_rol_id from public.roles r where r.nombre = 'ADMINISTRADOR';
  end if;

  insert into public.profiles (id, nombre, rol_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    v_rol_id
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============ ROW LEVEL SECURITY ============

-- Función de soporte para evitar recursión en las políticas:
-- corre con privilegios del owner (security definer) y consulta profiles sin RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.rol_id
    where p.id = auth.uid() and r.nombre = 'ADMINISTRADOR' and p.activo
  );
$$;

alter table public.roles enable row level security;
alter table public.profiles enable row level security;

-- Roles: cualquier usuario autenticado puede leer; solo administradores pueden escribir
drop policy if exists "roles_read_authenticated" on public.roles;
create policy "roles_read_authenticated"
  on public.roles for select
  to authenticated
  using (true);

drop policy if exists "roles_write_admin" on public.roles;
create policy "roles_write_admin"
  on public.roles for all
  to authenticated
  using (public.is_admin());

-- Profiles: leer el propio; administradores leen todos
drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_read_admin" on public.profiles;
create policy "profiles_read_admin"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- Profiles: actualizar el propio; administradores todo
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (true);
