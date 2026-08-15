"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { registrarVenta, type VentaState } from "@/modules/ventas/actions";
import { formatMoneda, convertirPrecio } from "@/utils/format";
import { esMoneda, type Moneda } from "@/utils/moneda";
import {
  SelectorCliente,
  type ClienteVenta,
} from "@/modules/ventas/components/SelectorCliente";

export type ProductoVenta = {
  id: number;
  nombre: string;
  codigo_barras: string | null;
  imagen: string | null;
  precio_venta: number;
  moneda: Moneda;
  stock: number;
};

type ItemCarrito = { producto: ProductoVenta; cantidad: number };

export function VentaPOS({
  productosIniciales,
  totalPaginasInicial,
  clientes,
  tasa,
  monedaBase,
  monedaDisplay,
}: {
  productosIniciales: ProductoVenta[];
  totalPaginasInicial: number;
  clientes: ClienteVenta[];
  tasa: number;
  monedaBase: Moneda;
  monedaDisplay: Moneda;
}) {
  const [state, formAction, pending] = useActionState<VentaState, FormData>(
    registrarVenta,
    undefined
  );

  const [busqueda, setBusqueda] = useState("");
  const [moneda, setMoneda] = useState<Moneda>(monedaDisplay);
  const [descuento, setDescuento] = useState("0");
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [pagina, setPagina] = useState(1);
  const [productosPagina, setProductosPagina] =
    useState<ProductoVenta[]>(productosIniciales);
  const [totalPaginas, setTotalPaginas] = useState(totalPaginasInicial);
  const [cargando, setCargando] = useState(false);

  const inputBusqueda = useRef<HTMLInputElement>(null);
  const cacheRef = useRef<Map<number, ProductoVenta[]>>(
    new Map([[1, productosIniciales]])
  );
  const primerRender = useRef(true);

  const cargarPagina = useCallback(async (n: number, q: string) => {
    setCargando(true);
    try {
      const res = await fetch(
        `/api/productos?pagina=${n}&q=${encodeURIComponent(q.trim())}`
      );
      if (!res.ok) throw new Error("error");
      const data = (await res.json()) as {
        productos: ProductoVenta[];
        totalPaginas: number;
      };
      cacheRef.current.set(n, data.productos ?? []);
      setProductosPagina(data.productos ?? []);
      setTotalPaginas(data.totalPaginas ?? 1);
      setPagina(n);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      cacheRef.current.clear();
      setPagina(1);
      cargarPagina(1, busqueda);
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda, cargarPagina]);

  const hayConversion = moneda !== monedaBase;

  const items = useMemo(() => {
    return carrito.map((item) => {
      const { producto } = item;
      const precioUnitario = convertirPrecio(
        producto.precio_venta,
        producto.moneda,
        moneda,
        tasa
      );
      return {
        ...item,
        producto,
        precioUnitario,
        lineTotal: precioUnitario * item.cantidad,
      };
    });
  }, [carrito, moneda, tasa]);

  const subtotal = items.reduce((acc, item) => acc + item.lineTotal, 0);
  const descuentoNum = Math.max(0, Number(descuento) || 0);
  const total = Math.max(0, subtotal - descuentoNum);
  const cantidadTotal = items.reduce((acc, item) => acc + item.cantidad, 0);
  const descuentoExcede = subtotal > 0 && descuentoNum > subtotal;

  const paginaActual = Math.min(pagina, totalPaginas);

  function irPagina(nueva: number) {
    const objetivo = Math.min(totalPaginas, Math.max(1, nueva));
    if (objetivo === pagina) return;
    cargarPagina(objetivo, busqueda);
  }

  function agregar(producto: ProductoVenta) {
    if (producto.stock <= 0) return;
    setCarrito((prev) => {
      const existente = prev.find((i) => i.producto.id === producto.id);
      if (existente) {
        if (existente.cantidad >= producto.stock) return prev;
        return prev.map((i) =>
          i.producto.id === producto.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  }

  function cambiarCantidad(productoId: number, cantidad: number) {
    setCarrito((prev) => {
      const item = prev.find((i) => i.producto.id === productoId);
      if (!item) return prev;
      const limite = Math.max(1, item.producto.stock);
      const valor = Math.min(limite, Math.max(1, cantidad));
      return prev.map((i) =>
        i.producto.id === productoId ? { ...i, cantidad: valor } : i
      );
    });
  }

  function quitar(productoId: number) {
    setCarrito((prev) => prev.filter((i) => i.producto.id !== productoId));
  }

  function elegirMoneda(valor: string) {
    if (esMoneda(valor)) {
      setMoneda(valor);
    }
  }

  async function manejarBusqueda(e: React.FormEvent) {
    e.preventDefault();
    const q = busqueda.trim().toLowerCase();
    if (!q) return;
    const res = await fetch(`/api/productos?q=${encodeURIComponent(q)}&pagina=1`);
    const data = (await res.json()) as { productos?: ProductoVenta[] };
    const resultados = data.productos ?? [];
    const coincidencia =
      resultados.find(
        (p) => (p.codigo_barras ?? "").toLowerCase() === q
      ) ??
      resultados.find((p) => p.nombre.toLowerCase() === q) ??
      resultados[0];
    if (coincidencia && coincidencia.stock > 0) {
      agregar(coincidencia);
    }
    setBusqueda("");
    setPagina(1);
    inputBusqueda.current?.focus();
  }

  function verCarrito() {
    document
      .getElementById("carrito")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-6 pb-20 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-0">
        <section>
          <form onSubmit={manejarBusqueda} className="form-control">
            <div className="label">
              <span className="label-text">Buscar producto</span>
            </div>
            <input
              ref={inputBusqueda}
              type="search"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              placeholder="Nombre o código de barras"
              className="input input-bordered w-full"
              autoFocus
            />
            <div className="mt-1 text-xs text-base-content/50">
              Presiona Enter para agregar el primer resultado al carrito.
            </div>
          </form>

          {cargando ? (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-box border border-dashed border-base-300 bg-base-100 p-10 text-base-content/60">
              <span className="loading loading-spinner loading-sm"></span>
              <span>Cargando productos...</span>
            </div>
          ) : productosPagina.length === 0 ? (
            <div className="mt-6 rounded-box border border-dashed border-base-300 bg-base-100 p-10 text-center text-base-content/60">
              <p>No se encontraron productos disponibles con ese nombre o código.</p>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {productosPagina.map((producto) => {
                const precio = convertirPrecio(
                  producto.precio_venta,
                  producto.moneda,
                  moneda,
                  tasa
                );
                const cantidad =
                  carrito.find((i) => i.producto.id === producto.id)?.cantidad ??
                  0;

                return (
                  <button
                    key={producto.id}
                    type="button"
                    onClick={() => agregar(producto)}
                    aria-label={`Agregar ${producto.nombre} al carrito`}
                    className={`card overflow-hidden bg-base-100 text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      cantidad > 0 ? "ring-2 ring-primary" : "hover:shadow-md"
                    }`}
                  >
                    <figure className="h-24 bg-base-200">
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
                    <div className="card-body p-2.5">
                      <div className="min-w-0">
                        <p className="break-words font-semibold leading-snug">
                          {producto.nombre}
                        </p>
                        {producto.codigo_barras ? (
                          <p className="font-mono text-xs text-base-content/50">
                            {producto.codigo_barras}
                          </p>
                        ) : null}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-base font-bold">
                          {formatMoneda(precio, moneda)}
                        </span>
                        <StockTag stock={producto.stock} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {totalPaginas > 1 ? (
            <div className="mt-4 flex items-center justify-center gap-1">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={paginaActual <= 1}
                onClick={() => irPagina(paginaActual - 1)}
              >
                ← Anterior
              </button>
              <div className="join">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => irPagina(p)}
                      className={`join-item btn btn-sm ${
                        p === paginaActual ? "btn-primary" : "btn-ghost"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={paginaActual >= totalPaginas}
                onClick={() => irPagina(paginaActual + 1)}
              >
                Siguiente →
              </button>
            </div>
          ) : null}
        </section>

        <aside
          id="carrito"
          className="scroll-mt-20 lg:sticky lg:top-6 lg:self-start"
        >
          <form action={formAction} className="card overflow-hidden bg-base-100 shadow">
            <div className="flex items-center justify-between gap-2 border-b border-base-200 px-4 py-3">
              <h2 className="card-title text-base">
                Venta actual
                {cantidadTotal > 0 ? (
                  <span className="badge badge-primary badge-sm">
                    {cantidadTotal}
                  </span>
                ) : null}
              </h2>
              {carrito.length > 0 ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setCarrito([])}
                >
                  Vaciar
                </button>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-base-content/60">Moneda:</span>
                <div className="join">
                  <button
                    type="button"
                    onClick={() => elegirMoneda("BOB")}
                    className={`btn btn-sm join-item ${moneda === "BOB" ? "btn-primary" : "btn-outline"}`}
                  >
                    Bs
                  </button>
                  <button
                    type="button"
                    onClick={() => elegirMoneda("USD")}
                    className={`btn btn-sm join-item ${moneda === "USD" ? "btn-primary" : "btn-outline"}`}
                  >
                    USD
                  </button>
                </div>
                {hayConversion ? (
                  <span className="text-xs text-base-content/50">
                    precios convertidos
                  </span>
                ) : null}
              </div>

              {items.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-base-content/60">El carrito está vacío.</p>
                  <p className="mt-1 text-xs text-base-content/40">
                    Toca un producto para agregarlo.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-base-200">
                  {items.map((item) => (
                    <li key={item.producto.id} className="flex items-center gap-2.5 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate font-medium leading-tight">
                            {item.producto.nombre}
                          </p>
                          <p className="shrink-0 font-semibold">
                            {formatMoneda(item.lineTotal, moneda)}
                          </p>
                        </div>
                        <p className="mt-0.5 text-xs text-base-content/50">
                          {formatMoneda(item.precioUnitario, moneda)} c/u
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="join">
                            <button
                              type="button"
                              className="btn btn-outline btn-xs btn-square join-item"
                              onClick={() =>
                                cambiarCantidad(item.producto.id, item.cantidad - 1)
                              }
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={item.producto.stock}
                              value={item.cantidad}
                              onChange={(e) =>
                                cambiarCantidad(
                                  item.producto.id,
                                  Number(e.target.value)
                                )
                              }
                              className="input input-bordered input-xs join-item w-14 text-center"
                            />
                            <button
                              type="button"
                              className="btn btn-outline btn-xs btn-square join-item"
                              onClick={() =>
                                cambiarCantidad(item.producto.id, item.cantidad + 1)
                              }
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => quitar(item.producto.id)}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <SelectorCliente clientes={clientes} />

              <label className="form-control">
                <div className="label">
                  <span className="label-text">Descuento ({moneda})</span>
                </div>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={descuento}
                  onChange={(e) => setDescuento(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="0"
                />
              </label>

              {descuentoExcede ? (
                <div role="alert" className="alert alert-warning py-1.5 text-xs">
                  <span>El descuento supera el subtotal. La venta no se podrá registrar.</span>
                </div>
              ) : null}

              <div className="rounded-box bg-base-200 px-3 py-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/60">Subtotal</span>
                    <span>{formatMoneda(subtotal, moneda)}</span>
                  </div>
                  {descuentoNum > 0 ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/60">Descuento</span>
                      <span className="text-error">
                        −{formatMoneda(descuentoNum, moneda)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-base-300 pt-2 text-lg font-bold">
                    <span>Total</span>
                    <span>{formatMoneda(total, moneda)}</span>
                  </div>
                </div>
              </div>

              <input type="hidden" name="moneda" value={moneda} />
              <input type="hidden" name="descuento" value={String(descuentoNum)} />
              <input
                type="hidden"
                name="items"
                value={JSON.stringify(
                  items.map((i) => ({
                    producto_id: i.producto.id,
                    cantidad: i.cantidad,
                  }))
                )}
              />

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={pending || items.length === 0}
              >
                {pending
                  ? "Registrando..."
                  : `Registrar venta · ${formatMoneda(total, moneda)}`}
              </button>

              {state?.error ? (
                <div role="alert" className="alert alert-error py-2 text-sm">
                  <span>{state.error}</span>
                </div>
              ) : null}
            </div>
          </form>
        </aside>
      </div>

      {cantidadTotal > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-base-300 bg-base-100/95 p-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={verCarrito}
            className="btn btn-primary btn-lg w-full justify-between"
          >
            <span>{cantidadTotal} artículo{cantidadTotal === 1 ? "" : "s"}</span>
            <span className="flex items-center gap-2">
              {formatMoneda(total, moneda)}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>
      ) : null}
    </>
  );
}

function StockTag({ stock }: { stock: number }) {
  if (stock <= 0) {
    return <span className="badge badge-error badge-sm">Agotado</span>;
  }
  if (stock <= 5) {
    return <span className="badge badge-warning badge-sm">{stock} uds</span>;
  }
  return <span className="badge badge-success badge-sm">{stock} uds</span>;
}