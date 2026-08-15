-- MATRIZ DE PERMISOS POR ROL
-- Módulos del sistema y qué rol puede ver/ingresar a cada uno.
-- El menú se filtra según los permisos del rol del usuario.

create table if not exists public.modulos (
  id bigint generated always as identity primary key,
  clave text not null unique,
  nombre text not null,
  orden integer not null default 0
);

insert into public.modulos (clave, nombre, orden) values
  ('dashboard', 'Dashboard', 1),
  ('ventas', 'Ventas', 2),
  ('historial_ventas', 'Historial de ventas', 3),
  ('cotizaciones', 'Cotizaciones', 4),
  ('inventario', 'Inventario', 5),
  ('productos', 'Productos', 6),
  ('categorias', 'Categorías', 7),
  ('marcas', 'Marcas', 8),
  ('clientes', 'Clientes', 9),
  ('reportes', 'Reportes', 10),
  ('usuarios', 'Usuarios y roles', 11),
  ('configuracion', 'Configuración', 12),
  ('catalogo', 'Catálogo', 13)
on conflict (clave) do nothing;

create table if not exists public.rol_permisos (
  rol_id bigint not null references public.roles (id) on delete cascade,
  modulo_id bigint not null references public.modulos (id) on delete cascade,
  primary key (rol_id, modulo_id)
);

-- ADMINISTRADOR: todos los módulos
insert into public.rol_permisos (rol_id, modulo_id)
select r.id, m.id
from public.roles r
cross join public.modulos m
where r.nombre = 'ADMINISTRADOR'
on conflict do nothing;

-- VENDEDOR: módulos base
insert into public.rol_permisos (rol_id, modulo_id)
select r.id, m.id
from public.roles r
cross join public.modulos m
where r.nombre = 'VENDEDOR'
  and m.clave in ('dashboard', 'ventas', 'historial_ventas', 'cotizaciones', 'inventario', 'catalogo')
on conflict do nothing;

alter table public.modulos enable row level security;
alter table public.rol_permisos enable row level security;

-- Módulos: lectura para autenticados; escritura solo admin
create policy "modulos_read_auth"
  on public.modulos for select
  to authenticated
  using (true);

create policy "modulos_write_admin"
  on public.modulos for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Matriz: lectura/escritura solo admin
create policy "rol_permisos_read_admin"
  on public.rol_permisos for select
  to authenticated
  using (public.is_admin());

create policy "rol_permisos_write_admin"
  on public.rol_permisos for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Permisos del usuario actual (para filtrar el menú y proteger páginas).
create or replace function public.permisos_usuario()
returns text[]
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    array_agg(m.clave order by m.orden),
    '{}'
  )
  from public.rol_permisos rp
  join public.modulos m on m.id = rp.modulo_id
  where rp.rol_id = (select rol_id from public.profiles where id = auth.uid())
$$;

revoke all on function public.permisos_usuario() from public;
grant execute on function public.permisos_usuario() to authenticated;