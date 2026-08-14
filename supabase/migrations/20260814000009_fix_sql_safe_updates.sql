-- FASE 7/8 - PARCHE: corregir funciones que usaban `delete from <temp>` sin WHERE.
-- Supabase/PG con sql_safe_updates rechaza DELETE sin WHERE, lo que hacía fallar
-- registrar_venta. Las tablas temporales son `on commit drop`, así que el delete
-- era redundante y se elimina. Además, se crean las funciones de cotizaciones
-- (migración 07) que no estaban aplicadas en el proyecto remoto.
-- Todo con create or replace / if not exists para ser idempotente.

-- ============ VENTAS: registrar_venta corregida ============
create or replace function public.registrar_venta(
  p_items jsonb,
  p_moneda text,
  p_descuento numeric default 0
) returns public.ventas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venta public.ventas;
  v_tasa numeric;
  v_subtotal numeric := 0;
  v_total numeric;
  v_numero text;
  v_item jsonb;
  v_producto_id bigint;
  v_cantidad integer;
  v_prod public.productos;
  v_precio_unitario numeric;
  v_linea_subtotal numeric;
  v_venta_id bigint;
  v_venta_numero text;
  v_stock_anterior integer;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and activo) then
    raise exception 'NO_AUTORIZADO';
  end if;

  if p_moneda not in ('BOB', 'USD') then
    raise exception 'MONEDA_INVALIDA';
  end if;

  if p_descuento is null or p_descuento < 0 then
    raise exception 'DESCUENTO_INVALIDO';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'VENTA_VACIA';
  end if;

  select valor into v_tasa from public.tipo_cambio where id = 1;
  if v_tasa is null or v_tasa <= 0 then
    raise exception 'TIPO_CAMBIO_NO_CONFIGURADO';
  end if;

  create temp table if not exists temp_venta_items (
    producto_id bigint not null,
    cantidad integer not null,
    precio_unitario numeric(12,2) not null,
    subtotal numeric(12,2) not null
  ) on commit drop;

  -- Primera pasada: validar items, verificar stock y calcular subtotal
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item -> 'producto_id') <> 'number'
       or jsonb_typeof(v_item -> 'cantidad') <> 'number' then
      raise exception 'ITEM_INVALIDO';
    end if;

    v_producto_id := (v_item ->> 'producto_id')::bigint;
    v_cantidad := (v_item ->> 'cantidad')::integer;

    if v_cantidad <= 0 then
      raise exception 'CANTIDAD_INVALIDA';
    end if;

    select p.* into v_prod
    from public.productos p
    where p.id = v_producto_id
    for update;

    if not found then
      raise exception 'PRODUCTO_NO_EXISTE';
    end if;

    if v_prod.stock < v_cantidad then
      raise exception 'STOCK_INSUFICIENTE:%', v_prod.nombre;
    end if;

    v_precio_unitario := round(case
      when v_prod.moneda = p_moneda then v_prod.precio_venta
      when v_prod.moneda = 'BOB' then v_prod.precio_venta / v_tasa
      else v_prod.precio_venta * v_tasa
    end, 2);

    v_linea_subtotal := round(v_precio_unitario * v_cantidad, 2);
    v_subtotal := v_subtotal + v_linea_subtotal;

    insert into temp_venta_items
    values (v_producto_id, v_cantidad, v_precio_unitario, v_linea_subtotal);
  end loop;

  if p_descuento > v_subtotal then
    raise exception 'DESCUENTO_INVALIDO';
  end if;

  v_total := round(v_subtotal - p_descuento, 2);
  v_numero := 'V-' || lpad(nextval('public.ventas_numero_seq')::text, 6, '0');

  insert into public.ventas (numero, usuario_id, moneda, tipo_cambio, subtotal, descuento, total)
  values (v_numero, auth.uid(), p_moneda, v_tasa, v_subtotal, p_descuento, v_total)
  returning * into v_venta;

  v_venta_id := v_venta.id;
  v_venta_numero := v_venta.numero;

  -- Segunda pasada: detalle, stock y movimientos de inventario
  for v_item in select * from temp_venta_items
  loop
    v_producto_id := v_item.producto_id;
    v_cantidad := v_item.cantidad;
    v_precio_unitario := v_item.precio_unitario;
    v_linea_subtotal := v_item.subtotal;

    insert into public.detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
    values (v_venta_id, v_producto_id, v_cantidad, v_precio_unitario, v_linea_subtotal);

    select p.stock into v_stock_anterior
    from public.productos p
    where p.id = v_producto_id;

    insert into public.movimientos_inventario
      (producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, usuario_id, motivo)
    values
      (v_producto_id, 'VENTA', v_cantidad,
       v_stock_anterior, v_stock_anterior - v_cantidad, auth.uid(), 'Venta ' || v_venta_numero);

    update public.productos
    set stock = stock - v_cantidad
    where id = v_producto_id;
  end loop;

  return v_venta;
