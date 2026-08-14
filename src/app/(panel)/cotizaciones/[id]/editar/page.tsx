import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getMonedaBase, getMonedaDisplay, getTipoCambioGlobal } from "@/lib/config";
import { type Moneda } from "@/utils/moneda";
import {
  CotizacionForm,
  type ProductoCotizacion,
  type CotizacionInicial,
} from "@/modules/cotizaciones/components/CotizacionForm";

export default async function EditarCotizacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();

  const { id } = await params;
  const cotizacionId = Number(id);

  if (!Number.isInteger(cotizacionId)) {
    redirect("/cotizaciones");
  }

  const supabase = await createClient();

  const [
    { data: cotizacion },
    { data: detalles },
    { data: productos },
    { data: clientes },
    tasa,
    monedaBase,
    monedaDisplay,
  ] = await Promise.all([
    supabase
      .from("cotizaciones")
      .select("id, cliente, moneda, descuento, venta_id")
      .eq("id", cotizacionId)
      .maybeSingle(),
    supabase
      .from("detalle_cotizaciones")
      .select("producto_id, cantidad")
      .eq("cotizacion_id", cotizacionId)
      .order("id"),
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

  if (!cotizacion) {
    redirect("/cotizaciones");
  }

  if (cotizacion.venta_id !== null) {
    redirect(`/cotizaciones/${cotizacionId}`);
  }

  const inicial: CotizacionInicial = {
    id: cotizacion.id,
    cliente: cotizacion.cliente,
    moneda: cotizacion.moneda as Moneda,
    descuento: cotizacion.descuento,
    items: (detalles ?? []).map((d) => ({
      producto_id: d.producto_id,
      cantidad: d.cantidad,
    })),
  };

  const lista = (productos ?? []) as unknown as ProductoCotizacion[];
  const clientesLista = (clientes ?? []) as unknown as { id: number; nombre: string }[];
  const moneda = monedaDisplay as Moneda;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/cotizaciones/${cotizacionId}`} className="btn btn-ghost btn-sm mb-2">
          ← Volver
        </Link>
        <h1 className="text-3xl font-bold">Editar cotización</h1>
        <p className="mt-1 text-base-content/60">
          Modifica los productos, cantidades, cliente, moneda o descuento. El
          tipo de cambio guardado se conserva.
        </p>
      </div>

      <CotizacionForm
        productos={lista}
        clientes={clientesLista}
        tasa={tasa}
        monedaBase={monedaBase}
        monedaDisplay={moneda}
        inicial={inicial}
      />
    </div>
  );
}