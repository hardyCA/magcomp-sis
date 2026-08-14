"use client";

import { useActionState, useMemo, useState } from "react";
import {
  crearCotizacion,
  actualizarCotizacion,
  type CotizacionState,
} from "@/modules/cotizaciones/actions";
import { formatMoneda, convertirPrecio } from "@/utils/format";
import { esMoneda, type Moneda } from "@/utils/moneda";
import {
  SelectorCliente,
  type ClienteVenta,
} from "@/modules/ventas/components/SelectorCliente";

export type ProductoCotizacion = {
  id: number;
  nombre: string;
  codigo_barras: string | null;
  imagen: string | null;
  precio_venta: number;
  moneda: Moneda;
  stock: number;
};

type ItemCarrito = { producto_id: number; cantidad: number };

export type CotizacionInicial = {
  id: number;
  cliente: string | null;
  moneda: Moneda;
  descuento: number;
  items: ItemCarrito[];
};

export function CotizacionForm({
  productos,
  clientes,
  tasa,
  monedaBase,
  monedaDisplay,
  inicial,
}: {
  productos: ProductoCotizacion[];
  clientes: ClienteVenta[];
  tasa: number;
  monedaBase: Moneda;
  monedaDisplay: Moneda;
  inicial?: CotizacionInicial;
}) {
  const accion = inicial ? actualizarCotizacion : crearCotizacion;
  const [state, formAction, pending] = useActionState<CotizacionState, FormData>(
    accion,
    undefined
  );

  const [busqueda, setBusqueda] = useState("");
  const [moneda, setMoneda] = useState<Moneda>(
    inicial?.moneda ?? monedaDisplay
  );
  const [descuento, setDescuento] = useState(
    String(inicial?.descuento ?? 0)
  );
  const [carrito, setCarrito] = useState<ItemCarrito[]>(inicial?.items ?? []);
  const [pagina, setPagina] = useState(1);

  const hayConversion = moneda !== monedaBase;

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const base = productos.filter(
      (p) => p.stock > 0 && !carrito.some((i) => i.producto_id === p.id)
    );
    if (!q) return base;
    return base.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.codigo_barras ?? "").toLowerCase().includes(q)
    );
  }, [busqueda, productos, carrito]);

  const items = useMemo(() => {
    return carrito
      .map((item) => {
        const producto = productos.find((p) => p.id === item.producto_id);
        if (!producto) return null;
        const precioUnitario = convertirPrecio(
          producto.precio_venta,
          producto.moneda,
          moneda,
          tasa
        );
        return { ...item, producto, precioUnitario, lineTotal: precioUnitario * item.cantidad };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [carrito, productos, moneda, tasa]);

  const subtotal = items.reduce((acc, item) => acc + item.lineTotal, 0);
  const descuentoNum = Math.max(0, Number(descuento) || 0);
  const total = Math.max(0, subtotal - descuentoNum);
  const descuentoExcede = subtotal > 0 && descuentoNum > subtotal;

  const POR_PAGINA = 9;
  const totalPaginas = Math.max(
    1,
    Math.ceil(productosFiltrados.length / POR_PAGINA)
  );
  const paginaActual = Math.min(pagina, totalPaginas);
  const productosPagina = productosFiltrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  );

  function irPagina(nueva: number) {
    setPagina(Math.min(totalPaginas, Math.max(1, nueva)));
  }

  function agregar(producto: ProductoCotizacion) {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.producto_id === producto.id);
      if (existente) {
        return prev.map((i) =>
          i.producto_id === producto.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [...prev, { producto_id: producto.id, cantidad: 1 }];
    });
  }

  function cambiarCantidad(productoId: number, cantidad: number) {
    const valor = Math.max(1, cantidad);
    setCarrito((prev) =>
      prev.map((i) =>
        i.producto_id === productoId ? { ...i, cantidad: valor } : i
      )
    );
  }

  function quitar(productoId: number) {
    setCarrito((prev) => prev.filter((i) => i.producto_id !== productoId));
  }

  function elegirMoneda(valor: string) {
    if (esMoneda(valor)) {
      setMoneda(valor);
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <section>
        <label className="form-control">
          <div className="label">
            <span className="label-text">Buscar producto</span>
          </div>
          <input
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
        </label>

        {productosFiltrados.length === 0 ? (
          <p className="mt-6 rounded-box border border-base-300 bg-base-100 p-8 text-center text-base-content/60">
            No se encontraron productos disponibles.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {productosPagina.map((producto) => {
              const precio = convertirPrecio(
                producto.precio_venta,
                producto.moneda,
                moneda,
                tasa
              );

              return (
                <button
                  key={producto.id}
                  type="button"
                  onClick={() => agregar(producto)}
                  className="card overflow-hidden border border-base-300 bg-base-100 text-left shadow-sm transition hover:shadow"
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
                  <div className="card-body p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold leading-tight">
                          {producto.nombre}
                        </p>
                        {producto.codigo_barras ? (
                          <p className="font-mono text-xs text-base-content/50">
                            {producto.codigo_barras}
                          </p>
                        ) : null}
                      </div>
                      <StockTag stock={producto.stock} />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-lg font-bold">
                        {formatMoneda(precio, moneda)}
                      </span>
                      <span className="badge badge-outline badge-sm">
                        Agregar
                      </span>
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

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <form action={formAction} className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h2 className="card-title">
                {inicial ? `Editar ${inicial.cliente ?? "cotización"}` : "Nueva cotización"}
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

            {inicial ? <input type="hidden" name="id" value={inicial.id} /> : null}

            <SelectorCliente clientes={clientes} valorInicial={inicial?.cliente ?? ""} />

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
              <p className="py-8 text-center text-base-content/60">
                El carrito está vacío. Toca un producto para agregarlo.
              </p>
            ) : (
              <ul className="divide-y divide-base-200">
                {items.map((item) => (
                  <li key={item.producto_id} className="flex flex-col gap-2 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-tight">{item.producto.nombre}</p>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => quitar(item.producto_id)}
                      >
                        Quitar
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm btn-square"
                          onClick={() =>
                            cambiarCantidad(item.producto_id, item.cantidad - 1)
                          }
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={item.cantidad}
                          onChange={(e) =>
                            cambiarCantidad(
                              item.producto_id,
                              Number(e.target.value)
                            )
                          }
                          className="input input-bordered input-sm w-16 text-center"
                        />
                        <button
                          type="button"
                          className="btn btn-outline btn-sm btn-square"
                          onClick={() =>
                            cambiarCantidad(item.producto_id, item.cantidad + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatMoneda(item.lineTotal, moneda)}
                        </p>
                        <p className="text-xs text-base-content/50">
                          {formatMoneda(item.precioUnitario, moneda)} c/u
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

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
                <span>El descuento supera el subtotal. No se podrá guardar.</span>
              </div>
            ) : null}

            <div className="mt-2 space-y-1 border-t border-base-200 pt-3">
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
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatMoneda(total, moneda)}</span>
              </div>
            </div>

            <input type="hidden" name="moneda" value={moneda} />
            <input type="hidden" name="descuento" value={String(descuentoNum)} />
            <input
              type="hidden"
              name="items"
              value={JSON.stringify(
                items.map((i) => ({
                  producto_id: i.producto_id,
                  cantidad: i.cantidad,
                }))
              )}
            />

            <button
              type="submit"
              className="btn btn-primary mt-2"
              disabled={pending || items.length === 0}
            >
              {pending
                ? "Guardando..."
                : inicial
                  ? "Guardar cambios"
                  : "Guardar cotización"}
            </button>

            {state?.error ? (
              <div role="alert" className="alert alert-error mt-2 py-2 text-sm">
                <span>{state.error}</span>
              </div>
            ) : null}
          </div>
        </form>
      </aside>
    </div>
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