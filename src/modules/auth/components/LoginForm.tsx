"use client";

import { useActionState } from "react";
import { login, type AuthState } from "@/modules/auth/actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, undefined);

  return (
    <form action={formAction} className="card w-full max-w-sm bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl">Iniciar sesión</h2>

        {next ? <input type="hidden" name="next" value={next} /> : null}

        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Correo</span>
          </div>
          <input
            type="email"
            name="email"
            placeholder="correo@ejemplo.com"
            className="input input-bordered w-full"
            required
            autoComplete="email"
          />
        </label>

        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Contraseña</span>
          </div>
          <input
            type="password"
            name="password"
            placeholder="••••••"
            className="input input-bordered w-full"
            required
            autoComplete="current-password"
          />
        </label>

        {state?.error ? (
          <div role="alert" className="alert alert-error mt-2 py-2 text-sm">
            <span>{state.error}</span>
          </div>
        ) : null}

        <div className="card-actions mt-4">
          <button type="submit" className="btn btn-primary w-full" disabled={pending}>
            {pending ? "Ingresando..." : "Ingresar"}
          </button>
        </div>
      </div>
    </form>
  );
}
