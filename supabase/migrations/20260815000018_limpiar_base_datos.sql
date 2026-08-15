-- LIMPIEZA DE DATOS DE PRUEBA
-- Mantiene: productos, categorías, marcas, roles, módulos, rol_permisos,
--           tipo de cambio, configuración y el usuario admin@gmail.com.
-- Elimina: ventas, detalle_ventas, cotizaciones, detalle_cotizaciones,
--          movimientos de inventario, clientes y los demás usuarios.

-- 1) Eliminar datos operativos (respetando claves foráneas)
delete from public.detalle_ventas;
delete from public.detalle_cotizaciones;
delete from public.ventas;
delete from public.cotizaciones;
delete from public.movimientos_inventario;
delete from public.clientes;

-- 2) Reiniciar las secuencias de identidad para que empiecen en 1
select setval(pg_get_serial_sequence('public.ventas', 'id'), 1, false);
select setval(pg_get_serial_sequence('public.detalle_ventas', 'id'), 1, false);
select setval(pg_get_serial_sequence('public.cotizaciones', 'id'), 1, false);
select setval(pg_get_serial_sequence('public.detalle_cotizaciones', 'id'), 1, false);
select setval(pg_get_serial_sequence('public.movimientos_inventario', 'id'), 1, false);
select setval(pg_get_serial_sequence('public.clientes', 'id'), 1, false);

-- 3) Eliminar usuarios que no sean el administrador
--    (perfiles y registros relacionados se eliminan junto con auth.users)
delete from public.profiles
where id in (
  select p.id
  from public.profiles p
  join auth.users u on u.id = p.id
  where u.email is distinct from 'admin@gmail.com'
);

delete from auth.users
where email is distinct from 'admin@gmail.com';