end;
$$;

revoke all on function public.registrar_venta(jsonb, text, numeric) from public;
grant execute on function public.registrar_venta(jsonb, text, numeric) to authenticated;

-- ============ COTIZACIONES: columna venta_id + secuencia ============
alter table public.cotizaciones
  add column if not exists venta_id bigint references public.ventas (id) on delete set null;

create index if not exists idx_cotizaciones_venta on public.cotizaciones (venta_id);

create sequence if not exists public.cotizaciones_numero_seq;

-- ============ CREAR COTIZACIÓN (sin delete sin WHERE) ============
create or replace function public.crear_cotizacion(
  p_items jsonb,
  p_cliente text,
  p_moneda text,
  p_descuento numeric default 0
) returns public.cotizaciones
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cotizacion public.cotizaciones;
  v_tasa numeric;
  v_subtotal numeric := 0;
  v_total numeric;
  v_numero text;
  v_item jsonb;
  v_producto_id bigint;
  v_cantidad integer;
  v_prod public.productos;
  v_precio_unitario numeric;
  v_linea_subtotal numeric;
  v_cotizacion_id bigint;
  v_cotizacion_numero text;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and activo) then
    raise exception 'NO_AUTORIZADO';
  end if;

  if p_moneda not in ('BOB', 'USD') then
    raise exception 'MONEDA_INVALIDA';
  end if;

  if p_descuento is null or p_descuento < 0 then
    raise exception 'DESCUENTO_INVALIDO';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'COTIZACION_VACIA';
  end if;

  select valor into v_tasa from public.tipo_cambio where id = 1;
  if v_tasa is null or v_tasa <= 0 then
    raise exception 'TIPO_CAMBIO_NO_CONFIGURADO';
  end if;

  create temp table if not exists temp_cotizacion_items (
    producto_id bigint not null,
    cantidad integer not null,
    precio_unitario numeric(12,2) not null,
    subtotal numeric(12,2) not null
  ) on commit drop;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item -> 'producto_id') <> 'number'
       or jsonb_typeof(v_item -> 'cantidad') <> 'number' then
      raise exception 'ITEM_INVALIDO';
    end if;

    v_producto_id := (v_item ->> 'producto_id')::bigint;
    v_cantidad := (v_item ->> 'cantidad')::integer;

    if v_cantidad <= 0 then
      raise exception 'CANTIDAD_INVALIDA';
    end if;

    select p.* into v_prod from public.productos p where p.id = v_producto_id;
    if not found then
      raise exception 'PRODUCTO_NO_EXISTE';
    end if;

    v_precio_unitario := round(case
      when v_prod.moneda = p_moneda then v_prod.precio_venta
      when v_prod.moneda = 'BOB' then v_prod.precio_venta / v_tasa
      else v_prod.precio_venta * v_tasa
    end, 2);

    v_linea_subtotal := round(v_precio_unitario * v_cantidad, 2);
    v_subtotal := v_subtotal + v_linea_subtotal;

    insert into temp_cotizacion_items
    values (v_producto_id, v_cantidad, v_precio_unitario, v_linea_subtotal);
  end loop;

  if p_descuento > v_subtotal then
    raise exception 'DESCUENTO_INVALIDO';
  end if;

  v_total := round(v_subtotal - p_descuento, 2);
  v_numero := 'C-' || lpad(nextval('public.cotizaciones_numero_seq')::text, 6, '0');

  insert into public.cotizaciones
    (numero, cliente, usuario_id, moneda, tipo_cambio, subtotal, descuento, total, estado)
  values
    (v_numero, nullif(trim(coalesce(p_cliente, '')), ''), auth.uid(), p_moneda,
     v_tasa, v_subtotal, p_descuento, v_total, 'PENDIENTE')
  returning * into v_cotizacion;

  v_cotizacion_id := v_cotizacion.id;
  v_cotizacion_numero := v_cotizacion.numero;

  for v_item in select * from temp_cotizacion_items
  loop
    v_producto_id := v_item.producto_id;
    v_cantidad := v_item.cantidad;
    v_precio_unitario := v_item.precio_unitario;
    v_linea_subtotal := v_item.subtotal;

    insert into public.detalle_cotizaciones
      (cotizacion_id, producto_id, cantidad, precio_unitario, subtotal)
    values
      (v_cotizacion_id, v_producto_id, v_cantidad,
       v_precio_unitario, v_linea_subtotal);
  end loop;

  return v_cotizacion;
end;
$$;

