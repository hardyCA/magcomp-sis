-- FASE 13: Storage de imágenes de productos
-- Bucket público 'productos'. Solo referencias/URL en la tabla productos.
-- Lectura pública; subida de imágenes solo usuarios autenticados; admin gestiona.

insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

drop policy if exists "productos_img_read_public" on storage.objects;
create policy "productos_img_read_public"
  on storage.objects for select
  to public
  using (bucket_id = 'productos');

drop policy if exists "productos_img_insert_auth" on storage.objects;
create policy "productos_img_insert_auth"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'productos');

drop policy if exists "productos_img_update_admin" on storage.objects;
create policy "productos_img_update_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'productos' and public.is_admin())
  with check (bucket_id = 'productos' and public.is_admin());

drop policy if exists "productos_img_delete_admin" on storage.objects;
create policy "productos_img_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'productos' and public.is_admin());
