"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ClienteState = { error?: string } | undefined;

function paginaRedirect(formData: FormData): string {
  const p = Math.floor(Number(formData.get("pagina")));
  return p > 1 ? `/clientes?pagina=${p}` : "/clientes";
}

function mensajeError(error: { code?: string }): string {
  if (error.code === "23505") {
    return "Ya existe un cliente con ese nombre.";
  }
  return "No se pudo completar la operación. Intenta de nuevo.";
}

export async function crearCliente(
  _prevState: ClienteState,
  formData: FormData
): Promise<ClienteState> {
  const nombre = String(formData.get("nombre") ?? "").trim();

  if (!nombre) {
    return { error: "Ingresa el nombre del cliente." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").insert({ nombre });

  if (error) {
    return { error: mensajeError(error) };
  }

  revalidatePath("/clientes");
  redirect(paginaRedirect(formData));
}

export async function actualizarCliente(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const nombre = String(formData.get("nombre") ?? "").trim();

  if (!id || !nombre) return;

  const supabase = await createClient();
  await supabase.from("clientes").update({ nombre }).eq("id", id);

  revalidatePath("/clientes");
  redirect(paginaRedirect(formData));
}

export async function eliminarCliente(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));

  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").delete().eq("id", id);

  if (error && error.code === "23503") {
    redirect(`/clientes?error=enuso`);
  }

  revalidatePath("/clientes");
  redirect(paginaRedirect(formData));
}