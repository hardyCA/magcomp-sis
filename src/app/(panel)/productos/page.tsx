import Link from "next/link";
import { requirePermiso } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getMonedaBase, getMonedaDisplay, getTipoCambioGlobal } from "@/lib/config";
import { formatMoneda, convertirPrecio } from "@/utils/format";
import { type Moneda } from "@/utils/moneda";
import { toggleProducto } from "@/modules/productos/actions";
import { ImportarProductos } from "@/modules/productos/components/ImportarProductos";
import { FiltrosProductos } from "@/modules/productos/components/FiltrosProductos";

type ProductoRow = {
  id: number;
  nombre: string;
  codigo_barras: string | null;
  imagen: string | null;
  precio_venta: number;
  moneda: Moneda;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  categorias: { nombre: string } | null;
  marcas: { nombre: string } | null;
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

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const profile = await requirePermiso("productos");
  const esAdmin = profile.rol === "ADMINISTRADOR";

  const sp = await searchParams;
  const q = soloUno(sp.q).trim();

  const supabase = await createClient();

  const [
    { data: listaCategorias },
    { data: listaMarcas },
    monedaBase,
    monedaDisplay,
    tasa,
  ] = await Promise.all([
    supabase.from("categorias").select("id, nombre").order("nombre"),
    supabase.from("marcas").select("id, nombre").order("nombre"),
    getMonedaBase(),
    getMonedaDisplay(),
    getTipoCambioGlobal(),
  ]);

  const categorias = q
    ? []
    : categoriasIniciales(sp.categorias, listaCategorias);
  const marcas = parseIds(sp.marcas);

  let query = supabase
    .from("productos")
    .select(
      "id, nombre, codigo_barras, imagen, precio_venta, moneda, stock, stock_minimo, activo, categorias(nombre), marcas(nombre)"
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

  const { data } = await query;

  const productos = (data ?? []) as unknown as ProductoRow[];
  const hayConversion = monedaDisplay !== monedaBase;

  const porCategoria = new Map<string, ProductoRow[]>();
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

  const categoriaNombre = listaCategorias
    ?.filter((c) => categorias.includes(c.id))
    .map((c) => c.nombre);
  const marcaNombre = listaMarcas
    ?.filter((m) => marcas.includes(m.id))
    .map((m) => m.nombre);
  const hayFiltrosActivos = Boolean(q || categoriaNombre?.length || marcaNombre?.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="mt-1 text-base-content/60">
            {productos.length} producto{productos.length === 1 ? "" : "s"} ·
            precios mostrados en {monedaDisplay}
            {hayConversion ? ` (guardados en ${monedaBase})` : ""}
          </p>
        </div>
        {esAdmin ? (
          <div className="flex items-center gap-2">
            <ImportarProductos />
            <Link href="/productos/nuevo" className="btn btn-primary">
              Nuevo producto
            </Link>
          </div>
        ) : null}
      </div>

      <FiltrosProductos
        categorias={listaCategorias ?? []}
        marcas={listaMarcas ?? []}
        q={q}
        categoriasSeleccionadas={categorias}
        marcasSeleccionadas={marcas}
      />

      {hayFiltrosActivos ? (
        <FiltrosActivos
          q={q}
          categorias={categorias}
          marcas={marcas}
          categoriaNombres={categoriaNombre}
          marcaNombres={marcaNombre}
        />
      ) : null}

      {productos.length === 0 ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center py-10 text-center">
            <p className="text-base-content/60">No se encontraron productos.</p>
            {esAdmin ? (
              <Link href="/productos/nuevo" className="btn btn-primary mt-2">
                Crear el primero
              </Link>
            ) : null}
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
                        <th>Imagen</th>
                        <th>Nombre</th>
                        <th>Código</th>
                        <th>Marca</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Estado</th>
                        <th className="text-right">Acciones</th>
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

                        return (
                          <tr
                            key={producto.id}
                            className={producto.activo ? "" : "opacity-50"}
                          >
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
                            <td className="font-semibold">
                              {formatMoneda(precioMostrado, monedaDisplay)}
                            </td>
                            <td>
                              <StockBadge stock={producto.stock} minimo={producto.stock_minimo} />
                            </td>
                            <td>
                              <span
                                className={`badge ${producto.activo ? "badge-success" : "badge-neutral"}`}
                              >
                                {producto.activo ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                            <td className="text-right">
                              {esAdmin ? (
                                <div className="flex justify-end gap-2">
                                  <Link href={`/productos/${producto.id}/editar`} className="btn btn-ghost btn-sm">
                                    Editar
                                  </Link>
                                  <form action={toggleProducto}>
                                    <input type="hidden" name="id" value={producto.id} />
                                    <input type="hidden" name="activo" value={producto.activo ? "1" : "0"} />
                                    <button
                                      type="submit"
                                      className={`btn btn-sm ${producto.activo ? "btn-outline" : "btn-success"}`}
                                    >
                                      {producto.activo ? "Inactivar" : "Activar"}
                                    </button>
                                  </form>
                                </div>
                              ) : null}
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
    </div>
  );
}

function FiltrosActivos({
  q,
  categorias,
  marcas,
  categoriaNombres,
  marcaNombres,
}: {
  q: string;
  categorias: number[];
  marcas: number[];
  categoriaNombres?: string[];
  marcaNombres?: string[];
}) {
  function hrefSin(quitar: "q" | "categorias" | "marcas") {
    const params = new URLSearchParams();
    if (q && quitar !== "q") params.set("q", q);
    if (categorias.length > 0 && quitar !== "categorias")
      params.set("categorias", categorias.join(","));
    if (marcas.length > 0 && quitar !== "marcas")
      params.set("marcas", marcas.join(","));
    const s = params.toString();
    return s ? `/productos?${s}` : "/productos";
  }

  function hrefSinId(lista: number[], parametro: "categorias" | "marcas", id: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const restantes = lista.filter((x) => x !== id);
    if (categorias.length > 0) params.set("categorias", categorias.join(","));
    if (marcas.length > 0) params.set("marcas", marcas.join(","));
    if (parametro === "categorias") {
      if (restantes.length > 0) params.set("categorias", restantes.join(","));
      else params.delete("categorias");
    } else {
      if (restantes.length > 0) params.set("marcas", restantes.join(","));
      else params.delete("marcas");
    }
    const s = params.toString();
    return s ? `/productos?${s}` : "/productos";
  }

  return (
    <div className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-base-content/50">
          Filtros
        </span>

        {categorias.length > 0 && categoriaNombres ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-base-content/60">Categoría:</span>
            {categorias.map((id, i) => (
              <span
                key={id}
                className="badge badge-lg badge-primary badge-outline font-semibold"
              >
                {categoriaNombres[i] ?? "Categoría"}
                <Link
                  href={hrefSinId(categorias, "categorias", id)}
                  aria-label={`Quitar categoría ${categoriaNombres[i]}`}
                  title="Quitar filtro"
                  className="ml-1 inline-flex text-base-content/60 hover:text-error"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Link>
              </span>
            ))}
          </div>
        ) : null}

        {marcas.length > 0 && marcaNombres ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-base-content/60">Marca:</span>
            {marcas.map((id, i) => (
              <span
                key={id}
                className="badge badge-lg badge-primary badge-outline font-semibold"
              >
                {marcaNombres[i] ?? "Marca"}
                <Link
                  href={hrefSinId(marcas, "marcas", id)}
                  aria-label={`Quitar marca ${marcaNombres[i]}`}
                  title="Quitar filtro"
                  className="ml-1 inline-flex text-base-content/60 hover:text-error"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Link>
              </span>
            ))}
          </div>
        ) : null}

        {q ? (
          <EncabezadoFiltro etiqueta="Búsqueda" valor={`"${q}"`} href={hrefSin("q")} />
        ) : null}
      </div>

      <Link href="/productos" className="btn btn-ghost btn-sm">
        Limpiar todo
      </Link>
    </div>
  );
}

function EncabezadoFiltro({
  etiqueta,
  valor,
  href,
}: {
  etiqueta: string;
  valor: string;
  href: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-base-content/60">{etiqueta}:</span>
      <span className="badge badge-lg badge-primary badge-outline font-semibold">
        {valor}
      </span>
      <Link
        href={href}
        aria-label={`Quitar filtro ${etiqueta}`}
        title="Quitar filtro"
        className="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-error"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Link>
    </div>
  );
}

function StockBadge({ stock, minimo }: { stock: number; minimo: number }) {
  if (stock === 0) {
    return <span className="badge badge-error">Agotado</span>;
  }
  if (stock <= minimo) {
    return <span className="badge badge-warning">{stock} · bajo</span>;
  }
  return <span className="badge badge-success">{stock}</span>;
}