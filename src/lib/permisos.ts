import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const obtenerPermisos = cache(async (): Promise<string[]> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("permisos_usuario");
  return data ?? [];
});