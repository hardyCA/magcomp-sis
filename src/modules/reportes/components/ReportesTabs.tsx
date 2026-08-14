"use client";

import { useState } from "react";
import { formatMoneda } from "@/utils/format";
import { type Moneda } from "@/utils/moneda";

type ProductoVendido = { nombre: string; cantidad: number; ingresos: number };
type ProductoStock = {
  id: number;
  nombre: string;
  codigo_barras: string | null;
  imagen: string | null;
  stock: number;
  stock_minimo: number;
  precio_venta: number;
  moneda: Moneda;
  categoria: string;
};
type MovimientoReporte = {
  tipo_movimiento: "ENTRADA" | "SALIDA" | "AJUSTE" | "VENTA";
  cantidad: number;
  productos: {
    categoria_id: number | null;
    categorias: { nombre: string } | null;
  } | null;
};

export type ReportesDatos = {
  monedaBase: Moneda;
  desde: string;
  hasta: string;
  totalVendidoBase: number;
  totalVentas: number;
  ticketPromedio: number;
  topProductos: ProductoVendido[];
  stockBajo: ProductoStock[];
  productosPorCategoria: [string, ProductoStock[]][];
  totalUnidadesStock: number;
  movimientos: MovimientoReporte[];
  totalCotizacionesBase: number;
  estadosCotizaciones: Record<
    "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "VENCIDA",
    number
  >;
};

const etiquetaMovimiento: Record<string, string> = {
  ENTRADA: "Entradas",
  SALIDA: "Salidas",
  AJUSTE: "Ajustes",
  VENTA: "Ventas (stock)",
};

type Tab = "ventas" | "inventario" | "cotizaciones";

const tabs: { id: Tab; label: string }[] = [
  { id: "ventas", label: "Ventas" },
  { id: "inventario", label: "Inventario" },
  { id: "cotizaciones", label: "Cotizaciones" },
];

