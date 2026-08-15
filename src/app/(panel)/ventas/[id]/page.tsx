import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePermiso } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { obtenerNombresUsuarios } from "@/lib/profiles";
import { formatMoneda } from "@/utils/format";
import { type Moneda } from "@/utils/moneda";
import { BotonImprimir } from "@/modules/ventas/components/BotonImprimir";
import { BotonAnular } from "@/modules/ventas/components/BotonAnular";

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
  const profile = await requirePermiso("ventas");
  const esAdmin = profile.rol === "ADMINISTRADOR";

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: venta }, { data: detalles }] = await Promise.all([
    supabase
      .from("ventas")
      .select(
        "id, numero, fecha, moneda, tipo_cambio, subtotal, descuento, total, usuario_id, cliente_id, estado, motivo_anulacion, anulada_por, anulada_en, clientes(nombre)"
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
  const [vendedor, anulador] = await Promise.all([
    obtenerNombresUsuarios([venta.usuario_id]),
    venta.anulada_por ? obtenerNombresUsuarios([venta.anulada_por]) : Promise.resolve(new Map<string, string>()),
  ]);
  const nombreVendedor = vendedor.get(venta.usuario_id ?? "");
  const nombreAnulador = anulador.get(venta.anulada_por ?? "");
  const cliente = Array.isArray(venta.clientes)
    ? null
    : venta.clientes?.nombre ?? null;

  const anulada = venta.estado === "ANULADA";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href="/ventas" className="btn btn-ghost btn-sm">
          ← Nueva venta
        </Link>
        <div className="flex items-center gap-1">
          {esAdmin && !anulada ? (
            <BotonAnular ventaId={venta.id} numero={venta.numero} />
          ) : null}
          <BotonImprimir />
        </div>
      </div>

      {anulada ? (
        <div className="mb-4 rounded-box border-2 border-error bg-error/10 p-4 text-center">
          <p className="text-lg font-bold tracking-wide text-error">
            VENTA ANULADA
          </p>
          {venta.motivo_anulacion ? (
            <p className="mt-1 text-sm text-base-content/70">
              Motivo: {venta.motivo_anulacion}
            </p>
          ) : null}
          {venta.anulada_en ? (
            <p className="mt-1 text-xs text-base-content/60">
              Anulada el {new Date(venta.anulada_en).toLocaleString("es-BO")}
              {nombreAnulador ? ` por ${nombreAnulador}` : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      <article className="card bg-base-100 shadow print:shadow-none">
        <div className="card-body relative">
          {anulada ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <span className="rotate-[-20deg] rounded-box border-4 border-error px-6 py-2 text-4xl font-black tracking-widest text-error/40">
                ANULADA
              </span>
            </div>
          ) : null}
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
              {nombreVendedor ?? "—"}
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
            {anulada
              ? "Venta anulada — el stock fue devuelto al inventario"
              : "Gracias por su compra"}
          </p>
        </div>
      </article>
    </div>
  );
}