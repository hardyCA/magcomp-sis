import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePermiso } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { obtenerNombresUsuarios } from "@/lib/profiles";
import { formatMoneda } from "@/utils/format";
import { type Moneda } from "@/utils/moneda";
import { EstadoBadge } from "@/app/(panel)/cotizaciones/page";
import { CotizacionAcciones } from "@/modules/cotizaciones/components/CotizacionAcciones";
import { BotonImprimir } from "@/modules/ventas/components/BotonImprimir";

type DetalleRow = {
  id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  productos: { nombre: string } | null;
};

export default async function CotizacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermiso("cotizaciones");

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: cotizacion }, { data: detalles }] = await Promise.all([
    supabase
      .from("cotizaciones")
      .select(
        "id, numero, cliente, fecha, moneda, tipo_cambio, subtotal, descuento, total, estado, venta_id, usuario_id"
      )
      .eq("id", Number(id))
      .maybeSingle(),
    supabase
      .from("detalle_cotizaciones")
      .select("id, cantidad, precio_unitario, subtotal, productos(nombre)")
      .eq("cotizacion_id", Number(id))
      .order("id"),
  ]);

  if (!cotizacion) {
    redirect("/cotizaciones");
  }

  const items = (detalles ?? []) as unknown as DetalleRow[];
  const moneda = cotizacion.moneda as Moneda;
  const convertida = cotizacion.venta_id !== null;
  const vendedorNombre = (
    await obtenerNombresUsuarios([cotizacion.usuario_id])
  ).get(cotizacion.usuario_id ?? "");

  const acciones = [];
  if (!convertida) {
    if (cotizacion.estado === "PENDIENTE") {
      acciones.push("ACEPTAR", "RECHAZAR", "VENCER");
    } else if (cotizacion.estado === "ACEPTADA") {
      acciones.push("CONVERTIR");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href="/cotizaciones" className="btn btn-ghost btn-sm">
          ← Volver
        </Link>
        <div className="flex gap-2">
          {!convertida ? (
            <Link
              href={`/cotizaciones/${cotizacion.id}/editar`}
              className="btn btn-outline btn-sm"
            >
              Editar
            </Link>
          ) : null}
          <BotonImprimir />
        </div>
      </div>

      <article className="card bg-base-100 shadow print:shadow-none">
        <div className="card-body">
          <header className="border-b border-base-200 pb-4 text-center">
            <h1 className="text-2xl font-bold tracking-tight">MAG COMP</h1>
            <p className="mt-1 text-sm text-base-content/60">
              Cotización {cotizacion.numero}
            </p>
            <div className="mt-2">
              <EstadoBadge estado={cotizacion.estado} convertida={convertida} />
            </div>
          </header>

          <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-base-content/60">Cliente:</span>{" "}
              <span className="font-semibold">{cotizacion.cliente ?? "—"}</span>
            </p>
            <p className="text-right">
              <span className="text-base-content/60">Fecha:</span>{" "}
              {new Date(cotizacion.fecha).toLocaleString("es-BO")}
            </p>
            <p>
              <span className="text-base-content/60">Elaborada por:</span>{" "}
              {vendedorNombre ?? "—"}
            </p>
            <p className="text-right">
              <span className="text-base-content/60">Tipo de cambio:</span>{" "}
              1 USD = {cotizacion.tipo_cambio} Bs
            </p>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="text-right">Cant.</th>
                  <th className="text-right">P. unitario</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.productos?.nombre ?? "—"}</td>
                    <td className="text-right">{item.cantidad}</td>
                    <td className="text-right">
                      {formatMoneda(item.precio_unitario, moneda)}
                    </td>
                    <td className="text-right font-semibold">
                      {formatMoneda(item.subtotal, moneda)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col items-end gap-1 border-t border-base-200 pt-3 text-sm">
            <div className="flex w-full max-w-xs justify-between">
              <span className="text-base-content/60">Subtotal</span>
              <span>{formatMoneda(cotizacion.subtotal, moneda)}</span>
            </div>
            {cotizacion.descuento > 0 ? (
              <div className="flex w-full max-w-xs justify-between">
                <span className="text-base-content/60">Descuento</span>
                <span className="text-error">
                  −{formatMoneda(cotizacion.descuento, moneda)}
                </span>
              </div>
            ) : null}
            <div className="flex w-full max-w-xs justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatMoneda(cotizacion.total, moneda)}</span>
            </div>
          </div>

          {convertida && cotizacion.venta_id ? (
            <div className="mt-4 rounded-box border border-base-300 p-3 text-center">
              <p className="text-sm text-base-content/60">
                Esta cotización ya se convirtió en venta.
              </p>
              <Link href={`/ventas/${cotizacion.venta_id}`} className="btn btn-primary btn-sm mt-2">
                Ver venta generada
              </Link>
            </div>
          ) : acciones.length > 0 ? (
            <div className="mt-4 border-t border-base-200 pt-4">
              <CotizacionAcciones
                id={cotizacion.id}
                acciones={acciones as "ACEPTAR"[]}
              />
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}