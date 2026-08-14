"use client";

import { useActionState } from "react";
import {
  ejecutarAccionCotizacion,
  type CotizacionAccionState,
} from "@/modules/cotizaciones/actions";

type Accion = "ACEPTAR" | "RECHAZAR" | "VENCER" | "CONVERTIR";

const CONFIG: Record<Accion, { accion: string; label: string; clase: string; confirmacion: string }> = {
  ACEPTAR: {
    accion: "ACEPTADA",
    label: "Aceptar",
    clase: "btn-success",
    confirmacion: "¿Marcar esta cotización como ACEPTADA?",
  },
  RECHAZAR: {
    accion: "RECHAZADA",
    label: "Rechazar",
    clase: "btn-error",
    confirmacion: "¿Rechazar esta cotización?",
  },
  VENCER: {
    accion: "VENCIDA",
    label: "Marcar vencida",
    clase: "btn-outline",
    confirmacion: "¿Marcar esta cotización como VENCIDA?",
  },
  CONVERTIR: {
    accion: "CONVERTIR",
    label: "Convertir en venta",
    clase: "btn-primary",
    confirmacion:
      "¿Convertir esta cotización en una venta? Se descontará el stock de los productos.",
  },
};

export function CotizacionAcciones({
  id,
  acciones,
}: {
  id: number;
  acciones: Accion[];
}) {
  const [state, formAction, pending] = useActionState<
    CotizacionAccionState,
    FormData
  >(ejecutarAccionCotizacion, undefined);

  return (
    <div className="flex flex-wrap gap-2">
      {acciones.map((accion) => {
        const config = CONFIG[accion];
        return (
          <form
            key={accion}
            action={formAction}
            onSubmit={(e) => {
              if (!window.confirm(config.confirmacion)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="accion" value={config.accion} />
            <button type="submit" className={`btn btn-sm ${config.clase}`} disabled={pending}>
              {config.label}
            </button>
          </form>
        );
      })}

      {state?.error ? (
        <div role="alert" className="alert alert-error w-full py-2 text-sm">
          <span>{state.error}</span>
        </div>
      ) : null}
    </div>
  );
}