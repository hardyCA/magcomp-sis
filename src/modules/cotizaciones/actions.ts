"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { esMoneda, type Moneda } from "@/utils/moneda";

export type CotizacionState = { error?: string } | undefined;
export type CotizacionAccionState = { error?: string } | undefined;

export type ItemCotizacion = { producto_id: number; cantidad: number };

export async function actualizarCotizacion(
  _prevState: CotizacionState,
  formData: FormData
): Promise<CotizacionState> {
  await requireUser();

  const id = Number(formData.get("id"));
  const itemsRaw = formData.get("items");
  const cliente = String(formData.get("cliente") ?? "").trim();
  const monedaRaw = String(formData.get("moneda") ?? "");
  const descuento = Number(formData.get("descuento")) || 0;

  if (!id) {
    return { error: "Cotización no válida." };
  }

  if (!esMoneda(monedaRaw)) {
    return { error: "Selecciona una moneda válida para la cotización." };
  }

  let items: ItemCotizacion[] = [];
  try {
    items = JSON.parse(String(itemsRaw ?? "[]")) as ItemCotizacion[];
  } catch {
    return { error: "No se pudo leer la cotización. Intenta de nuevo." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Agrega al menos un producto a la cotización." };
  }

  if (
    items.some(
      (item) =>
        !Number.isInteger(item.producto_id) ||
        !Number.isInteger(item.cantidad) ||
        item.cantidad <= 0
    )
  ) {
    return { error: "Las cantidades de la cotización no son válidas." };
  }

  if (!Number.isFinite(descuento) || descuento < 0) {
    return { error: "El descuento no es válido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("actualizar_cotizacion", {
    p_cotizacion_id: id,
    p_items: items,
    p_cliente: cliente || null,
    p_moneda: monedaRaw as Moneda,
    p_descuento: descuento,
  });

  if (error || !data?.id) {
    return { error: errorDe(error?.message) };
  }

  revalidatePath(`/cotizaciones/${data.id}`);
  revalidatePath("/cotizaciones");
  redirect(`/cotizaciones/${data.id}`);
}

const MENSAJES_ERROR: Record<string, string> = {
  NO_AUTORIZADO: "Tu usuario no está activo para esta acción.",
  MONEDA_INVALIDA: "La moneda seleccionada no es válida.",
  DESCUENTO_INVALIDO: "El descuento no puede ser mayor al subtotal.",
  COTIZACION_VACIA: "Agrega al menos un producto a la cotización.",
  ITEM_INVALIDO: "Alguno de los productos de la cotización no es válido.",
  CANTIDAD_INVALIDA: "Las cantidades de la cotización no son válidas.",
  PRODUCTO_NO_EXISTE: "Uno de los productos ya no existe.",
  TIPO_CAMBIO_NO_CONFIGURADO:
    "El tipo de cambio no está configurado. Ajusta la configuración.",
  COTIZACION_NO_EXISTE: "La cotización ya no existe.",
  ESTADO_INVALIDO: "El estado indicado no es válido.",
  YA_CONVERTIDA: "Esta cotización ya se convirtió en una venta.",
  COTIZACION_NO_ACEPTADA:
    "La cotización debe estar ACEPTADA antes de convertirla en venta.",
  COTIZACION_NO_EDITABLE:
    "Esta cotización no se puede editar (vencida o rechazada).",
};

function errorDe(mensaje: string | undefined): string {
  const texto = mensaje ?? "";
  if (texto.startsWith("STOCK_INSUFICIENTE")) {
    const nombre = texto.split(":")[1] ?? "";
    return nombre
      ? `Stock insuficiente de "${nombre}".`
      : "No hay stock suficiente para uno de los productos.";
  }
  return (
    MENSAJES_ERROR[texto] ??
    `No se pudo completar la acción. Intenta de nuevo. (${texto})`
  );
}

export async function crearCotizacion(
  _prevState: CotizacionState,
  formData: FormData
): Promise<CotizacionState> {
  await requireUser();

  const itemsRaw = formData.get("items");
  const cliente = String(formData.get("cliente") ?? "").trim();
  const monedaRaw = String(formData.get("moneda") ?? "");
  const descuento = Number(formData.get("descuento")) || 0;

  if (!esMoneda(monedaRaw)) {
    return { error: "Selecciona una moneda válida para la cotización." };
  }

  let items: ItemCotizacion[] = [];
  try {
    items = JSON.parse(String(itemsRaw ?? "[]")) as ItemCotizacion[];
  } catch {
    return { error: "No se pudo leer la cotización. Intenta de nuevo." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Agrega al menos un producto a la cotización." };
  }

  if (
    items.some(
      (item) =>
        !Number.isInteger(item.producto_id) ||
        !Number.isInteger(item.cantidad) ||
        item.cantidad <= 0
    )
  ) {
    return { error: "Las cantidades de la cotización no son válidas." };
  }

  if (!Number.isFinite(descuento) || descuento < 0) {
    return { error: "El descuento no es válido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("crear_cotizacion", {
    p_items: items,
    p_cliente: cliente || null,
    p_moneda: monedaRaw as Moneda,
    p_descuento: descuento,
  });

  if (error || !data?.id) {
    return { error: errorDe(error?.message) };
  }

  revalidatePath("/cotizaciones");
  redirect(`/cotizaciones/${data.id}`);
}

export async function ejecutarAccionCotizacion(
  _prevState: CotizacionAccionState,
  formData: FormData
): Promise<CotizacionAccionState> {
  await requireUser();

  const id = Number(formData.get("id"));
  const accion = String(formData.get("accion") ?? "");

  if (!id) {
    return { error: "Cotización no válida." };
  }

  const supabase = await createClient();

  if (accion === "CONVERTIR") {
    const { data, error } = await supabase.rpc("convertir_cotizacion_a_venta", {
      p_cotizacion_id: id,
    });

    if (error || !data?.id) {
      return { error: errorDe(error?.message) };
    }

    revalidatePath(`/cotizaciones/${id}`);
    revalidatePath("/cotizaciones");
    revalidatePath("/inventario");
    revalidatePath("/inventario/movimientos");
    revalidatePath("/productos");
    revalidatePath("/catalogo");
    redirect(`/ventas/${data.id}`);
  }

  const { error } = await supabase.rpc("cambiar_estado_cotizacion", {
    p_cotizacion_id: id,
    p_estado: accion as "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "VENCIDA",
  });

  if (error) {
    return { error: errorDe(error?.message) };
  }

  revalidatePath(`/cotizaciones/${id}`);
  revalidatePath("/cotizaciones");
  redirect(`/cotizaciones/${id}`);
}