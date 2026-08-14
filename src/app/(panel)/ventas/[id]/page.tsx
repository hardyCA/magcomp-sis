import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { obtenerNombresUsuarios } from "@/lib/profiles";
import { formatMoneda } from "@/utils/format";
import { type Moneda } from "@/utils/moneda";
import { BotonImprimir } from "@/modules/ventas/components/BotonImprimir";

type DetalleRow = {
  id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  productos: { nombre: string } | null;
};

export default async function VentaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: venta }, { data: detalles }] = await Promise.all([
    supabase
      .from("ventas")
      .select(
        "id, numero, fecha, moneda, tipo_cambio, subtotal, descuento, total, usuario_id, cliente_id, clientes(nombre)"
      )
      .eq("id", Number(id))
      .maybeSingle(),
    supabase
      .from("detalle_ventas")
      .select("id, cantidad, precio_unitario, subtotal, productos(nombre)")
      .eq("venta_id", Number(id))
      .order("id"),
  ]);

  if (!venta) {
    redirect("/ventas");
  }

  const items = (detalles ?? []) as unknown as DetalleRow[];
  const moneda = venta.moneda as Moneda;
  const vendedor = (
    await obtenerNombresUsuarios([venta.usuario_id])
  ).get(venta.usuario_id ?? "");
  const cliente = Array.isArray(venta.clientes)
    ? null
    : venta.clientes?.nombre ?? null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href="/ventas" className="btn btn-ghost btn-sm">
          ← Nueva venta
        </Link>
        <BotonImprimir />
      </div>

      <article className="card bg-base-100 shadow print:shadow-none">
        <div className="card-body">
          <header className="border-b border-base-200 pb-4 text-center">
            <h1 className="text-2xl font-bold tracking-tight">MAG COMP</h1>
            <p className="mt-1 text-sm text-base-content/60">Boleta de venta</p>
          </header>

          <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-base-content/60">Nº:</span>{" "}
              <span className="font-semibold">{venta.numero}</span>
            </p>
            <p className="text-right">
              <span className="text-base-content/60">Fecha:</span>{" "}
              {new Date(venta.fecha).toLocaleString("es-BO")}
            </p>
            <p>
              <span className="text-base-content/60">Cliente:</span>{" "}
              <span className="font-semibold">{cliente ?? "—"}</span>
            </p>
            <p>
              <span className="text-base-content/60">Vendedor:</span>{" "}
              {vendedor ?? "—"}
            </p>
            <p className="text-right">
              <span className="text-base-content/60">Tipo de cambio:</span>{" "}
              1 USD = {venta.tipo_cambio} Bs
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
              <span>{formatMoneda(venta.subtotal, moneda)}</span>
            </div>
            {venta.descuento > 0 ? (
              <div className="flex w-full max-w-xs justify-between">
                <span className="text-base-content/60">Descuento</span>
                <span className="text-error">
                  −{formatMoneda(venta.descuento, moneda)}
                </span>
              </div>
            ) : null}
            <div className="flex w-full max-w-xs justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatMoneda(venta.total, moneda)}</span>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-base-content/50">
            Gracias por su compra
          </p>
        </div>
      </article>
    </div>
  );
}