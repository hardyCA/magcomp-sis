"use client";

import { useActionState } from "react";
import {
  actualizarMonedaBase,
  type MonedaBaseState,
} from "@/modules/configuracion/actions";
import { type Moneda } from "@/utils/moneda";

export function MonedaBaseForm({ monedaBase }: { monedaBase: Moneda }) {
  const [state, formAction, pending] = useActionState<MonedaBaseState, FormData>(
    actualizarMonedaBase,
    undefined
  );

  return (
    <form action={formAction} className="card w-full max-w-xl bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Moneda base</h2>
        <p className="text-sm text-base-content/60">
          Los precios de los productos se guardan en esta moneda. La otra moneda
          se usa solo para mostrar y convertir los precios.
        </p>

        <label className="form-control mt-2">
          <div className="label">
            <span className="label-text">Moneda base</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              name="moneda_principal"
              defaultValue={monedaBase}
              className="select select-bordered w-full"
            >
              <option value="BOB">Bolivianos (Bs)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
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
