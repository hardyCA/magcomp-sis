"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type TipoCambioState = { error?: string } | undefined;
export type MonedaBaseState = { error?: string } | undefined;

export async function actualizarTipoCambio(
  _prevState: TipoCambioState,
  formData: FormData
): Promise<TipoCambioState> {
  await requireAdmin();
  const raw = String(formData.get("valor") ?? "").replace(",", ".");
  const valor = Number(raw);

  if (!Number.isFinite(valor) || valor <= 0) {
    return { error: "Ingresa un tipo de cambio válido mayor a 0 (ej. 6.96)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tipo_cambio")
    .update({ valor })
    .eq("id", 1);

  if (error) {
    return { error: "No se pudo actualizar el tipo de cambio. Intenta de nuevo." };
  }

  revalidatePath("/configuracion");
  revalidatePath("/catalogo");
  redirect("/configuracion");
}

export async function actualizarMonedaBase(
  _prevState: MonedaBaseState,
  formData: FormData
): Promise<MonedaBaseState> {
  await requireAdmin();
  const moneda = String(formData.get("moneda_principal") ?? "");

  if (moneda !== "BOB" && moneda !== "USD") {
    return { error: "Selecciona una moneda base válida." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracion")
    .update({ valor: moneda })
    .eq("clave", "moneda_principal");

  if (error) {
    return { error: "No se pudo actualizar la moneda base. Intenta de nuevo." };
  }

  revalidatePath("/configuracion");
  revalidatePath("/catalogo");
  redirect("/configuracion");
}
