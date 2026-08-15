-- GESTIÓN DE USUARIOS Y ROLES
-- Función que lista todos los usuarios con su rol y correo.
-- Es security definer para leer auth.users (los perfiles no guardan el correo).
-- Solo administradores (is_admin) pueden ejecutarla.

create or replace function public.obtener_usuarios()
returns table (
  id uuid,
  nombre text,
  email text,
  rol_id bigint,
  rol_nombre text,
  activo boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'NO_AUTORIZADO';
  end if;

  return query
  select
    p.id,
    p.nombre,
    u.email::text as email,
    p.rol_id,
    r.nombre as rol_nombre,
    p.activo,
    p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.roles r on r.id = p.rol_id
  order by lower(p.nombre), u.email::text;
end;
$$;

revoke all on function public.obtener_usuarios() from public;
grant execute on function public.obtener_usuarios() to authenticated;