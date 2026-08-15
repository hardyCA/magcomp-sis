import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermiso } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { obtenerNombresUsuarios } from "@/lib/profiles";
import { MovimientoForm } from "@/modules/inventario/components/MovimientoForm";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";

export const dynamic = "force-dynamic";

const TAMANOS_PAGINA = [10, 25, 50, 100];

type RawProducto = {
  id: number;
  nombre: string;
  codigo_barras: string | null;
  imagen: string | null;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  categorias: { nombre: string } | null;
  marcas: { nombre: string } | null;
};

type RawMovimiento = {
  id: number;
  tipo_movimiento: string;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo: string | null;
  created_at: string;
  usuario_id: string | null;
};

type SearchParams = {
  pagina?: string | string[];
  porPagina?: string | string[];
};

function soloUno(valor: string | string[] | undefined): string {
  return Array.isArray(valor) ? valor[0] ?? "" : valor ?? "";
}

function queryEnlace(porPagina: number, pagina: number): string {
  const params = new URLSearchParams();
  params.set("porPagina", String(porPagina));
  if (pagina > 1) params.set("pagina", String(pagina));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export default async function ProductoInventarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const profile = await requirePermiso("inventario");

  const { id } = await params;
  const productoId = Number(id);

  if (!Number.isInteger(productoId)) {
    notFound();
  }

  const sp = await searchParams;
  const paginaRaw = Number(soloUno(sp.pagina));
  const pagina = Number.isInteger(paginaRaw) && paginaRaw > 0 ? paginaRaw : 1;
  const porPaginaRaw = Number(soloUno(sp.porPagina));
  const porPagina = TAMANOS_PAGINA.includes(porPaginaRaw)
    ? porPaginaRaw
    : 10;

  const esAdmin = profile.rol === "ADMINISTRADOR";
  const supabase = await createClient();

  const desde = (pagina - 1) * porPagina;

  const [{ data: producto }, { data: movimientos, count }] =
    await Promise.all([
      supabase
        .from("productos")
        .select(
          "id, nombre, codigo_barras, imagen, stock, stock_minimo, activo, categorias(nombre), marcas(nombre)"
        )
        .eq("id", productoId)
        .maybeSingle(),
      supabase
        .from("movimientos_inventario")
        .select(
          "id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, created_at, usuario_id",
          { count: "exact" }
        )
        .eq("producto_id", productoId)
        .order("created_at", { ascending: false })
        .range(desde, desde + porPagina - 1),
    ]);

  if (!producto) {
    notFound();
  }

  const detalle = producto as unknown as RawProducto;
  const historial = (movimientos ?? []) as unknown as RawMovimiento[];
  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina + 1;
  const fin = Math.min(desde + historial.length, total);

  const nombres = await obtenerNombresUsuarios(
    historial.map((m) => m.usuario_id)
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/inventario" className="link link-primary text-sm">
          ← Volver a inventario
        </Link>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            {detalle.imagen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={detalle.imagen}
                alt={detalle.nombre}
                className="h-20 w-20 shrink-0 rounded-box border border-base-300 object-cover"
              />
            ) : (
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-box border border-dashed border-base-300 bg-base-200 text-base-content/40">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
              </span>
            )}
            <div>
              <h1 className="text-3xl font-bold">{detalle.nombre}</h1>
              <p className="mt-1 text-sm text-base-content/60">
                {detalle.categorias?.nombre ?? "Sin categoría"} ·{" "}
                {detalle.marcas?.nombre ?? "Sin marca"}
                {detalle.codigo_barras ? ` · ${detalle.codigo_barras}` : ""}
              </p>
            </div>
          </div>
          <EstadoStock
            stock={detalle.stock}
            minimo={detalle.stock_minimo}
            activo={detalle.activo}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        {esAdmin ? (
          <MovimientoForm
            productos={[
              {
                id: detalle.id,
                nombre: detalle.nombre,
                stock: detalle.stock,
              },
            ]}
            productoInicial={{
              id: detalle.id,
              nombre: detalle.nombre,
              stock: detalle.stock,
            }}
            ocultarSelector
            usuarioActual={profile.nombre}
          />
        ) : (
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">Inventario</h2>
              <p className="text-sm text-base-content/60">
                Como vendedor puedes consultar el stock. Los movimientos solo
                los registra el administrador.
              </p>
            </div>
          </div>
        )}

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="card-title">Historial de movimientos</h2>
                <span className="badge badge-outline">
                  {total} movimiento{total === 1 ? "" : "s"}
                </span>
              </div>

              <form method="get">
                <AutoSubmitSelect
                  name="porPagina"
                  defaultValue={String(porPagina)}
                  opciones={TAMANOS_PAGINA.map((n) => ({
                    value: String(n),
                    label: `${n} por página`,
                  }))}
                />
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th className="text-right">Cantidad</th>
                    <th className="text-right">Anterior → Nuevo</th>
                    <th>Usuario</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-base-content/60"
                      >
                        Este producto aún no tiene movimientos.
                      </td>
                    </tr>
                  ) : (
                    historial.map((m) => (
                      <tr key={m.id}>
                        <td className="whitespace-nowrap text-sm">
                          {new Date(m.created_at).toLocaleString("es-BO")}
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
                    href={`/inventario/producto/${productoId}${queryEnlace(
                      porPagina,
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
                    href={`/inventario/producto/${productoId}${queryEnlace(
                      porPagina,
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
    </div>
  );
}

function EstadoStock({
  stock,
  minimo,
  activo,
}: {
  stock: number;
  minimo: number;
  activo: boolean;
}) {
  if (!activo) {
    return <span className="badge badge-lg badge-neutral">Inactivo</span>;
  }
  if (stock === 0) {
    return <span className="badge badge-lg badge-error">Agotado</span>;
  }
  if (stock <= minimo) {
    return <span className="badge badge-lg badge-warning">Bajo</span>;
  }
  return <span className="badge badge-lg badge-success">OK</span>;
}

function badgeTipo(tipo: string) {
  if (tipo === "ENTRADA") return "badge-success";
  if (tipo === "SALIDA") return "badge-warning";
  if (tipo === "AJUSTE") return "badge-info";
  return "badge-neutral";
}