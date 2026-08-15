"use client";

import { useActionState, useState } from "react";
import {
  actualizarUsuario,
  cambiarContrasena,
  eliminarUsuario,
  type UsuarioState,
} from "@/modules/usuarios/actions";

export type UsuarioRow = {
  id: string;
  nombre: string;
  email: string;
  rol_id: number | null;
  rol_nombre: string | null;
  activo: boolean;
};

export function UsuariosManager({
  usuarios,
  roles,
  usuarioActualId,
}: {
  usuarios: UsuarioRow[];
  roles: { id: number; nombre: string }[];
  usuarioActualId: string;
}) {
  const administradores = usuarios.filter(
    (u) => u.rol_nombre === "ADMINISTRADOR"
  ).length;
  const vendedores = usuarios.filter((u) => u.rol_nombre === "VENDEDOR").length;
  const inactivos = usuarios.filter((u) => !u.activo).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <span className="badge badge-primary badge-lg">
          {administradores} admin
          {administradores === 1 ? "" : "s"}
        </span>
        <span className="badge badge-ghost badge-lg">
          {vendedores} vendedor{vendedores === 1 ? "" : "es"}
        </span>
        <span className="badge badge-neutral badge-lg">
          {inactivos} inactivo{inactivos === 1 ? "" : "s"}
        </span>
      </div>

      <div className="card w-full bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Usuarios</h2>
          <p className="text-sm text-base-content/60">
            Edita un usuario, cambia su rol, su contraseña, actívalo o elimínalo.
            Los nuevos usuarios que se registran obtienen el rol Vendedor por
            defecto.
          </p>

          {usuarios.length === 0 ? (
            <p className="py-4 text-center text-base-content/60">
              Aún no hay usuarios.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <UsuarioRow
                      key={usuario.id}
                      usuario={usuario}
                      roles={roles}
                      esYo={usuario.id === usuarioActualId}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UsuarioRow({
  usuario,
  roles,
  esYo,
}: {
  usuario: UsuarioRow;
  roles: { id: number; nombre: string }[];
  esYo: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [cambiandoPass, setCambiandoPass] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [activo, setActivo] = useState(usuario.activo);
  const [state, formAction, pending] = useActionState<UsuarioState, FormData>(
    actualizarUsuario,
    undefined
  );
  const [passState, passAction, passPending] = useActionState<
    UsuarioState,
    FormData
  >(cambiarContrasena, undefined);

  if (editando) {
    return (
      <tr>
        <td colSpan={5}>
          <form
            action={formAction}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <input type="hidden" name="id" value={usuario.id} />

            <label className="form-control flex-1">
              <span className="label-text text-xs">Nombre</span>
              <input
                type="text"
                name="nombre"
                defaultValue={usuario.nombre}
                className="input input-bordered input-sm w-full"
                required
              />
            </label>

            <label className="form-control">
              <span className="label-text text-xs">Rol</span>
              <select
                name="rol_id"
                defaultValue={String(usuario.rol_id ?? "")}
                className="select select-bordered select-sm"
                disabled={esYo}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label-text text-xs">Estado</span>
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  name="activo"
                  value="1"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="toggle toggle-success toggle-sm"
                  disabled={esYo}
                />
                <span className="label-text text-sm">
                  {activo ? "Activo" : "Inactivo"}
                </span>
              </label>
            </label>

            <div className="flex gap-2 self-end">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={pending}
              >
                {pending ? "Guardando..." : "Guardar"}
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

          {state?.error ? (
            <div role="alert" className="alert alert-error mt-2 py-2 text-sm">
              <span>{state.error}</span>
            </div>
          ) : null}
        </td>
      </tr>
    );
  }

  if (cambiandoPass) {
    return (
      <tr>
        <td colSpan={5}>
          <form
            action={passAction}
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
          >
            <input type="hidden" name="id" value={usuario.id} />

            <label className="form-control flex-1">
              <span className="label-text text-xs">
                Nueva contraseña para {usuario.nombre}
              </span>
              <input
                type="password"
                name="password"
                className="input input-bordered input-sm w-full"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </label>

            <label className="form-control flex-1">
              <span className="label-text text-xs">Confirmar contraseña</span>
              <input
                type="password"
                name="confirmacion"
                className="input input-bordered input-sm w-full"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={passPending}
              >
                {passPending ? "Guardando..." : "Cambiar"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setCambiandoPass(false)}
              >
                Cancelar
              </button>
            </div>
          </form>

          {passState?.error ? (
            <div role="alert" className="alert alert-error mt-2 py-2 text-sm">
              <span>{passState.error}</span>
            </div>
          ) : null}
        </td>
      </tr>
    );
  }

  if (confirmando) {
    return (
      <tr>
        <td colSpan={5}>
          <div
            role="alert"
            className="alert alert-warning flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <span className="font-semibold">
                ¿Eliminar a {usuario.nombre}?
              </span>
              <p className="text-sm">
                Se borrará su cuenta y ya no podrá entrar al sistema. Esta
                acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-2">
              <form action={eliminarUsuario}>
                <input type="hidden" name="id" value={usuario.id} />
                <button type="submit" className="btn btn-error btn-sm">
                  Sí, eliminar
                </button>
              </form>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setConfirmando(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={usuario.activo ? "" : "opacity-60"}>
      <td className="font-medium">
        {usuario.nombre}
        {esYo ? (
          <span className="badge badge-primary badge-sm ml-2">Tú</span>
        ) : null}
      </td>
      <td className="text-sm">{usuario.email}</td>
      <td>
        <span
          className={`badge ${
            usuario.rol_nombre === "ADMINISTRADOR"
              ? "badge-primary"
              : "badge-ghost"
          }`}
        >
          {usuario.rol_nombre ?? "Sin rol"}
        </span>
      </td>
      <td>
        <span
          className={`badge ${
            usuario.activo ? "badge-success" : "badge-neutral"
          }`}
        >
          {usuario.activo ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td className="text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setEditando(true)}
          >
            Editar
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setCambiandoPass(true)}
          >
            Contraseña
          </button>
          {!esYo ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm text-error"
              onClick={() => setConfirmando(true)}
            >
              Eliminar
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}