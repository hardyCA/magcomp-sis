import Link from "next/link";
import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getMonedaBase, getMonedaDisplay, getTipoCambioGlobal } from "@/lib/config";
import { type Moneda } from "@/utils/moneda";
import {
  CotizacionForm,
  type ProductoCotizacion,
} from "@/modules/cotizaciones/components/CotizacionForm";

export default async function NuevaCotizacionPage() {
  await requireUser();

  const supabase = await createClient();

  const [{ data: productos }, { data: clientes }, tasa, monedaBase, monedaDisplay] =
    await Promise.all([
      supabase
        .from("productos")
        .select("id, nombre, codigo_barras, imagen, precio_venta, moneda, stock")
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("clientes")
        .select("id, nombre")
        .order("nombre"),
      getTipoCambioGlobal(),
      getMonedaBase(),
      getMonedaDisplay(),
    ]);

  const lista = (productos ?? []) as unknown as ProductoCotizacion[];
  const clientesLista = (clientes ?? []) as unknown as { id: number; nombre: string }[];
  const moneda = monedaDisplay as Moneda;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/cotizaciones" className="btn btn-ghost btn-sm mb-2">
          ← Volver
        </Link>
        <h1 className="text-3xl font-bold">Nueva cotización</h1>
        <p className="mt-1 text-base-content/60">
          Agrega productos y cantidades. La cotización no descuenta stock hasta
          que se convierta en venta.
        </p>
      </div>

      <CotizacionForm
        productos={lista}
        clientes={clientesLista}
        tasa={tasa}
        monedaBase={monedaBase}
        monedaDisplay={moneda}
      />
    </div>
  );
}