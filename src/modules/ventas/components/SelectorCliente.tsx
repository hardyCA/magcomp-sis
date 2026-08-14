"use client";

import { useMemo, useRef, useState } from "react";

export type ClienteVenta = { id: number; nombre: string };

export function SelectorCliente({
  clientes,
  valorInicial = "",
}: {
  clientes: ClienteVenta[];
  valorInicial?: string;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState(valorInicial);
  const ref = useRef<HTMLDivElement>(null);

  const sugerencias = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    return clientes
      .filter((c) => c.nombre.toLowerCase().includes(q))
      .slice(0, 6);
  }, [busqueda, clientes]);

  const esNuevo =
    nombre.trim().length > 0 &&
    !clientes.some(
      (c) => c.nombre.trim().toLowerCase() === nombre.trim().toLowerCase()
    );

  function elegir(value: string) {
    setNombre(value);
    setBusqueda(value);
    setAbierto(false);
  }

  return (
    <label className="form-control">
      <div className="label">
        <span className="label-text">Cliente</span>
      </div>
      <div ref={ref} className="relative">
        <input
          type="text"
          name="cliente"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setBusqueda(e.target.value);
            if (e.target.value.trim().length > 0) {
              setAbierto(true);
            } else {
              setAbierto(false);
            }
          }}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          placeholder="Buscar o escribir un cliente"
          className="input input-bordered w-full"
          autoComplete="off"
        />
        {abierto ? (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-lg">
            {sugerencias.length === 0 && !esNuevo ? (
              <p className="px-3 py-2 text-sm text-base-content/50">
                No se encontró un cliente con ese nombre.
              </p>
            ) : null}
            <ul className="max-h-56 overflow-y-auto">
              {sugerencias.map((cliente) => (
                <li key={cliente.id}>
                  <button
                    type="button"
                    onMouseDown={() => elegir(cliente.nombre)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-base-200"
                  >
                    {cliente.nombre}
                  </button>
                </li>
              ))}
              {esNuevo ? (
                <li>
                  <button
                    type="button"
                    onMouseDown={() => elegir(nombre.trim())}
                    className="block w-full px-3 py-2 text-left text-sm font-semibold text-primary hover:bg-base-200"
                  >
                    + Crear &quot;{nombre.trim()}&quot;
                  </button>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
      {esNuevo ? (
        <div className="mt-1 text-xs text-primary">
          Se guardará como nuevo cliente al registrar la venta.
        </div>
      ) : null}
    </label>
  );
}