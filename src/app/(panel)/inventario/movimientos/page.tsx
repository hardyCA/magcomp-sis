import Link from "next/link";
import { requirePermiso } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { obtenerNombresUsuarios } from "@/lib/profiles";
import { TIPOS_MOVIMIENTO } from "@/modules/inventario/constantes";

export const dynamic = "force-dynamic";

type MovimientoRow = {
  id: number;
  tipo_movimiento: string;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo: string | null;
  created_at: string;
  productos: { nombre: string; imagen: string | null } | null;
  usuario_id: string | null;
};

type SearchParams = {
  tipo?: string | string[];
  producto?: string | string[];
  desde?: string | string[];
  hasta?: string | string[];
  pagina?: string | string[];
  porPagina?: string | string[];
};

const TAMANOS_PAGINA = [10, 25, 50, 100];

function soloUno(valor: string | string[] | undefined): string {
  return Array.isArray(valor) ? valor[0] ?? "" : valor ?? "";
}

function queryEnlace(
  filtros: {
    tipo: string;
    producto: string;
    desde: string;
    hasta: string;
    porPagina: number;
  },
  pagina: number
): string {
  const params = new URLSearchParams();
  if (filtros.tipo) params.set("tipo", filtros.tipo);
  if (filtros.producto) params.set("producto", filtros.producto);
  if (filtros.desde) params.set("desde", filtros.desde);
  if (filtros.hasta) params.set("hasta", filtros.hasta);
  params.set("porPagina", String(filtros.porPagina));
  if (pagina > 1) params.set("pagina", String(pagina));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const profile = await requirePermiso("inventario");

  const sp = await searchParams;
  const tipo = soloUno(sp.tipo);
  const producto = soloUno(sp.producto);
  const desde = soloUno(sp.desde);
  const hasta = soloUno(sp.hasta);

  const productoNum = Number(producto);
  const aplicarProducto = producto !== "" && Number.isInteger(productoNum);

  const paginaRaw = Number(soloUno(sp.pagina));
  const pagina = Number.isInteger(paginaRaw) && paginaRaw > 0 ? paginaRaw : 1;
  const porPaginaRaw = Number(soloUno(sp.porPagina));
  const porPagina = TAMANOS_PAGINA.includes(porPaginaRaw)
    ? porPaginaRaw
    : 10;

  const supabase = await createClient();

  let query = supabase
    .from("movimientos_inventario")
    .select(
      "id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, created_at, productos(nombre, imagen), usuario_id",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (tipo) {
    query = query.eq(
      "tipo_movimiento",
      tipo as "ENTRADA" | "SALIDA" | "AJUSTE" | "VENTA"
    );
  }
  if (aplicarProducto) {
    query = query.eq("producto_id", productoNum);
  }
  if (desde) {
    query = query.gte("created_at", new Date(`${desde}T00:00:00`).toISOString());
  }
  if (hasta) {
    query = query.lte("created_at", new Date(`${hasta}T23:59:59`).toISOString());
  }

  const desdeRow = (pagina - 1) * porPagina;
  query = query.range(desdeRow, desdeRow + porPagina - 1);

  const [{ data: movimientos, count }, { data: productos }] =
    await Promise.all([
      query,
      supabase.from("productos").select("id, nombre").order("nombre"),
    ]);

  const lista = (movimientos ?? []) as unknown as MovimientoRow[];
  const esAdmin = profile.rol === "ADMINISTRADOR";
  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina + 1;
  const fin = Math.min(desdeRow + lista.length, total);

  const nombres = await obtenerNombresUsuarios(
    lista.map((m) => m.usuario_id)
  );

  const filtros = { tipo, producto, desde, hasta, porPagina };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Movimientos de inventario</h1>
          <p className="mt-1 text-base-content/60">
            Historial de entradas, salidas y ajustes de stock.
          </p>
        </div>
        <span className="badge badge-lg badge-outline">
          {total} movimiento{total === 1 ? "" : "s"}
        </span>
      </div>

      <form method="get" className="card bg-base-100 shadow">
        <div className="card-body grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="form-control">
            <div className="label">
              <span className="label-text">Tipo</span>
            </div>
            <select
              name="tipo"
              defaultValue={tipo}
              className="select select-bordered w-full"
            >
              <option value="">Todos</option>
              {TIPOS_MOVIMIENTO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control">
            <div className="label">
              <span className="label-text">Producto</span>
            </div>
            <select
              name="producto"
              defaultValue={producto}
              className="select select-bordered w-full"
            >
              <option value="">Todos</option>
              {productos?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control">
            <div className="label">
              <span className="label-text">Desde</span>
            </div>
            <input
              type="date"
              name="desde"
              defaultValue={desde}
              className="input input-bordered w-full"
            />
          </label>

          <label className="form-control">
            <div className="label">
              <span className="label-text">Hasta</span>
            </div>
            <input
              type="date"
              name="hasta"
              defaultValue={hasta}
              className="input input-bordered w-full"
            />
          </label>

          <label className="form-control">
            <div className="label">
              <span className="label-text">Mostrar</span>
            </div>
            <select
              name="porPagina"
              defaultValue={porPagina}
              className="select select-bordered w-full"
            >
              {TAMANOS_PAGINA.map((n) => (
                <option key={n} value={n}>
                  {n} por página
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button type="submit" className="btn btn-primary w-full">
              Filtrar
            </button>
          </div>
        </div>
      </form>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th className="text-right">Cantidad</th>
                  <th className="text-right">Anterior → Nuevo</th>
                  <th>Usuario</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-base-content/60"
                    >
                      No hay movimientos con esos filtros.
                    </td>
                  </tr>
                ) : (
                  lista.map((m) => (
                    <tr key={m.id}>
                      <td className="whitespace-nowrap text-sm">
                        {new Date(m.created_at).toLocaleString("es-BO")}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {m.productos?.imagen ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.productos.imagen}
                              alt={m.productos.nombre}
                              className="h-9 w-9 shrink-0 rounded-box border border-base-300 object-cover"
                            />
                          ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-box border border-dashed border-base-300 bg-base-200 text-base-content/40">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                              </svg>
                            </span>
                          )}
                          <span className="font-medium">
                            {m.productos?.nombre ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${badgeTipo(m.tipo_movimiento)}`}>
                          {m.tipo_movimiento}
                        </span>
                      </td>
                      <td className="text-right font-semibold">
                        {m.tipo_movimiento === "SALIDA" ? "-" : "+"}
                        {m.cantidad}
                      </td>
                      <td className="whitespace-nowrap text-right font-mono text-sm">
                        {m.stock_anterior} → {m.stock_nuevo}
                      </td>
                      <td className="text-sm">
                        {esAdmin
                          ? nombres.get(m.usuario_id ?? "") ?? "—"
                          : "Tú"}
                      </td>
                      <td className="max-w-64 truncate text-sm text-base-content/70">
                        {m.motivo ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {total > 0 ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-base-content/60">
                Mostrando{" "}
                <span className="font-semibold text-base-content">
                  {inicio}–{fin}
                </span>{" "}
                de {total}
              </p>

              <div className="join">
                <Link
                  href={`/inventario/movimientos${queryEnlace(
                    filtros,
                    paginaActual - 1
                  )}`}
                  className={`join-item btn btn-sm ${
                    paginaActual <= 1 ? "btn-disabled pointer-events-none" : ""
                  }`}
                >
                  Anterior
                </Link>
                <button
                  type="button"
                  className="join-item btn btn-sm no-animation"
                  disabled
                >
                  Página {paginaActual} de {totalPaginas}
                </button>
                <Link
                  href={`/inventario/movimientos${queryEnlace(
                    filtros,
                    paginaActual + 1
                  )}`}
                  className={`join-item btn btn-sm ${
                    paginaActual >= totalPaginas
                      ? "btn-disabled pointer-events-none"
                      : ""
                  }`}
                >
                  Siguiente
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function badgeTipo(tipo: string) {
  if (tipo === "ENTRADA") return "badge-success";
  if (tipo === "SALIDA") return "badge-warning";
  if (tipo === "AJUSTE") return "badge-info";
  return "badge-neutral";
}