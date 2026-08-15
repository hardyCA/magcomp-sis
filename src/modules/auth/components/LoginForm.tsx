"use client";

import { useActionState, useState } from "react";
import { login, type AuthState } from "@/modules/auth/actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    login,
    undefined
  );
  const [verContrasena, setVerContrasena] = useState(false);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <label className="form-control w-full">
        <div className="label">
          <span className="label-text">Correo</span>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </span>
          <input
            type="email"
            name="email"
            placeholder="correo@ejemplo.com"
            className="input input-bordered w-full pl-10"
            required
            autoComplete="email"
            autoFocus
          />
        </div>
      </label>

      <label className="form-control w-full">
        <div className="label">
          <span className="label-text">Contraseña</span>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </span>
          <input
            type={verContrasena ? "text" : "password"}
            name="password"
            placeholder="••••••••"
            className="input input-bordered w-full pl-10 pr-10"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setVerContrasena((v) => !v)}
            aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="btn btn-ghost btn-xs absolute right-1 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
          >
            {verContrasena ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>
      </label>

      {state?.error ? (
        <div role="alert" className="alert alert-error py-2.5 text-sm">
          <span>{state.error}</span>
        </div>
      ) : null}

      <button
        type="submit"
        className="btn btn-primary btn-lg w-full"
        disabled={pending}
      >
        {pending ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            Ingresando...
          </>
        ) : (
          "Iniciar sesión"
        )}
      </button>
    </form>
  );
}
