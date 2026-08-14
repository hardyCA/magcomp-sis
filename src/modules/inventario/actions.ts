"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { TIPOS_MOVIMIENTO, type TipoMovimiento } from "@/modules/inventario/constantes";

export type MovimientoState =
  | { error?: string; success?: string }
  | undefined;

const MENSAJES_ERROR: Record<string, string> = {
  NO_AUTORIZADO: "No tienes permisos para registrar movimientos.",
  TIPO_INVALIDO: "El tipo de movimiento no es válido.",
  PRODUCTO_NO_EXISTE: "El producto seleccionado ya no existe.",
  CANTIDAD_INVALIDA: "La cantidad no es válida.",
  STOCK_INSUFICIENTE: "No hay stock suficiente para esa salida.",
  SIN_CAMBIOS: "El stock real coincide con el actual, no se registra ajuste.",
};

export async function registrarMovimiento(
  _prevState: MovimientoState,
  formData: FormData
): Promise<MovimientoState> {
  await requireAdmin();

  const productoRaw = formData.get("producto_id");
  const tipo = String(formData.get("tipo_movimiento") ?? "").trim();
  const cantidad = Number(formData.get("cantidad"));
  const motivo = String(formData.get("motivo") ?? "").trim() || null;

  const producto_id = Number(productoRaw);

  if (!producto_id) {
    return { error: "Selecciona un producto." };
  }
  if (!(TIPOS_MOVIMIENTO as readonly string[]).includes(tipo)) {
    return { error: "Selecciona un tipo de movimiento válido." };
  }
  if (!Number.isInteger(cantidad) || cantidad < 0) {
    return { error: "La cantidad debe ser un número entero no negativo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("registrar_movimiento_inventario", {
    p_producto_id: producto_id,
    p_tipo: tipo as TipoMovimiento,
    p_cantidad: cantidad,
    p_motivo: motivo,
  });

  if (error) {
    console.error("[inventario] error rpc:", error);
    const mensaje =
      MENSAJES_ERROR[error.message] ??
      `No se pudo registrar el movimiento. Detalle: ${error.message}`;
    return { error: mensaje };
  }

  revalidatePath("/inventario");
  revalidatePath("/inventario/movimientos");
  revalidatePath("/inventario/producto/[id]");
  revalidatePath("/productos");
  revalidatePath("/catalogo");

  return { success: "Movimiento registrado correctamente." };
}
