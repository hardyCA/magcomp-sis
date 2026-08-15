"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type UsuarioState = { error?: string } | undefined;

export async function actualizarUsuario(
  _prevState: UsuarioState,
  formData: FormData
): Promise<UsuarioState> {
  const admin = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const rolRaw = String(formData.get("rol_id") ?? "").trim();
  const activo = formData.get("activo") === "1";

  if (!id) {
    return { error: "Usuario no válido." };
  }

  if (!nombre) {
    return { error: "El nombre no puede quedar vacío." };
  }

  const rol_id = Number(rolRaw);
  if (!Number.isInteger(rol_id)) {
    return { error: "Selecciona un rol válido." };
  }

  const supabase = await createClient();

  const { data: rol } = await supabase
    .from("roles")
    .select("id, nombre")
    .eq("id", rol_id)
    .single();

  if (!rol) {
    return { error: "El rol seleccionado no existe." };
  }

  // Un administrador no puede quitarse permisos ni desactivarse a sí mismo.
  if (id === admin.id && (rol.nombre !== "ADMINISTRADOR" || !activo)) {
    return { error: "No puedes cambiar tu propio rol ni desactivar tu cuenta." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ nombre, rol_id, activo })
    .eq("id", id);

  if (error) {
    return { error: "No se pudo actualizar el usuario. Intenta de nuevo." };
  }

  revalidatePath("/usuarios");
  redirect("/usuarios");
}