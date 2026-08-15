"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { esMoneda, type Moneda } from "@/utils/moneda";

export type VentaState = { error?: string } | undefined;

export type AnularVentaState = { error?: string } | undefined;

export type ItemVenta = { producto_id: number; cantidad: number };

const MENSAJES_ERROR: Record<string, string> = {
  NO_AUTORIZADO: "Tu usuario no está activo para registrar ventas.",
  MONEDA_INVALIDA: "La moneda seleccionada no es válida.",
  DESCUENTO_INVALIDO: "El descuento no puede ser mayor al subtotal.",
  VENTA_VACIA: "Agrega al menos un producto a la venta.",
  ITEM_INVALIDO: "Alguno de los productos de la venta no es válido.",
  CANTIDAD_INVALIDA: "Las cantidades de la venta no son válidas.",
  PRODUCTO_NO_EXISTE: "Uno de los productos ya no existe.",
  TIPO_CAMBIO_NO_CONFIGURADO:
    "El tipo de cambio no está configurado. Ajusta la configuración.",
};

export async function registrarVenta(
  _prevState: VentaState,
  formData: FormData
): Promise<VentaState> {
  await requireUser();

  const itemsRaw = formData.get("items");
  const monedaRaw = String(formData.get("moneda") ?? "");
  const descuento = Number(formData.get("descuento")) || 0;
  const cliente = String(formData.get("cliente") ?? "").trim() || null;

  if (!esMoneda(monedaRaw)) {
    return { error: "Selecciona una moneda válida para la venta." };
  }

  let items: ItemVenta[] = [];
  try {
    items = JSON.parse(String(itemsRaw ?? "[]")) as ItemVenta[];
  } catch {
    return { error: "No se pudo leer la venta. Intenta de nuevo." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Agrega al menos un producto a la venta." };
  }

  if (
    items.some(
      (item) =>
        !Number.isInteger(item.producto_id) ||
        !Number.isInteger(item.cantidad) ||
        item.cantidad <= 0
    )
  ) {
    return { error: "Las cantidades de la venta no son válidas." };
  }

  if (!Number.isFinite(descuento) || descuento < 0) {
    return { error: "El descuento no es válido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("registrar_venta", {
    p_items: items,
    p_moneda: monedaRaw as Moneda,
    p_cliente: cliente,
    p_descuento: descuento,
  });

  if (error || !data?.id) {
    console.error("[ventas] error al registrar venta:", error);
    const mensaje = error?.message ?? "";
    if (mensaje.startsWith("STOCK_INSUFICIENTE")) {
      const nombre = mensaje.split(":")[1] ?? "";
      return {
        error: nombre
          ? `Stock insuficiente de "${nombre}".`
          : "No hay stock suficiente para uno de los productos.",
      };
    }
    return {
      error:
        MENSAJES_ERROR[mensaje] ??
        `No se pudo registrar la venta. Detalle: ${mensaje || "Error desconocido"}`,
    };
  }

  revalidatePath("/inventario");
  revalidatePath("/inventario/movimientos");
  revalidatePath("/productos");
  revalidatePath("/catalogo");
  revalidatePath("/ventas");

  redirect(`/ventas/${data.id}`);
}

export async function anularVenta(
  _prevState: AnularVentaState,
  formData: FormData
): Promise<AnularVentaState> {
  await requireAdmin();

  const ventaId = Number(formData.get("venta_id"));
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (!Number.isInteger(ventaId)) {
    return { error: "La venta no es válida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("anular_venta", {
    p_venta_id: ventaId,
    p_motivo: motivo || null,
  });

  if (error) {
    console.error("[ventas] error al anular venta:", error);
    const mensaje = error?.message ?? "";
    if (mensaje === "VENTA_YA_ANULADA") {
      return { error: "Esta venta ya fue anulada." };
    }
    if (mensaje === "VENTA_NO_EXISTE") {
      return { error: "La venta ya no existe." };
    }
    return {
      error:
        MENSAJES_ERROR[mensaje] ??
        `No se pudo anular la venta. Detalle: ${mensaje || "Error desconocido"}`,
    };
  }

  revalidatePath("/inventario");
  revalidatePath("/inventario/movimientos");
  revalidatePath("/productos");
  revalidatePath("/catalogo");
  revalidatePath("/ventas/historial");
  revalidatePath("/reportes");

  redirect(`/ventas/${ventaId}`);
}