"use client";

import { useActionState } from "react";
import {
  crearUsuario,
  type UsuarioState,
} from "@/modules/usuarios/actions";

export function NuevoUsuarioForm({
  roles,
}: {
  roles: { id: number; nombre: string }[];
}) {
  const [state, formAction, pending] = useActionState<UsuarioState, FormData>(
    crearUsuario,
    undefined
  );

  return (
    <div className="card w-full bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Nuevo usuario</h2>
        <p className="text-sm text-base-content/60">
          Crea la cuenta directamente sin esperar el registro público.
        </p>

        <form
          action={formAction}
          className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4"
        >
          <label className="form-control">
            <span className="label-text">Nombre</span>
            <input
              type="text"
              name="nombre"
              required
              className="input input-bordered w-full"
              placeholder="Ej. María López"
            />
          </label>

          <label className="form-control">
            <span className="label-text">Correo</span>
            <input
              type="email"
              name="email"
              required
              className="input input-bordered w-full"
              placeholder="correo@ejemplo.com"
            />
          </label>

          <label className="form-control">
            <span className="label-text">Contraseña</span>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="input input-bordered w-full"
              placeholder="Mínimo 6 caracteres"
            />
          </label>

          <label className="form-control">
            <span className="label-text">Rol</span>
            <select
              name="rol_id"
              required
              defaultValue=""
              className="select select-bordered w-full"
            >
              <option value="" disabled>
                Seleccionar rol
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end md:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pending}
            >
              {pending ? "Creando..." : "Crear usuario"}
            </button>
          </div>
        </form>

        {state?.error ? (
          <div role="alert" className="alert alert-error py-2 text-sm">
            <span>{state.error}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}