-- ============ CAMBIAR ESTADO ============
create or replace function public.cambiar_estado_cotizacion(
  p_cotizacion_id bigint,
  p_estado text
) returns public.cotizaciones
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cotizacion public.cotizaciones;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and activo) then
    raise exception 'NO_AUTORIZADO';
  end if;

  if p_estado not in ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'VENCIDA') then
    raise exception 'ESTADO_INVALIDO';
  end if;

  select * into v_cotizacion from public.cotizaciones where id = p_cotizacion_id;
  if not found then
    raise exception 'COTIZACION_NO_EXISTE';
  end if;

  if v_cotizacion.usuario_id <> auth.uid() and not public.is_admin() then
    raise exception 'NO_AUTORIZADO';
  end if;

  if v_cotizacion.venta_id is not null then
    raise exception 'YA_CONVERTIDA';
  end if;

  update public.cotizaciones
  set estado = p_estado
  where id = p_cotizacion_id;

  select * into v_cotizacion from public.cotizaciones where id = p_cotizacion_id;
  return v_cotizacion;
end;
$$;

-- ============ CONVERTIR A VENTA ============
create or replace function public.convertir_cotizacion_a_venta(
  p_cotizacion_id bigint
) returns public.ventas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cot public.cotizaciones;
  v_venta public.ventas;
  v_numero text;
  v_item record;
  v_stock integer;
  v_nombre_producto text;
  v_venta_id bigint;
  v_venta_numero text;
  v_cot_numero text;
  v_cot_usuario_id uuid;
  v_cot_moneda text;
  v_cot_tipo_cambio numeric;
  v_cot_subtotal numeric;
  v_cot_descuento numeric;
  v_cot_total numeric;
  v_producto_id bigint;
  v_cantidad integer;
  v_precio_unitario numeric;
  v_linea_subtotal numeric;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and activo) then
    raise exception 'NO_AUTORIZADO';
  end if;

  select * into v_cot from public.cotizaciones where id = p_cotizacion_id;
  if not found then
    raise exception 'COTIZACION_NO_EXISTE';
  end if;

  if v_cot.usuario_id <> auth.uid() and not public.is_admin() then
    raise exception 'NO_AUTORIZADO';
  end if;

  if v_cot.venta_id is not null then
    raise exception 'YA_CONVERTIDA';
  end if;

  if v_cot.estado <> 'ACEPTADA' then
    raise exception 'COTIZACION_NO_ACEPTADA';
  end if;

  select 'V-' || lpad(nextval('public.ventas_numero_seq')::text, 6, '0') into v_numero;

  v_cot_usuario_id := v_cot.usuario_id;
  v_cot_moneda := v_cot.moneda;
  v_cot_tipo_cambio := v_cot.tipo_cambio;
  v_cot_subtotal := v_cot.subtotal;
  v_cot_descuento := v_cot.descuento;
  v_cot_total := v_cot.total;

  insert into public.ventas (numero, usuario_id, moneda, tipo_cambio, subtotal, descuento, total)
  values (v_numero, v_cot_usuario_id, v_cot_moneda, v_cot_tipo_cambio,
          v_cot_subtotal, v_cot_descuento, v_cot_total)
  returning * into v_venta;

  v_venta_id := v_venta.id;
  v_venta_numero := v_venta.numero;
  v_cot_numero := v_cot.numero;

  for v_item in
    select dc.producto_id, dc.cantidad, dc.precio_unitario, dc.subtotal
    from public.detalle_cotizaciones dc
    where dc.cotizacion_id = p_cotizacion_id
  loop
    v_producto_id := v_item.producto_id;
    v_cantidad := v_item.cantidad;
    v_precio_unitario := v_item.precio_unitario;
    v_linea_subtotal := v_item.subtotal;

    select stock, nombre into v_stock, v_nombre_producto
    from public.productos
    where id = v_producto_id
    for update;

    if not found then
      raise exception 'PRODUCTO_NO_EXISTE';
    end if;

    if v_stock < v_cantidad then
      raise exception 'STOCK_INSUFICIENTE:%', v_nombre_producto;
    end if;

    insert into public.detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
    values (v_venta_id, v_producto_id, v_cantidad,
            v_precio_unitario, v_linea_subtotal);

    insert into public.movimientos_inventario
      (producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, usuario_id, motivo)
    values
      (v_producto_id, 'VENTA', v_cantidad,
       v_stock, v_stock - v_cantidad, v_cot_usuario_id,
       'Venta ' || v_venta_numero || ' (cotización ' || v_cot_numero || ')');

    update public.productos
    set stock = stock - v_cantidad
    where id = v_producto_id;
  end loop;

  update public.cotizaciones
  set venta_id = v_venta_id
  where id = p_cotizacion_id;

  return v_venta;
end;
$$;

revoke all on function public.crear_cotizacion(jsonb, text, text, numeric) from public;
revoke all on function public.cambiar_estado_cotizacion(bigint, text) from public;
revoke all on function public.convertir_cotizacion_a_venta(bigint) from public;

grant execute on function public.crear_cotizacion(jsonb, text, text, numeric) to authenticated;
grant execute on function public.cambiar_estado_cotizacion(bigint, text) to authenticated;
grant execute on function public.convertir_cotizacion_a_venta(bigint) to authenticated;