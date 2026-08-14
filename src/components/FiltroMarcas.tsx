"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FiltroOpciones } from "@/components/FiltroOpciones";

export function FiltroMarcas({
  marcas,
  seleccionadas,
}: {
  marcas: { id: number; nombre: string }[];
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
      params.set("marcas", nuevas.join(","));
    } else {
      params.delete("marcas");
    }
    const s = params.toString();
    router.push(s ? `${pathname}?${s}` : pathname);
  };

  return (
    <FiltroOpciones
      etiqueta="Marcas"
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
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      }
      opciones={marcas}
      seleccionadas={seleccionadas}
      onCambio={aplicar}
    />
  );
}