"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type MarcaState = { error?: string } | undefined;

function mensajeError(error: { code?: string }): string {
  if (error.code === "23505") {
    return "Ya existe una marca con ese nombre.";
  }
  return "No se pudo completar la operación. Intenta de nuevo.";
}

export async function crearMarca(
  _prevState: MarcaState,
  formData: FormData
): Promise<MarcaState> {
  await requireAdmin();
  const nombre = String(formData.get("nombre") ?? "").trim();

  if (!nombre) {
    return { error: "Ingresa el nombre de la marca." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("marcas").insert({ nombre });

  if (error) {
    return { error: mensajeError(error) };
  }

  revalidatePath("/marcas");
  redirect("/marcas");
}

export async function actualizarMarca(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const nombre = String(formData.get("nombre") ?? "").trim();

  if (!id || !nombre) return;

  const supabase = await createClient();
  await supabase.from("marcas").update({ nombre }).eq("id", id);

  revalidatePath("/marcas");
  redirect("/marcas");
}

export async function eliminarMarca(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));

  if (!id) return;

  const supabase = await createClient();
  await supabase.from("marcas").delete().eq("id", id);

  revalidatePath("/marcas");
  redirect("/marcas");
}
