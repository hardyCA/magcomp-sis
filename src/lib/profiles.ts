import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function obtenerNombresUsuarios(
  ids: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const unicos = Array.from(
    new Set(
      ids.filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  if (unicos.length === 0) {
    return new Map();
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, nombre")
    .in("id", unicos);

  return new Map((data ?? []).map((p) => [p.id, p.nombre]));
}
