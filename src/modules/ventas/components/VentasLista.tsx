import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { obtenerNombresUsuarios } from "@/lib/profiles";
import { formatMoneda } from "@/utils/format";
import { type Moneda } from "@/utils/moneda";
import { Paginador } from "@/components/Paginador";

const POR_PAGINA = 15;

type VentaRow = {
  id: number;
  numero: string;
  usuario_id: string;
  fecha: string;
  moneda: Moneda;
  total: number;
  descuento: number;
  clientes: { nombre: string } | null;
};

export async function VentasLista({ pagina = 1 }: { pagina?: number }) {
  const supabase = await createClient();

  const desde = (pagina - 1) * POR_PAGINA;
  const hasta = desde + POR_PAGINA - 1;

  const [{ data, count }] = await Promise.all([
    supabase
      .from("ventas")
      .select(
        "id, numero, usuario_id, fecha, moneda, total, descuento, clientes(nombre)",
        { count: "exact" }
      )
      .order("fecha", { ascending: false })
      .range(desde, hasta),
  ]);

  const ventas = (data ?? []) as unknown as VentaRow[];
  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const nombres = await obtenerNombresUsuarios(
    ventas.map((v) => v.usuario_id)
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Historial de ventas</h2>
        <span className="text-sm text-base-content/50">
          {total} venta{total === 1 ? "" : "s"}
        </span>
      </div>

      <div className="card overflow-x-auto bg-base-100 shadow">
        <table className="table">
          <thead>
            <tr>
              <th>Nº</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th className="text-right">Total</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-base-content/60">
                  Aún no hay ventas registradas.
                </td>
              </tr>
            ) : (
              ventas.map((venta) => (
                <tr key={venta.id}>
                  <td className="font-mono font-semibold">{venta.numero}</td>
                  <td className="whitespace-nowrap text-sm">
                    {new Date(venta.fecha).toLocaleString("es-BO")}
                  </td>
                  <td>
                    {Array.isArray(venta.clientes)
                      ? null
                      : venta.clientes?.nombre ?? "—"}
                  </td>
                  <td>{nombres.get(venta.usuario_id) ?? "—"}</td>
                  <td className="text-right font-semibold">
                    {formatMoneda(venta.total, venta.moneda)}
                    {venta.descuento > 0 ? (
                      <span className="ml-1 badge badge-outline badge-sm">
                        -{formatMoneda(venta.descuento, venta.moneda)}
                      </span>
                    ) : null}
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/ventas/${venta.id}`}
                      className="btn btn-ghost btn-sm"
                    >
                      Ver boleta
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Paginador pagina={pagina} totalPaginas={totalPaginas} path="/ventas/historial" />
    </section>
  );
}