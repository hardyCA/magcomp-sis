import Link from "next/link";
import { requirePermiso } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { formatMoneda } from "@/utils/format";
import { type Moneda } from "@/utils/moneda";
import { ESTADOS_COTIZACION } from "@/modules/cotizaciones/estados";

type CotizacionRow = {
  id: number;
  numero: string;
  cliente: string | null;
  fecha: string;
  moneda: Moneda;
  total: number;
  estado: string;
  venta_id: number | null;
};

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string | string[] }>;
}) {
  await requirePermiso("cotizaciones");

  const sp = await searchParams;
  const estadoRaw = Array.isArray(sp.estado) ? sp.estado[0] ?? "" : sp.estado ?? "";
  const estado = ESTADOS_COTIZACION.includes(estadoRaw as never)
    ? estadoRaw
    : "";

  const supabase = await createClient();

  let query = supabase
    .from("cotizaciones")
    .select("id, numero, cliente, fecha, moneda, total, estado, venta_id")
    .order("fecha", { ascending: false });

  if (estado) {
    query = query.eq("estado", estado as "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "VENCIDA");
  }

  const { data } = await query;
  const cotizaciones = (data ?? []) as unknown as CotizacionRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cotizaciones</h1>
          <p className="mt-1 text-base-content/60">
            Gestiona cotizaciones a clientes. Una cotización aceptada se puede
            convertir en venta.
          </p>
        </div>
        <Link href="/cotizaciones/nueva" className="btn btn-primary">
          Nueva cotización
        </Link>
      </div>

      <form method="get" className="card w-full max-w-xs bg-base-100 shadow">
        <div className="card-body py-4">
          <label className="form-control">
            <div className="label">
              <span className="label-text">Filtrar por estado</span>
            </div>
            <div className="flex gap-2">
              <select
                name="estado"
                defaultValue={estado}
                className="select select-bordered w-full"
              >
                <option value="">Todos</option>
                {ESTADOS_COTIZACION.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn-outline">
                Filtrar
              </button>
            </div>
          </label>
        </div>
      </form>

      <div className="card overflow-x-auto bg-base-100 shadow">
        <table className="table">
          <thead>
            <tr>
              <th>Nº</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Moneda</th>
              <th className="text-right">Total</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cotizaciones.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-base-content/60">
                  No hay cotizaciones
                  {estado ? ` en estado ${estado}` : ""}.
                </td>
              </tr>
            ) : (
              cotizaciones.map((cotizacion) => (
                <tr key={cotizacion.id}>
                  <td className="font-mono font-semibold">{cotizacion.numero}</td>
                  <td>{cotizacion.cliente ?? "—"}</td>
                  <td className="whitespace-nowrap text-sm">
                    {new Date(cotizacion.fecha).toLocaleDateString("es-BO")}
                  </td>
                  <td>{cotizacion.moneda}</td>
                  <td className="text-right font-semibold">
                    {formatMoneda(cotizacion.total, cotizacion.moneda)}
                  </td>
                  <td>
                    <EstadoBadge estado={cotizacion.estado} convertida={cotizacion.venta_id !== null} />
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/cotizaciones/${cotizacion.id}`}
                      className="btn btn-ghost btn-sm"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EstadoBadge({
  estado,
  convertida = false,
}: {
  estado: string;
  convertida?: boolean;
}) {
  const color =
    estado === "PENDIENTE"
      ? "badge-warning"
      : estado === "ACEPTADA"
        ? "badge-success"
        : estado === "RECHAZADA"
          ? "badge-error"
          : "badge-neutral";

  return (
    <span className="flex items-center gap-1">
      <span className={`badge ${color}`}>{estado}</span>
      {convertida ? (
        <span className="badge badge-info badge-sm">Vendida</span>
      ) : null}
    </span>
  );
}