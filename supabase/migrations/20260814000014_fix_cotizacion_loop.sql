-- Fix: crear_cotizacion fallaba con "missing FROM-clause entry for table v_item".
-- Causa: v_item es jsonb (para leer el array de items) pero el segundo bucle
-- (temp_cotizacion_items) la reutiliza con acceso de registro (v_item.producto_id).
-- Solución: variable record dedicada v_fila para recorrer temp_cotizacion_items.

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
  v_fila record;
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

  for v_fila in select * from temp_cotizacion_items
  loop
    v_producto_id := v_fila.producto_id;
    v_cantidad := v_fila.cantidad;
    v_precio_unitario := v_fila.precio_unitario;
    v_linea_subtotal := v_fila.subtotal;

    insert into public.detalle_cotizaciones
      (cotizacion_id, producto_id, cantidad, precio_unitario, subtotal)
    values
      (v_cotizacion_id, v_producto_id, v_cantidad,
       v_precio_unitario, v_linea_subtotal);
  end loop;

  return v_cotizacion;
end;
$$;

revoke all on function public.crear_cotizacion(jsonb, text, text, numeric) from public;
grant execute on function public.crear_cotizacion(jsonb, text, text, numeric) to authenticated;