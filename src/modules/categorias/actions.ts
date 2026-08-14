"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CategoriaState = { error?: string } | undefined;

function mensajeError(error: { code?: string }): string {
  if (error.code === "23505") {
    return "Ya existe una categoría con ese nombre.";
  }
  return "No se pudo completar la operación. Intenta de nuevo.";
}

export async function crearCategoria(
  _prevState: CategoriaState,
  formData: FormData
): Promise<CategoriaState> {
  const nombre = String(formData.get("nombre") ?? "").trim();

  if (!nombre) {
    return { error: "Ingresa el nombre de la categoría." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categorias").insert({ nombre });

  if (error) {
    return { error: mensajeError(error) };
  }

  revalidatePath("/categorias");
  redirect("/categorias");
}

export async function actualizarCategoria(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const nombre = String(formData.get("nombre") ?? "").trim();

  if (!id || !nombre) return;

  const supabase = await createClient();
  await supabase.from("categorias").update({ nombre }).eq("id", id);

  revalidatePath("/categorias");
  redirect("/categorias");
}

export async function eliminarCategoria(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));

  if (!id) return;

  const supabase = await createClient();
  await supabase.from("categorias").delete().eq("id", id);

  revalidatePath("/categorias");
  redirect("/categorias");
}
