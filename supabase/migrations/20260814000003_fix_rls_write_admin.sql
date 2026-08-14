-- FASE 3 - PARCHE: corregir políticas de escritura admin
-- with check (true) permitía que cualquier autenticado insertara.
-- Se fuerza public.is_admin() también en el check (INSERT).

drop policy if exists "categorias_write_admin" on public.categorias;
create policy "categorias_write_admin" on public.categorias
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "marcas_write_admin" on public.marcas;
create policy "marcas_write_admin" on public.marcas
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "productos_write_admin" on public.productos;
create policy "productos_write_admin" on public.productos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "movimientos_write_admin" on public.movimientos_inventario;
create policy "movimientos_write_admin" on public.movimientos_inventario
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ventas_write_admin" on public.ventas;
create policy "ventas_write_admin" on public.ventas
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "detalle_ventas_write_admin" on public.detalle_ventas;
create policy "detalle_ventas_write_admin" on public.detalle_ventas
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tipo_cambio_write_admin" on public.tipo_cambio;
create policy "tipo_cambio_write_admin" on public.tipo_cambio
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "configuracion_write_admin" on public.configuracion;
create policy "configuracion_write_admin" on public.configuracion
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
