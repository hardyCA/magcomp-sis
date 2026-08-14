"use client";

import { useState, useActionState } from "react";
import {
  crearMarca,
  actualizarMarca,
  eliminarMarca,
  type MarcaState,
} from "@/modules/marcas/actions";

export function MarcasManager({
  marcas,
}: {
  marcas: { id: number; nombre: string }[];
}) {
  const [state, formAction, pending] = useActionState<MarcaState, FormData>(
    crearMarca,
    undefined
  );

  return (
    <div className="card w-full bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Marcas</h2>

        <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="form-control flex-1">
            <div className="label">
              <span className="label-text">Nueva marca</span>
            </div>
            <input
              type="text"
              name="nombre"
              placeholder="Ej. Samsung"
              className="input input-bordered w-full"
              required
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Agregando..." : "Agregar"}
          </button>
        </form>

        {state?.error ? (
          <div role="alert" className="alert alert-error py-2 text-sm">
            <span>{state.error}</span>
          </div>
        ) : null}

        {marcas.length === 0 ? (
          <p className="py-4 text-center text-base-content/60">
            Aún no hay marcas. Crea la primera.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-base-200">
            {marcas.map((marca) => (
              <MarcaRow key={marca.id} marca={marca} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MarcaRow({ marca }: { marca: { id: number; nombre: string } }) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
        <form action={actualizarMarca} className="flex flex-1 flex-col gap-2 sm:flex-row">
          <input type="hidden" name="id" value={marca.id} />
          <input
            type="text"
            name="nombre"
            defaultValue={marca.nombre}
            className="input input-bordered input-sm w-full"
            required
          />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm">
              Guardar
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setEditando(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 py-3">
      <span className="font-medium">{marca.nombre}</span>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setEditando(true)}
        >
          Editar
        </button>
        <form
          action={eliminarMarca}
          onSubmit={(e) => {
            if (!window.confirm(`¿Eliminar la marca "${marca.nombre}"?`)) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={marca.id} />
          <button type="submit" className="btn btn-outline btn-error btn-sm">
            Eliminar
          </button>
        </form>
      </div>
    </li>
  );
}