export function ReportesTabs({ datos }: { datos: ReportesDatos }) {
  const [tab, setTab] = useState<Tab>("ventas");
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<
    Set<string> | null
  >(null);
  const {
    monedaBase,
    totalVendidoBase,
    totalVentas,
    ticketPromedio,
    topProductos,
    stockBajo,
    productosPorCategoria,
    movimientos,
    totalCotizacionesBase,
    estadosCotizaciones,
  } = datos;

  const categoriasDisponibles = productosPorCategoria.map(([c]) => c);
  const mostrarTodas =
    categoriasSeleccionadas === null ||
    categoriasDisponibles.every((c) => categoriasSeleccionadas.has(c));
  const categoriasVisibles =
    categoriasSeleccionadas === null
      ? productosPorCategoria
      : productosPorCategoria.filter(([c]) => categoriasSeleccionadas.has(c));
  const categoriasSeleccionadasSet =
    categoriasSeleccionadas ?? new Set(categoriasDisponibles);
  const stockBajoFiltrado = stockBajo.filter((p) =>
    categoriasSeleccionadasSet.has(p.categoria ?? "Sin categoría")
  );
  const movimientosFiltrados = movimientos.filter((m) =>
    categoriasSeleccionadasSet.has(m.productos?.categorias?.nombre ?? "Sin categoría")
  );
  const resumenMovimientos = (() => {
    const r = {
      ENTRADA: { registros: 0, unidades: 0 },
      SALIDA: { registros: 0, unidades: 0 },
      AJUSTE: { registros: 0, unidades: 0 },
      VENTA: { registros: 0, unidades: 0 },
    };
    for (const m of movimientosFiltrados) {
      r[m.tipo_movimiento].registros += 1;
      r[m.tipo_movimiento].unidades += m.cantidad;
    }
    return r;
  })();
  const toggleCategoria = (categoria: string) => {
    setCategoriasSeleccionadas((prev) => {
      if (prev === null) {
        return new Set([categoria]);
      }
      const base = new Set(prev);
      if (base.has(categoria)) {
        base.delete(categoria);
      } else {
        base.add(categoria);
      }
      return base.size === 0 ? null : base;
    });
  };

  return (
    <div>
      <div role="tablist" className="tabs tabs-boxed tabs-sm mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            className={`tab ${tab === t.id ? "tab-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ventas" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body">
                <p className="text-sm text-base-content/60">Total vendido</p>
                <p className="text-2xl font-bold">
                  {formatMoneda(totalVendidoBase, monedaBase)}
                </p>
              </div>
            </div>
            <div className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body">
                <p className="text-sm text-base-content/60">Ventas registradas</p>
                <p className="text-2xl font-bold">{totalVentas}</p>
              </div>
            </div>
            <div className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body">
                <p className="text-sm text-base-content/60">Ticket promedio</p>
                <p className="text-2xl font-bold">
                  {formatMoneda(ticketPromedio, monedaBase)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-bold">Productos más vendidos</h2>
            {topProductos.length === 0 ? (
              <p className="text-base-content/50">Sin ventas en el período.</p>
            ) : (
              <div className="card border border-base-300 bg-base-100 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Producto</th>
                        <th className="text-right">Unidades</th>
                        <th className="text-right">Ingresos ({monedaBase})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProductos.map((p, i) => (
                        <tr key={p.nombre}>
                          <td>{i + 1}</td>
                          <td className="font-medium">{p.nombre}</td>
                          <td className="text-right">{p.cantidad}</td>
                          <td className="text-right">
                            {formatMoneda(p.ingresos, monedaBase)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {tab === "inventario" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body">
                <p className="text-sm text-base-content/60">Productos activos</p>
                <p className="text-2xl font-bold">
                  {categoriasVisibles.reduce(
                    (acc, [, lista]) => acc + lista.length,
                    0
                  )}
                </p>
              </div>
            </div>
            <div className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body">
                <p className="text-sm text-base-content/60">Unidades en stock</p>
                <p className="text-2xl font-bold">
                  {categoriasVisibles.reduce(
                    (acc, [, lista]) =>
                      acc + lista.reduce((a, p) => a + p.stock, 0),
                    0
                  )}
                </p>
              </div>
            </div>
            <div className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body">
                <p className="text-sm text-base-content/60">Stock bajo</p>
                <p className="text-2xl font-bold">{stockBajoFiltrado.length}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-bold">
              Productos y stock por categoría
            </h2>

            {categoriasDisponibles.length > 1 ? (
              <div className="card mb-4 border border-base-300 bg-base-100 shadow-sm">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      Filtrar por categorías
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => setCategoriasSeleccionadas(null)}
                    >
                      Mostrar todas
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {categoriasDisponibles.map((c) => {
                      const seleccionada =
                        categoriasSeleccionadas !== null &&
                        categoriasSeleccionadas.has(c);
                      return (
                        <label
                          key={c}
                          className="flex cursor-pointer items-center gap-2 rounded-box border border-base-300 px-3 py-1.5"
                          style={
                            seleccionada
                              ? {
                                  backgroundColor: "var(--p)",
                                  color: "var(--pc)",
                                }
                              : undefined
                          }
                        >
                          <input
                            type="checkbox"
                            checked={seleccionada}
                            onChange={() => toggleCategoria(c)}
                            className="checkbox checkbox-sm"
                          />
                          <span className="text-sm font-medium">{c}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-base-content/50">
                    El filtro aplica a productos, stock bajo y movimientos. Con
                    "Mostrar todas" se ven todas las categorías.
                  </p>
                </div>
              </div>
            ) : null}

            {productosPorCategoria.length === 0 ? (
              <p className="text-base-content/50">Sin productos activos.</p>
            ) : categoriasVisibles.length === 0 ? (
              <p className="text-base-content/50">
                No hay categorías seleccionadas.
              </p>
            ) : (
              <div className="space-y-4">
                {categoriasVisibles.map(([categoria, lista]) => (
                  <div
                    key={categoria}
                    className="card border border-base-300 bg-base-100 shadow-sm"
                  >
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <h3 className="card-title text-base">{categoria}</h3>
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
                              <th>Precio</th>
                              <th className="text-right">Stock</th>
                              <th className="text-right">Stock mín.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lista.map((p) => (
                              <tr key={p.id}>
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
                                <td className="font-medium">{p.nombre}</td>
                                <td className="font-mono text-xs text-base-content/60">
                                  {p.codigo_barras ?? "—"}
                                </td>
                                <td>
                                  {formatMoneda(p.precio_venta, p.moneda)}
                                </td>
                                <td className="text-right">
                                  <span
                                    className={
                                      p.stock === 0
                                        ? "badge badge-error badge-sm"
                                        : p.stock <= p.stock_minimo
                                          ? "badge badge-warning badge-sm"
                                          : "badge badge-success badge-sm"
                                    }
                                  >
                                    {p.stock}
                                  </span>
                                </td>
                                <td className="text-right">{p.stock_minimo}</td>
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body">
                <h3 className="card-title text-base">
                  Productos con stock bajo
                </h3>
                {stockBajoFiltrado.length === 0 ? (
                  <p className="text-sm text-base-content/50">
                    Todo el stock está por encima del mínimo.
                  </p>
                ) : (
                  <ul className="divide-y divide-base-200">
                    {stockBajoFiltrado.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <span className="font-medium">{p.nombre}</span>
                        <span
                          className={
                            p.stock === 0
                              ? "badge badge-error badge-sm"
                              : "badge badge-warning badge-sm"
                          }
                        >
                          {p.stock} / mín. {p.stock_minimo}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body">
                <h3 className="card-title text-base">Movimientos del período</h3>
                {resumenMovimientos.ENTRADA.registros +
                  resumenMovimientos.SALIDA.registros +
                  resumenMovimientos.AJUSTE.registros +
                  resumenMovimientos.VENTA.registros ===
                0 ? (
                  <p className="text-sm text-base-content/50">
                    Sin movimientos en el período.
                  </p>
                ) : (
                  <ul className="divide-y divide-base-200">
                    {(
                      Object.keys(etiquetaMovimiento) as (keyof typeof resumenMovimientos)[]
                    ).map((tipo) => {
                      const r = resumenMovimientos[tipo];
                      return (
                        <li
                          key={tipo}
                          className="flex items-center justify-between py-2 text-sm"
                        >
                          <span className="font-medium">
                            {etiquetaMovimiento[tipo]}
                          </span>
                          <span className="text-base-content/70">
                            {r.registros} registro{r.registros === 1 ? "" : "s"} ·{" "}
                            {r.unidades} unidad{r.unidades === 1 ? "" : "es"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "cotizaciones" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body">
              <p className="text-sm text-base-content/60">Total ({monedaBase})</p>
              <p className="text-2xl font-bold">
                {formatMoneda(totalCotizacionesBase, monedaBase)}
              </p>
            </div>
          </div>
          {(
            Object.keys(estadosCotizaciones) as (keyof typeof estadosCotizaciones)[]
          ).map((estado) => (
            <div
              key={estado}
              className="card border border-base-300 bg-base-100 shadow-sm"
            >
              <div className="card-body">
                <p className="text-sm text-base-content/60">{estado}</p>
                <p className="text-2xl font-bold">
                  {estadosCotizaciones[estado]}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}