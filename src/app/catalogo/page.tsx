import Image from "next/image";
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

  const hayFiltros = Boolean(q || categorias.length || marcas.length);

  return (
    <main className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100/90 backdrop-blur">
        <div className="navbar mx-auto w-full max-w-6xl px-4">
          <div className="navbar-start flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Logo MAG COMP"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
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
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/60 p-8 text-primary-content shadow-sm sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Image
                src="/logo.png"
                alt="Logo MAG COMP"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Catálogo de productos
            </h1>
          </div>
          <p className="mt-3 max-w-xl text-primary-content/85">
            Explora los productos de MAG COMP con su precio y disponibilidad
            actualizados. Usa los filtros para encontrar lo que buscas.
          </p>
        </div>

        <form method="get" className="card mt-6 bg-base-100 shadow">
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
                className="input input-bordered h-11 w-full"
              />
            </label>

            <div className="flex items-end">
              <button type="submit" className="btn btn-primary h-11 w-full sm:w-auto">
                Filtrar
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">
            {hayFiltros ? "Resultados" : "Productos disponibles"}
          </h2>
          <span className="text-sm text-base-content/60">
            {productos.length} producto{productos.length === 1 ? "" : "s"}
            {hayFiltros ? " encontrado(s)" : ""}
          </span>
        </div>

        {productos.length === 0 ? (
          <div className="card mt-4 bg-base-100 shadow">
            <div className="card-body items-center py-12 text-center">
              <p className="text-base-content/60">
                No se encontraron productos con esos filtros.
              </p>
              <Link href="/catalogo" className="btn btn-outline btn-sm mt-2">
                Ver todo el catálogo
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-8">
            {productosPorCategoria.map(([categoria, lista]) => (
              <section key={categoria}>
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="text-lg font-bold">{categoria}</h3>
                  <span className="badge badge-ghost badge-sm">
                    {lista.length} producto{lista.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {lista.map((producto) => {
                    const precioMostrado = convertirPrecio(
                      producto.precio_venta,
                      producto.moneda,
                      monedaDisplay,
                      tasa
                    );
                    const esConvertido = producto.moneda !== monedaDisplay;

                    return (
                      <div
                        key={producto.id}
                        className="card overflow-hidden border border-base-300 bg-base-100 shadow-sm transition hover:shadow-md"
                      >
                        <figure className="h-40 bg-base-200">
                          {producto.imagen ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={producto.imagen}
                              alt={producto.nombre}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <span className="text-xs font-medium uppercase tracking-widest text-base-content/30">
                                Sin imagen
                              </span>
                            </div>
                          )}
                        </figure>
                        <div className="card-body gap-1.5 p-3.5">
                          <p className="break-words font-semibold leading-snug">
                            {producto.nombre}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {producto.marcas?.nombre ? (
                              <span className="badge badge-ghost badge-sm">
                                {producto.marcas.nombre}
                              </span>
                            ) : null}
                            {producto.codigo_barras ? (
                              <span className="font-mono text-xs text-base-content/50">
                                {producto.codigo_barras}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-lg font-bold">
                              {formatMoneda(precioMostrado, monedaDisplay)}
                            </span>
                            <StockBadge
                              stock={producto.stock}
                              minimo={producto.stock_minimo}
                            />
                          </div>
                          {esConvertido ? (
                            <p className="text-xs text-base-content/50">
                              {formatMoneda(producto.precio_venta, producto.moneda)}{" "}
                              original
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
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
