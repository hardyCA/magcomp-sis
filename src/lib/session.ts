import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserProfile = {
  id: string;
  nombre: string;
  rol_id: number | null;
  activo: boolean;
  rol: string | null;
};

export const getProfile = cache(async (): Promise<UserProfile | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, nombre, rol_id, activo, roles(nombre)")
    .eq("id", user.id)
    .single();

  if (!data) return null;

  const rol = Array.isArray(data.roles) ? null : (data.roles as { nombre: string } | null)?.nombre ?? null;

  return {
    id: data.id,
    nombre: data.nombre,
    rol_id: data.rol_id,
    activo: data.activo,
    rol,
  };
});

export async function requireUser() {
  const profile = await getProfile();

  if (!profile || !profile.activo) {
    redirect("/login?inactivo=1");
  }

  return profile;
}

export async function requireAdmin(): Promise<UserProfile> {
  const profile = await getProfile();

  if (!profile || !profile.activo) {
    redirect("/login?inactivo=1");
  }

  if (profile.rol !== "ADMINISTRADOR") {
    redirect("/dashboard");
  }

  return profile;
}
