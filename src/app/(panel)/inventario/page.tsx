import Link from "next/link";
import { requirePermiso } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { FiltroCategorias } from "@/components/FiltroCategorias";
import { FiltroMarcas } from "@/components/FiltroMarcas";

export const dynamic = "force-dynamic";

type RawProducto = {
  id: number;
  nombre: string;
  codigo_barras: string | null;
  imagen: string | null;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  categorias: { id: number; nombre: string } | null;
  marcas: { id: number; nombre: string } | null;
};

type SearchParams = {
  q?: string | string[];
  categorias?: string | string[];
  marcas?: string | string[];
};

function soloUno(valor: string | string[] | undefined): string {
  return Array.isArray(valor) ? valor[0] ?? "" : valor ?? "";
}

function parseIds(valor: string | string[] | undefined): number[] {
  const raw = Array.isArray(valor) ? valor.join(",") : (valor ?? "");
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}

function categoriasIniciales(
  valor: string | string[] | undefined,
  lista: { id: number }[] | null
): number[] {
  const raw = Array.isArray(valor) ? valor.join(",") : (valor ?? "");
  if (raw.trim().toLowerCase() === "todas") return [];
  const ids = parseIds(valor);
  if (ids.length === 0 && lista && lista.length > 0) return [lista[0].id];
  return ids;
}

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermiso("inventario");

  const sp = await searchParams;
  const q = soloUno(sp.q).trim();

  const supabase = await createClient();

  const [{ data: listaCategorias }, { data: listaMarcas }] = await Promise.all([
    supabase.from("categorias").select("id, nombre").order("nombre"),
    supabase.from("marcas").select("id, nombre").order("nombre"),
  ]);

  const categorias = q
    ? []
    : categoriasIniciales(sp.categorias, listaCategorias);
  const marcas = parseIds(sp.marcas);

  let query = supabase
    .from("productos")
    .select(
      "id, nombre, codigo_barras, imagen, stock, stock_minimo, activo, categorias(id, nombre), marcas(id, nombre)"
    )
    .order("nombre");

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,codigo_barras.ilike.%${q}%`);
  }
  if (categorias.length > 0) {
    query = query.in("categoria_id", categorias);
  }
  if (marcas.length > 0) {
    query = query.in("marca_id", marcas);
  }

  const { data: productos } = await query;

  const lista = (productos ?? []) as unknown as RawProducto[];

  const porCategoria = new Map<string, RawProducto[]>();
  for (const p of lista) {
    const nombre = p.categorias?.nombre ?? "Sin categoría";
    const grupo = porCategoria.get(nombre);
    if (grupo) {
      grupo.push(p);
    } else {
      porCategoria.set(nombre, [p]);
    }
  }
  const productosPorCategoria = [...porCategoria.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventario</h1>
          <p className="mt-1 text-base-content/60">
            Selecciona un producto para ver su detalle, registrar movimientos y
            consultar su historial.
          </p>
        </div>
        <a
          href="/api/inventario/catalogo/pdf"
          className="btn btn-outline btn-sm self-start"
        >
          Descargar catálogo PDF (para clientes)
        </a>
      </div>

      <form method="get" className="card bg-base-100 shadow">
        <input
          type="hidden"
          name="categorias"
          value={categorias.join(",")}
        />
        <input type="hidden" name="marcas" value={marcas.join(",")} />
        <div className="card-body space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FiltroCategorias
              categorias={listaCategorias ?? []}
              seleccionadas={categorias}
            />

            <FiltroMarcas
              marcas={listaMarcas ?? []}
              seleccionadas={marcas}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar producto por nombre o código"
              className="input input-bordered flex-1"
            />
            <button type="submit" className="btn btn-primary">
              Buscar
            </button>
          </div>
        </div>
      </form>

      {lista.length === 0 ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center py-10 text-center">
            <p className="text-base-content/60">
              No hay productos con esos filtros.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {productosPorCategoria.map(([categoria, grupo]) => (
            <div
              key={categoria}
              className="card border border-base-300 bg-base-100 shadow-sm"
            >
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h2 className="card-title text-lg">{categoria}</h2>
                  <span className="badge badge-ghost badge-sm">
                    {grupo.length} producto{grupo.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Imagen</th>
                        <th>Producto</th>
                        <th>Código</th>
                        <th>Marca</th>
                        <th className="text-right">Stock</th>
                        <th className="text-right">Mínimo</th>
                        <th>Estado</th>
                        <th className="text-right">Detalle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.map((p) => (
                        <tr
                          key={p.id}
                          className={p.activo ? "" : "opacity-50"}
                        >
                          <td>
                            {p.imagen ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.imagen}
                                alt={p.nombre}
                                className="h-12 w-12 rounded-box border border-base-300 object-cover"
                              />
                            ) : (
                              <span className="flex h-12 w-12 items-center justify-center rounded-box border border-dashed border-base-300 bg-base-200 text-base-content/40">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                                </svg>
                              </span>
                            )}
                          </td>
                          <td>
                            <p className="font-medium">{p.nombre}</p>
                            {p.codigo_barras ? (
                              <p className="font-mono text-xs text-base-content/50">
                                {p.codigo_barras}
                              </p>
                            ) : null}
                          </td>
                          <td className="font-mono text-sm">
                            {p.codigo_barras ?? "—"}
                          </td>
                          <td>{p.marcas?.nombre ?? "—"}</td>
                          <td className="text-right font-semibold">
                            {p.stock}
                          </td>
                          <td className="text-right">{p.stock_minimo}</td>
                          <td>
                            <EstadoStock
                              stock={p.stock}
                              minimo={p.stock_minimo}
                              activo={p.activo}
                            />
                          </td>
                          <td className="text-right">
                            <Link
                              href={`/inventario/producto/${p.id}`}
                              className="btn btn-sm btn-primary"
                            >
                              Abrir
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
    return <span className="badge badge-neutral">Inactivo</span>;
  }
  if (stock === 0) {
    return <span className="badge badge-error">Agotado</span>;
  }
  if (stock <= minimo) {
    return <span className="badge badge-warning">Bajo</span>;
  }
  return <span className="badge badge-success">OK</span>;
}