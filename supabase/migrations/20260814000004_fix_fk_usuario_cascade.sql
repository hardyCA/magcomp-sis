-- FASE 3 - PARCHE: FKs de usuario con on delete set null sobre columnas not null
-- eran contradictorios (borrar usuario violaba not null). Se usan on delete cascade.

alter table public.ventas
  drop constraint if exists ventas_usuario_id_fkey,
  add constraint ventas_usuario_id_fkey foreign key (usuario_id) references auth.users (id) on delete cascade;

alter table public.cotizaciones
  drop constraint if exists cotizaciones_usuario_id_fkey,
  add constraint cotizaciones_usuario_id_fkey foreign key (usuario_id) references auth.users (id) on delete cascade;
