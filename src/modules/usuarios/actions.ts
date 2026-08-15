"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function crearUsuario(
  _prevState: UsuarioState,
  formData: FormData
): Promise<UsuarioState> {
  await requireAdmin();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rolRaw = String(formData.get("rol_id") ?? "").trim();

  if (!nombre || !email || !password) {
    return { error: "Completa nombre, correo y contraseña." };
  }

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const rol_id = Number(rolRaw);
  if (!Number.isInteger(rol_id)) {
    return { error: "Selecciona un rol para el usuario." };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  });

  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes("already registered")) {
      return { error: "Ya existe un usuario con ese correo." };
    }
    return { error: "No se pudo crear el usuario. Intenta de nuevo." };
  }

  const supabase = await createClient();
  const { error: perfilError } = await supabase.from("profiles").upsert({
    id: data.user.id,
    nombre,
    rol_id,
    activo: true,
  });

  if (perfilError) {
    return { error: "Usuario creado, pero no se pudo asignar el rol." };
  }

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function guardarPermisosRol(
  _prevState: UsuarioState,
  formData: FormData
): Promise<UsuarioState> {
  await requireAdmin();

  const rolRaw = String(formData.get("rol_id") ?? "").trim();
  const rol_id = Number(rolRaw);
  if (!Number.isInteger(rol_id)) {
    return { error: "Rol no válido." };
  }

  const claves = formData.getAll("modulo").map(String);

  const supabase = await createClient();

  const { data: modulos } = await supabase.from("modulos").select("id, clave");
  if (!modulos) {
    return { error: "No se pudieron cargar los módulos." };
  }

  const permitidos = modulos.filter((m) => claves.includes(m.clave));

  const { error: deleteError } = await supabase
    .from("rol_permisos")
    .delete()
    .eq("rol_id", rol_id);

  if (deleteError) {
    return { error: "No se pudo guardar la matriz de permisos." };
  }

  if (permitidos.length > 0) {
    const { error: insertError } = await supabase
      .from("rol_permisos")
      .insert(permitidos.map((m) => ({ rol_id, modulo_id: m.id })));

    if (insertError) {
      return { error: "No se pudo guardar la matriz de permisos." };
    }
  }

  revalidatePath("/usuarios");
  redirect("/usuarios");
}