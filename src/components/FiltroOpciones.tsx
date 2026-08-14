"use client";

import { useState, type ReactNode } from "react";

function IconoCheck({ activo }: { activo: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-4 w-4 shrink-0 ${
        activo ? "text-primary" : "text-transparent"
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export function FiltroOpciones({
  etiqueta,
  icono,
  opciones,
  seleccionadas,
  onCambio,
}: {
  etiqueta: string;
  icono?: ReactNode;
  opciones: { id: number; nombre: string }[];
  seleccionadas: number[];
  onCambio: (ids: number[]) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const tieneSeleccion = seleccionadas.length > 0;

  function toggle(id: number) {
    if (seleccionadas.includes(id)) {
      onCambio(seleccionadas.filter((x) => x !== id));
    } else {
      onCambio([...seleccionadas, id]);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className={`btn btn-outline h-11 w-full justify-between gap-2 px-3 font-medium ${
          tieneSeleccion ? "text-primary" : ""
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={`shrink-0 ${
              tieneSeleccion ? "text-primary" : "text-base-content/50"
            }`}
          >
            {icono}
          </span>
          <span className="truncate">{etiqueta}</span>
          {tieneSeleccion ? (
            <span className="badge badge-primary badge-sm">
              {seleccionadas.length}
            </span>
          ) : null}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 shrink-0 text-base-content/50 transition-transform ${
            abierto ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {abierto ? (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAbierto(false)}
            aria-hidden="true"
          />
          <ul
            role="listbox"
            aria-label={etiqueta}
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-box border border-base-300 bg-base-100 p-1 shadow-lg"
          >
            <li role="option" aria-selected={!tieneSeleccion}>
              <button
                type="button"
                onClick={() => onCambio([])}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                  !tieneSeleccion
                    ? "bg-primary/10 font-semibold text-primary"
                    : "hover:bg-base-200"
                }`}
              >
                <IconoCheck activo={!tieneSeleccion} />
                <span className="truncate">Todas</span>
              </button>
            </li>
            {opciones.length === 0 ? (
              <li className="px-3 py-2 text-sm text-base-content/50">
                Sin opciones
              </li>
            ) : (
              opciones.map((o) => {
                const activa = seleccionadas.includes(o.id);
                return (
                  <li key={o.id} role="option" aria-selected={activa}>
                    <button
                      type="button"
                      onClick={() => toggle(o.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                        activa
                          ? "bg-primary/10 font-semibold text-primary"
                          : "hover:bg-base-200"
                      }`}
                    >
                      <IconoCheck activo={activa} />
                      <span className="truncate">{o.nombre}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </>
      ) : null}
    </div>
  );
}