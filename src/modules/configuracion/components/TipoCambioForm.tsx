"use client";

import { useActionState } from "react";
import {
  actualizarTipoCambio,
  type TipoCambioState,
} from "@/modules/configuracion/actions";

export function TipoCambioForm({ valor }: { valor: number }) {
  const [state, formAction, pending] = useActionState<TipoCambioState, FormData>(
    actualizarTipoCambio,
    undefined
  );

  return (
    <form action={formAction} className="card w-full max-w-xl bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Tipo de cambio global</h2>
        <p className="text-sm text-base-content/60">
          Se usa solo para ver los precios en bolivianos o dólares en el catálogo.
          Lo actualizas manualmente cuando quieras.
        </p>

        <label className="form-control mt-2">
          <div className="label">
            <span className="label-text">1 USD equivale a (en bolivianos)</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="number"
              name="valor"
              defaultValue={valor}
              min={0}
              step="0.0001"
              className="input input-bordered w-full"
              required
            />
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </label>

        {state?.error ? (
          <div role="alert" className="alert alert-error mt-2 py-2 text-sm">
            <span>{state.error}</span>
          </div>
        ) : null}
      </div>
    </form>
  );
}
