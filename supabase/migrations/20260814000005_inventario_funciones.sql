-- FASE 6: Inventario - función atómica para registrar movimientos de inventario
-- ENTRADA:  incrementa stock en p_cantidad
-- SALIDA:   decrementa stock en p_cantidad (no permite stock negativo)
-- AJUSTE:   deja el stock en p_cantidad (conteo físico real)
-- Actualiza productos.stock e inserta el movimiento en una sola transacción.
-- Solo administradores pueden ejecutarla.

create or replace function public.registrar_movimiento_inventario(
  p_producto_id bigint,
  p_tipo text,
  p_cantidad integer,
  p_motivo text default null
) returns public.movimientos_inventario
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock_anterior integer;
  v_stock_nuevo integer;
  v_cantidad_movimiento integer;
  v_movimiento public.movimientos_inventario;
begin
  if not public.is_admin() then
    raise exception 'NO_AUTORIZADO';
  end if;

  if p_tipo not in ('ENTRADA', 'SALIDA', 'AJUSTE') then
    raise exception 'TIPO_INVALIDO';
  end if;

  select stock into v_stock_anterior
  from public.productos
  where id = p_producto_id
  for update;

  if not found then
    raise exception 'PRODUCTO_NO_EXISTE';
  end if;

  case p_tipo
    when 'ENTRADA' then
      if p_cantidad <= 0 then
        raise exception 'CANTIDAD_INVALIDA';
      end if;
      v_cantidad_movimiento := p_cantidad;
      v_stock_nuevo := v_stock_anterior + p_cantidad;

    when 'SALIDA' then
      if p_cantidad <= 0 then
        raise exception 'CANTIDAD_INVALIDA';
      end if;
      v_cantidad_movimiento := p_cantidad;
      v_stock_nuevo := v_stock_anterior - p_cantidad;
      if v_stock_nuevo < 0 then
        raise exception 'STOCK_INSUFICIENTE';
      end if;

    when 'AJUSTE' then
      if p_cantidad < 0 then
        raise exception 'CANTIDAD_INVALIDA';
      end if;
      v_stock_nuevo := p_cantidad;
      v_cantidad_movimiento := abs(v_stock_nuevo - v_stock_anterior);
      if v_cantidad_movimiento = 0 then
        raise exception 'SIN_CAMBIOS';
      end if;
  end case;

  update public.productos
  set stock = v_stock_nuevo
  where id = p_producto_id;

  insert into public.movimientos_inventario
    (producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, usuario_id, motivo)
  values
    (p_producto_id, p_tipo, v_cantidad_movimiento, v_stock_anterior, v_stock_nuevo, auth.uid(), p_motivo)
  returning * into v_movimiento;

  return v_movimiento;
end;
$$;

revoke all on function public.registrar_movimiento_inventario(bigint, text, integer, text) from public;
grant execute on function public.registrar_movimiento_inventario(bigint, text, integer, text) to authenticated;
