import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { esMoneda, type Moneda } from "@/utils/moneda";

export const TASA_DEFECTO = 6.96;

export const getTipoCambioGlobal = cache(async (): Promise<number> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tipo_cambio")
    .select("valor")
    .eq("id", 1)
    .maybeSingle();
  return data?.valor ?? TASA_DEFECTO;
});

export const getMonedaBase = cache(async (): Promise<Moneda> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "moneda_principal")
    .maybeSingle();
  return esMoneda(data?.valor) ? data.valor : "BOB";
});

export const getMonedaDisplay = cache(async (): Promise<Moneda> => {
  const cookieStore = await cookies();
  const valor = cookieStore.get("moneda_display")?.value;
  if (esMoneda(valor)) {
    return valor;
  }
  return getMonedaBase();
});
