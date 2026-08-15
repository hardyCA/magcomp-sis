"use client";

import { useActionState } from "react";
import {
  guardarPermisosRol,
  type UsuarioState,
} from "@/modules/usuarios/actions";

type Rol = { id: number; nombre: string };
type Modulo = { id: number; clave: string; nombre: string };

export function PermisosMatriz({
  roles,
  modulos,
  permisos,
}: {
  roles: Rol[];
  modulos: Modulo[];
  permisos: { rol_id: number; modulo_id: number }[];
}) {
  const porRol = new Map<number, Set<number>>();
  for (const p of permisos) {
    const set = porRol.get(p.rol_id) ?? new Set<number>();
    set.add(p.modulo_id);
    porRol.set(p.rol_id, set);
  }

  return (
    <div className="card w-full bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Permisos por rol</h2>
        <p className="text-sm text-base-content/60">
          Marca qué módulos ve cada rol en el menú y a qué páginas puede entrar.
        </p>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {roles.map((rol) => (
            <RolMatriz
              key={rol.id}
              rol={rol}
              modulos={modulos}
              seleccionados={porRol.get(rol.id) ?? new Set<number>()}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RolMatriz({
  rol,
  modulos,
  seleccionados,
}: {
  rol: Rol;
  modulos: Modulo[];
  seleccionados: Set<number>;
}) {
  const [state, formAction, pending] = useActionState<UsuarioState, FormData>(
    guardarPermisosRol,
    undefined
  );

  return (
    <form
      action={formAction}
      className="rounded-box border border-base-300 p-4"
    >
      <input type="hidden" name="rol_id" value={rol.id} />

      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold">{rol.nombre}</h3>
        <span className="badge badge-ghost badge-sm">
          {seleccionados.size} módulos
        </span>
      </div>

      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {modulos.map((m) => {
          const activo = seleccionados.has(m.id);
          return (
            <label
              key={m.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-base-200"
            >
              <input
                type="checkbox"
                name="modulo"
                value={m.clave}
                defaultChecked={activo}
                className="checkbox checkbox-sm checkbox-primary"
              />
              <span>{m.nombre}</span>
            </label>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={pending}
        >
          {pending ? "Guardando..." : "Guardar"}
        </button>
        {state?.error ? (
          <span className="text-sm text-error">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}