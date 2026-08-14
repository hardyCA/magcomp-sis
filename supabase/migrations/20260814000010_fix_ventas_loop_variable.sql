-- Fix: registrar_venta fallaba con "missing FROM-clause entry for table v_item".
-- Causa: la variable v_item es jsonb (para leer el array de items) pero el segundo
-- bucle (temp_venta_items) la reutiliza con acceso de registro (v_item.producto_id).
-- Como jsonb no es tipo record, PL/pgSQL interpreta v_item como una tabla.
-- Solución: usar una variable record dedicada para recorrer temp_venta_items.

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
  v_fila record;
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
  for v_fila in select * from temp_venta_items
  loop
    v_producto_id := v_fila.producto_id;
    v_cantidad := v_fila.cantidad;
    v_precio_unitario := v_fila.precio_unitario;
    v_linea_subtotal := v_fila.subtotal;

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