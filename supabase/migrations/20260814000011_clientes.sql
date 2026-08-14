-- FASE: Clientes en ventas
-- 1) Tabla clientes (solo nombre por ahora)
-- 2) Columna cliente_id en ventas (nullable)
-- 3) RLS: lectura para autenticados, escritura admin (las ventas se registran por función)

create table if not exists public.clientes (
  id bigint generated always as identity primary key,
  nombre text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clientes_nombre on public.clientes (nombre);

alter table public.ventas
  add column if not exists cliente_id bigint references public.clientes (id) on delete set null;

create index if not exists idx_ventas_cliente on public.ventas (cliente_id);

alter table public.clientes enable row level security;

create policy "clientes_read" on public.clientes
  for select to authenticated using (true);

create policy "clientes_write_admin" on public.clientes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());