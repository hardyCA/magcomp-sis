"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FiltroCategorias } from "@/components/FiltroCategorias";
import { FiltroMarcas } from "@/components/FiltroMarcas";

export function FiltrosProductos({
  categorias,
  marcas,
  q,
  categoriasSeleccionadas,
  marcasSeleccionadas,
}: {
  categorias: { id: number; nombre: string }[];
  marcas: { id: number; nombre: string }[];
  q: string;
  categoriasSeleccionadas: number[];
  marcasSeleccionadas: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [busqueda, setBusqueda] = useState(q);
  const [prevQ, setPrevQ] = useState(q);

  if (prevQ !== q) {
    setPrevQ(q);
    setBusqueda(q);
  }

  const aplicar = useCallback(
    (nuevos: { q?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("pagina");

      (Object.entries(nuevos) as [string, string][]).forEach(([clave, valor]) => {
        if (valor) {
          params.set(clave, valor);
        } else {
          params.delete(clave);
        }
      });

      const s = params.toString();
      router.push(s ? `${pathname}?${s}` : pathname);
    },
    [searchParams, pathname, router]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (busqueda !== q) {
        aplicar({ q: busqueda });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [busqueda, q, aplicar]);

  function limpiar() {
    setBusqueda("");
    router.push(pathname);
  }

  const cantidadActivos =
    (q ? 1 : 0) + categoriasSeleccionadas.length + marcasSeleccionadas.length;

  return (
    <div className="card w-full border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                />
              </svg>
            </span>
            <div>
              <h2 className="text-sm font-semibold leading-tight">Filtros</h2>
              <p className="text-xs text-base-content/50">
                Busca por nombre, categoría o marca
              </p>
            </div>
          </div>

          {cantidadActivos > 0 ? (
            <button
              type="button"
              onClick={limpiar}
              className="btn btn-ghost btn-sm gap-1.5 text-base-content/60 hover:text-error"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Limpiar
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)]">
          <FiltroCategorias
            categorias={categorias}
            seleccionadas={categoriasSeleccionadas}
          />

          <FiltroMarcas marcas={marcas} seleccionadas={marcasSeleccionadas} />

          <label className="relative block">
            <span className="sr-only">Buscar producto</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre o código de barras"
              className="input input-bordered h-11 w-full pl-9 pr-9"
            />
            {busqueda ? (
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  aplicar({ q: "" });
                }}
                aria-label="Limpiar búsqueda"
                className="btn btn-ghost btn-xs btn-circle absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            ) : null}
          </label>
        </div>
      </div>
    </div>
  );
}