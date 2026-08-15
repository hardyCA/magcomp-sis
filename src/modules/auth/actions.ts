"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string } | undefined;

export async function login(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  const next = String(formData.get("next") ?? "").trim();
  const destino = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  revalidatePath("/", "layout");
  redirect(destino);
}

export async function signup(
  _prevState: AuthState,
  _formData: FormData
): Promise<AuthState> {
  return {
    error: "El registro está desactivado. Pide una cuenta al administrador.",
  };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
