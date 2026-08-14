-- FASE 8 - Edición de cotizaciones
-- actualizar_cotizacion: permite editar items, cliente, moneda y descuento de una
-- cotización existente. Conserva el tipo de cambio guardado en la cotización
-- (regla: no depender del tipo de cambio actual).
-- - Solo el dueño o un administrador.
-- - No se puede editar una cotización ya convertida en venta.
-- - Si estaba ACEPTADA, al editarla vuelve a PENDIENTE (cambió el contenido).

create or replace function public.actualizar_cotizacion(
  p_cotizacion_id bigint,
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
  v_cot public.cotizaciones;
  v_tasa numeric;
  v_subtotal numeric := 0;
  v_total numeric;
  v_item jsonb;
  v_fila record;
  v_producto_id bigint;
  v_cantidad integer;
  v_prod public.productos;
  v_precio_unitario numeric;
  v_linea_subtotal numeric;
  v_estado_nuevo text;
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

  if v_cot.estado not in ('PENDIENTE', 'ACEPTADA') then
    raise exception 'COTIZACION_NO_EDITABLE';
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

  -- Usa el tipo de cambio guardado en la cotización (regla del tipo de cambio)
  v_tasa := v_cot.tipo_cambio;
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

  -- Si estaba aceptada, al editarla vuelve a pendiente
  v_estado_nuevo := case when v_cot.estado = 'ACEPTADA' then 'PENDIENTE' else v_cot.estado end;

  update public.cotizaciones
  set cliente = nullif(trim(coalesce(p_cliente, '')), ''),
      moneda = p_moneda,
      subtotal = v_subtotal,
      descuento = p_descuento,
      total = v_total,
      estado = v_estado_nuevo,
      updated_at = now()
  where id = p_cotizacion_id
  returning * into v_cot;

  delete from public.detalle_cotizaciones where cotizacion_id = p_cotizacion_id;

  for v_fila in select * from temp_cotizacion_items
  loop
    v_producto_id := v_fila.producto_id;
    v_cantidad := v_fila.cantidad;
    v_precio_unitario := v_fila.precio_unitario;
    v_linea_subtotal := v_fila.subtotal;

    insert into public.detalle_cotizaciones
      (cotizacion_id, producto_id, cantidad, precio_unitario, subtotal)
    values
      (p_cotizacion_id, v_producto_id, v_cantidad,
       v_precio_unitario, v_linea_subtotal);
  end loop;

  return v_cot;
end;
$$;

revoke all on function public.actualizar_cotizacion(bigint, jsonb, text, text, numeric) from public;
grant execute on function public.actualizar_cotizacion(bigint, jsonb, text, text, numeric) to authenticated;