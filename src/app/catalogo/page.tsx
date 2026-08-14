import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMonedaDisplay, getTipoCambioGlobal } from "@/lib/config";
import { formatMoneda, convertirPrecio } from "@/utils/format";
import { type Moneda } from "@/utils/moneda";
import { CurrencySwitcher } from "@/modules/dashboard/components/CurrencySwitcher";
import { FiltroCategorias } from "@/components/FiltroCategorias";
import { FiltroMarcas } from "@/components/FiltroMarcas";

type CatalogoSearchParams = {
  q?: string | string[];
  categorias?: string | string[];
  marcas?: string | string[];
};

type ProductoCatalogo = {
  id: number;
  nombre: string;
  codigo_barras: string | null;
  imagen: string | null;
  precio_venta: number;
  moneda: Moneda;
  stock: number;
  stock_minimo: number;
  categorias: { nombre: string } | null;
  marcas: { nombre: string } | null;
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

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<CatalogoSearchParams>;
}) {
  const sp = await searchParams;
  const q = soloUno(sp.q).trim();

  const supabase = await createClient();

  const [{ data: listaCategorias }, { data: listaMarcas }, monedaDisplay, tasa] =
    await Promise.all([
      supabase.from("categorias").select("id, nombre").order("nombre"),
      supabase.from("marcas").select("id, nombre").order("nombre"),
      getMonedaDisplay(),
      getTipoCambioGlobal(),
    ]);

  const categorias = q
    ? []
    : categoriasIniciales(sp.categorias, listaCategorias);
  const marcas = parseIds(sp.marcas);

  let query = supabase
    .from("productos")
    .select("id, nombre, codigo_barras, imagen, precio_venta, moneda, stock, stock_minimo, categorias(nombre), marcas(nombre)")
    .eq("activo", true)
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

  const { data } = await query;
  const productos = (data ?? []) as unknown as ProductoCatalogo[];

  const porCategoria = new Map<string, ProductoCatalogo[]>();
  for (const p of productos) {
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
    <main className="flex min-h-full flex-col">
      <header className="border-b border-base-300 bg-base-100">
        <div className="navbar mx-auto w-full max-w-6xl px-4">
          <div className="navbar-start">
            <Link href="/" className="text-lg font-bold tracking-tight">
              MAG COMP
            </Link>
          </div>
          <div className="navbar-center hidden md:block">
            <p className="text-sm text-base-content/60">
              Precios en {monedaDisplay} · 1 USD = {tasa} Bs
            </p>
          </div>
          <div className="navbar-end gap-2">
            <CurrencySwitcher tasa={tasa} moneda={monedaDisplay} compact />
            <Link href="/login" className="btn btn-outline btn-sm">
              Acceso personal
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Catálogo</h1>
          <p className="mt-1 text-base-content/60">
            Encuentra los productos de MAG COMP con su precio y disponibilidad.
          </p>
        </div>

        <form method="get" className="card mb-8 bg-base-100 shadow">
          <input type="hidden" name="categorias" value={categorias.join(",")} />
          <input type="hidden" name="marcas" value={marcas.join(",")} />
          <div className="card-body grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
            <FiltroCategorias
              categorias={listaCategorias ?? []}
              seleccionadas={categorias}
            />

            <FiltroMarcas
              marcas={listaMarcas ?? []}
              seleccionadas={marcas}
            />

            <label className="form-control">
              <div className="label">
                <span className="label-text">Buscar</span>
              </div>
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Nombre o código de barras"
                className="input input-bordered w-full"
              />
            </label>

            <div className="flex items-end">
              <button type="submit" className="btn btn-primary w-full sm:w-auto">
                Filtrar
              </button>
            </div>
          </div>
        </form>

        {productos.length === 0 ? (
          <div className="card bg-base-100 shadow">
            <div className="card-body items-center py-12 text-center">
              <p className="text-base-content/60">
                No se encontraron productos con esos filtros.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {productosPorCategoria.map(([categoria, lista]) => (
              <div
                key={categoria}
                className="card border border-base-300 bg-base-100 shadow-sm"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <h2 className="card-title text-lg">{categoria}</h2>
                    <span className="badge badge-ghost badge-sm">
                      {lista.length} producto{lista.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th></th>
                          <th>Producto</th>
                          <th>Código</th>
                          <th>Marca</th>
                          <th>Precio</th>
                          <th className="text-right">Disponibilidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lista.map((producto) => {
                          const precioMostrado = convertirPrecio(
                            producto.precio_venta,
                            producto.moneda,
                            monedaDisplay,
                            tasa
                          );
                          const esConvertido = producto.moneda !== monedaDisplay;

                          return (
                            <tr key={producto.id}>
                              <td>
                                {producto.imagen ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={producto.imagen}
                                    alt={producto.nombre}
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
                              <td className="font-medium">{producto.nombre}</td>
                              <td className="font-mono text-sm">{producto.codigo_barras ?? "—"}</td>
                              <td>{producto.marcas?.nombre ?? "—"}</td>
                              <td>
                                <span className="font-semibold">
                                  {formatMoneda(precioMostrado, monedaDisplay)}
                                </span>
                                {esConvertido ? (
                                  <p className="text-xs text-base-content/50">
                                    {formatMoneda(producto.precio_venta, producto.moneda)} original
                                  </p>
                                ) : null}
                              </td>
                              <td className="text-right">
                                <StockBadge stock={producto.stock} minimo={producto.stock_minimo} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StockBadge({ stock, minimo }: { stock: number; minimo: number }) {
  if (stock === 0) {
    return <span className="badge badge-error">Agotado</span>;
  }
  if (stock <= minimo) {
    return <span className="badge badge-warning">Últimas unidades</span>;
  }
  return <span className="badge badge-success">Disponible</span>;
}