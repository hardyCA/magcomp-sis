-- ANULACIÓN DE VENTAS
-- 1) Estado en ventas (ACTIVA / ANULADA) + datos de la anulación
-- 2) Nuevo tipo de movimiento 'ANULACION' para devolver el stock
-- 3) anular_venta: revierte stock en una transacción atómica y mantiene la
--    venta en el historial marcada como ANULADA.

alter table public.ventas
  add column if not exists estado text not null default 'ACTIVA' check (estado in ('ACTIVA', 'ANULADA')),
  add column if not exists motivo_anulacion text,
  add column if not exists anulada_por uuid references auth.users (id) on delete set null,
  add column if not exists anulada_en timestamptz;

create index if not exists idx_ventas_estado on public.ventas (estado);

-- Ampliar los tipos de movimiento de inventario
alter table public.movimientos_inventario
  drop constraint if exists movimientos_inventario_tipo_movimiento_check;

alter table public.movimientos_inventario
  add constraint movimientos_inventario_tipo_movimiento_check
  check (tipo_movimiento in ('ENTRADA', 'SALIDA', 'AJUSTE', 'VENTA', 'ANULACION'));

create or replace function public.anular_venta(
  p_venta_id bigint,
  p_motivo text default null
) returns public.ventas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venta public.ventas;
  v_item record;
  v_stock_anterior integer;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and activo) then
    raise exception 'NO_AUTORIZADO';
  end if;

  if not public.is_admin() then
    raise exception 'NO_AUTORIZADO';
  end if;

  select * into v_venta from public.ventas where id = p_venta_id;
  if not found then
    raise exception 'VENTA_NO_EXISTE';
  end if;

  if v_venta.estado = 'ANULADA' then
    raise exception 'VENTA_YA_ANULADA';
  end if;

  -- Devolver el stock y registrar un movimiento por cada línea de la venta
  for v_item in
    select d.producto_id, d.cantidad
    from public.detalle_ventas d
    where d.venta_id = p_venta_id
  loop
    select p.stock into v_stock_anterior
    from public.productos p
    where p.id = v_item.producto_id;

    update public.productos
    set stock = stock + v_item.cantidad
    where id = v_item.producto_id;

    insert into public.movimientos_inventario
      (producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, usuario_id, motivo)
    values
      (v_item.producto_id, 'ANULACION', v_item.cantidad,
       v_stock_anterior, v_stock_anterior + v_item.cantidad, auth.uid(),
       'Anulación venta ' || v_venta.numero);
  end loop;

  -- Si la venta nació de una cotización, la libera para poder reconvertirla
  update public.cotizaciones
  set venta_id = null, estado = 'PENDIENTE'
  where venta_id = p_venta_id;

  update public.ventas
  set estado = 'ANULADA',
      motivo_anulacion = nullif(trim(coalesce(p_motivo, '')), ''),
      anulada_por = auth.uid(),
      anulada_en = now()
  where id = p_venta_id;

  select * into v_venta from public.ventas where id = p_venta_id;
  return v_venta;
end;
$$;

revoke all on function public.anular_venta(bigint, text) from public;
grant execute on function public.anular_venta(bigint, text) to authenticated;
