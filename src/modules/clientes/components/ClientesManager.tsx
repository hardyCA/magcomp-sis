"use client";

import { useActionState, useState } from "react";
import {
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  type ClienteState,
} from "@/modules/clientes/actions";

export function ClientesManager({
  clientes,
  pagina = 1,
}: {
  clientes: { id: number; nombre: string }[];
  pagina?: number;
}) {
  const [state, formAction, pending] = useActionState<ClienteState, FormData>(
    crearCliente,
    undefined
  );

  return (
    <div className="card w-full bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Clientes</h2>

        <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="pagina" value={pagina} />
          <label className="form-control flex-1">
            <div className="label">
              <span className="label-text">Nuevo cliente</span>
            </div>
            <input
              type="text"
              name="nombre"
              placeholder="Ej. Juan Pérez"
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

        {clientes.length === 0 ? (
          <p className="py-4 text-center text-base-content/60">
            Aún no hay clientes. Crea el primero.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-base-200">
            {clientes.map((cliente) => (
              <ClienteRow key={cliente.id} cliente={cliente} pagina={pagina} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ClienteRow({
  cliente,
  pagina,
}: {
  cliente: { id: number; nombre: string };
  pagina: number;
}) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
        <form action={actualizarCliente} className="flex flex-1 flex-col gap-2 sm:flex-row">
          <input type="hidden" name="id" value={cliente.id} />
          <input type="hidden" name="pagina" value={pagina} />
          <input
            type="text"
            name="nombre"
            defaultValue={cliente.nombre}
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
      <span className="font-medium">{cliente.nombre}</span>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setEditando(true)}
        >
          Editar
        </button>
        <form
          action={eliminarCliente}
          onSubmit={(e) => {
            if (!window.confirm(`¿Eliminar el cliente "${cliente.nombre}"?`)) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={cliente.id} />
          <input type="hidden" name="pagina" value={pagina} />
          <button type="submit" className="btn btn-outline btn-error btn-sm">
            Eliminar
          </button>
        </form>
      </div>
    </li>
  );
}