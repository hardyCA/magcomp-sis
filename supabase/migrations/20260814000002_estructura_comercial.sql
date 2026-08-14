-- FASE 3: Estructura de la base de datos del sistema comercial
-- Tablas: categorias, marcas, productos, movimientos_inventario, ventas,
-- detalle_ventas, cotizaciones, detalle_cotizaciones, tipo_cambio, configuracion
-- + RLS por rol (ADMINISTRADOR / VENDEDOR) + datos iniciales

-- ============ CATEGORÍAS ============
create table if not exists public.categorias (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  descripcion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.categorias;
create trigger set_updated_at
  before update on public.categorias
  for each row execute function public.handle_updated_at();

-- ============ MARCAS ============
create table if not exists public.marcas (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.marcas;
create trigger set_updated_at
  before update on public.marcas
  for each row execute function public.handle_updated_at();

-- ============ PRODUCTOS ============
create table if not exists public.productos (
  id bigint generated always as identity primary key,
  codigo_barras text,
  nombre text not null,
  categoria_id bigint references public.categorias (id) on delete set null,
  marca_id bigint references public.marcas (id) on delete set null,
  stock integer not null default 0 check (stock >= 0),
  stock_minimo integer not null default 0 check (stock_minimo >= 0),
  imagen text,
  precio_venta numeric(12,2) not null default 0 check (precio_venta >= 0),
  moneda text not null default 'BOB' check (moneda in ('BOB', 'USD')),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_productos_codigo_barras on public.productos (codigo_barras);
create index if not exists idx_productos_nombre on public.productos (nombre);
create index if not exists idx_productos_categoria on public.productos (categoria_id);
create index if not exists idx_productos_marca on public.productos (marca_id);

drop trigger if exists set_updated_at on public.productos;
create trigger set_updated_at
  before update on public.productos
  for each row execute function public.handle_updated_at();

-- ============ MOVIMIENTOS DE INVENTARIO ============
create table if not exists public.movimientos_inventario (
  id bigint generated always as identity primary key,
  producto_id bigint not null references public.productos (id) on delete cascade,
  tipo_movimiento text not null check (tipo_movimiento in ('ENTRADA', 'SALIDA', 'AJUSTE', 'VENTA')),
  cantidad integer not null check (cantidad > 0),
  stock_anterior integer not null,
  stock_nuevo integer not null,
  usuario_id uuid references auth.users (id) on delete set null,
  motivo text,
  created_at timestamptz not null default now()
);

create index if not exists idx_movimientos_producto on public.movimientos_inventario (producto_id);
create index if not exists idx_movimientos_fecha on public.movimientos_inventario (created_at);

-- ============ VENTAS ============
create table if not exists public.ventas (
  id bigint generated always as identity primary key,
  numero text not null unique,
  usuario_id uuid not null references auth.users (id) on delete set null,
  fecha timestamptz not null default now(),
  moneda text not null check (moneda in ('BOB', 'USD')),
  tipo_cambio numeric(12,4) not null,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  descuento numeric(12,2) not null default 0 check (descuento >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_ventas_usuario on public.ventas (usuario_id);
create index if not exists idx_ventas_fecha on public.ventas (fecha);

create table if not exists public.detalle_ventas (
  id bigint generated always as identity primary key,
  venta_id bigint not null references public.ventas (id) on delete cascade,
  producto_id bigint not null references public.productos (id) on delete restrict,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12,2) not null check (precio_unitario >= 0),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0)
);

create index if not exists idx_detalle_ventas_venta on public.detalle_ventas (venta_id);
create index if not exists idx_detalle_ventas_producto on public.detalle_ventas (producto_id);

-- ============ COTIZACIONES ============
create table if not exists public.cotizaciones (
  id bigint generated always as identity primary key,
  numero text not null unique,
  cliente text,
  usuario_id uuid not null references auth.users (id) on delete set null,
  fecha timestamptz not null default now(),
  moneda text not null check (moneda in ('BOB', 'USD')),
  tipo_cambio numeric(12,4) not null,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  descuento numeric(12,2) not null default 0 check (descuento >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  estado text not null default 'PENDIENTE' check (estado in ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'VENCIDA')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cotizaciones_usuario on public.cotizaciones (usuario_id);
create index if not exists idx_cotizaciones_fecha on public.cotizaciones (fecha);
create index if not exists idx_cotizaciones_estado on public.cotizaciones (estado);

drop trigger if exists set_updated_at on public.cotizaciones;
create trigger set_updated_at
  before update on public.cotizaciones
  for each row execute function public.handle_updated_at();

create table if not exists public.detalle_cotizaciones (
  id bigint generated always as identity primary key,
  cotizacion_id bigint not null references public.cotizaciones (id) on delete cascade,
  producto_id bigint not null references public.productos (id) on delete restrict,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12,2) not null check (precio_unitario >= 0),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0)
);

create index if not exists idx_detalle_cotizaciones_cotizacion on public.detalle_cotizaciones (cotizacion_id);
create index if not exists idx_detalle_cotizaciones_producto on public.detalle_cotizaciones (producto_id);

-- ============ TIPO DE CAMBIO ============
-- Fila única: 1 USD = valor BOB. El administrador lo actualiza.
create table if not exists public.tipo_cambio (
  id integer primary key default 1 check (id = 1),
  valor numeric(12,4) not null check (valor > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.tipo_cambio;
create trigger set_updated_at
  before update on public.tipo_cambio
  for each row execute function public.handle_updated_at();

insert into public.tipo_cambio (id, valor)
values (1, 6.96)
on conflict (id) do nothing;

-- ============ CONFIGURACIÓN ============
create table if not exists public.configuracion (
  id bigint generated always as identity primary key,
  clave text not null unique,
  valor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.configuracion;
create trigger set_updated_at
  before update on public.configuracion
  for each row execute function public.handle_updated_at();

insert into public.configuracion (clave, valor) values
  ('nombre_negocio', 'MAG COMP'),
  ('direccion', ''),
  ('telefono', ''),
  ('moneda_principal', 'BOB')
on conflict (clave) do nothing;

-- ============ ROW LEVEL SECURITY ============

-- Categorías: lectura pública (catálogo) y autenticada; escritura admin
alter table public.categorias enable row level security;
create policy "categorias_read_public" on public.categorias for select to anon using (true);
create policy "categorias_read_auth" on public.categorias for select to authenticated using (true);
create policy "categorias_write_admin" on public.categorias for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Marcas: igual que categorías
alter table public.marcas enable row level security;
create policy "marcas_read_public" on public.marcas for select to anon using (true);
create policy "marcas_read_auth" on public.marcas for select to authenticated using (true);
create policy "marcas_write_admin" on public.marcas for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Productos: el catálogo público solo ve activos; autenticados ven todos; escritura admin
alter table public.productos enable row level security;
create policy "productos_read_public_activos" on public.productos for select to anon using (activo = true);
create policy "productos_read_auth" on public.productos for select to authenticated using (true);
create policy "productos_write_admin" on public.productos for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Movimientos de inventario: lectura del propio o admin; escritura admin (las ventas usan función)
alter table public.movimientos_inventario enable row level security;
create policy "movimientos_read_own" on public.movimientos_inventario for select to authenticated using (usuario_id = auth.uid());
create policy "movimientos_read_admin" on public.movimientos_inventario for select to authenticated using (public.is_admin());
create policy "movimientos_write_admin" on public.movimientos_inventario for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Ventas: lectura de las propias o admin; escritura admin (las ventas se registran por función)
alter table public.ventas enable row level security;
create policy "ventas_read_own" on public.ventas for select to authenticated using (usuario_id = auth.uid());
create policy "ventas_read_admin" on public.ventas for select to authenticated using (public.is_admin());
create policy "ventas_write_admin" on public.ventas for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.detalle_ventas enable row level security;
create policy "detalle_ventas_read" on public.detalle_ventas for select to authenticated using (
  exists (
    select 1 from public.ventas v
    where v.id = venta_id and (v.usuario_id = auth.uid() or public.is_admin())
  )
);
create policy "detalle_ventas_write_admin" on public.detalle_ventas for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Cotizaciones: vendedor gestiona las suyas; admin todas; lectura de la propia o admin
alter table public.cotizaciones enable row level security;
create policy "cotizaciones_read" on public.cotizaciones for select to authenticated using (usuario_id = auth.uid() or public.is_admin());
create policy "cotizaciones_insert" on public.cotizaciones for insert to authenticated with check (usuario_id = auth.uid() or public.is_admin());
create policy "cotizaciones_update" on public.cotizaciones for update to authenticated using (usuario_id = auth.uid() or public.is_admin()) with check (usuario_id = auth.uid() or public.is_admin());
create policy "cotizaciones_delete" on public.cotizaciones for delete to authenticated using (public.is_admin());

alter table public.detalle_cotizaciones enable row level security;
create policy "detalle_cotizaciones_read" on public.detalle_cotizaciones for select to authenticated using (
  exists (
    select 1 from public.cotizaciones c
    where c.id = cotizacion_id and (c.usuario_id = auth.uid() or public.is_admin())
  )
);
create policy "detalle_cotizaciones_write" on public.detalle_cotizaciones for all to authenticated using (
  exists (
    select 1 from public.cotizaciones c
    where c.id = cotizacion_id and (c.usuario_id = auth.uid() or public.is_admin())
  )
) with check (
  exists (
    select 1 from public.cotizaciones c
    where c.id = cotizacion_id and (c.usuario_id = auth.uid() or public.is_admin())
  )
);

-- Tipo de cambio: lectura pública y autenticada; escritura admin
alter table public.tipo_cambio enable row level security;
create policy "tipo_cambio_read_public" on public.tipo_cambio for select to anon using (true);
create policy "tipo_cambio_read_auth" on public.tipo_cambio for select to authenticated using (true);
create policy "tipo_cambio_write_admin" on public.tipo_cambio for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Configuración: lectura pública y autenticada; escritura admin
alter table public.configuracion enable row level security;
create policy "configuracion_read_public" on public.configuracion for select to anon using (true);
create policy "configuracion_read_auth" on public.configuracion for select to authenticated using (true);
create policy "configuracion_write_admin" on public.configuracion for all to authenticated using (public.is_admin()) with check (public.is_admin());

