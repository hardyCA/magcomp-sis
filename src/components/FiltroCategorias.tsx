"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FiltroOpciones } from "@/components/FiltroOpciones";

export function FiltroCategorias({
  categorias,
  seleccionadas,
}: {
  categorias: { id: number; nombre: string }[];
  seleccionadas: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const aplicar = (nuevas: number[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("pagina");
    params.delete("q");
    if (nuevas.length > 0) {
      params.set("categorias", nuevas.join(","));
    } else {
      params.set("categorias", "todas");
    }
    const s = params.toString();
    router.push(s ? `${pathname}?${s}` : pathname);
  };

  return (
    <FiltroOpciones
      etiqueta="Categorías"
      icono={
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
            strokeWidth={1.8}
            d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M6 6h.008v.008H6V6z"
          />
        </svg>
      }
      opciones={categorias}
      seleccionadas={seleccionadas}
      onCambio={aplicar}
    />
  );
}