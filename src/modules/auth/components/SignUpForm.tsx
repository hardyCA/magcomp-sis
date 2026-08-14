"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type AuthState } from "@/modules/auth/actions";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signup, undefined);

  return (
    <form action={formAction} className="card w-full max-w-sm bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl">Crear cuenta</h2>

        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Nombre</span>
          </div>
          <input
            type="text"
            name="nombre"
            placeholder="Nombre completo"
            className="input input-bordered w-full"
            required
            autoComplete="name"
          />
        </label>

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
            placeholder="Mínimo 6 caracteres"
            className="input input-bordered w-full"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>

        {state?.error ? (
          <div role="alert" className="alert alert-error mt-2 py-2 text-sm">
            <span>{state.error}</span>
          </div>
        ) : null}

        <div className="card-actions mt-4">
          <button type="submit" className="btn btn-primary w-full" disabled={pending}>
            {pending ? "Registrando..." : "Registrarse"}
          </button>
        </div>

        <p className="mt-3 text-center text-sm text-base-content/60">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="link link-primary">
            Inicia sesión
          </Link>
        </p>
      </div>
    </form>
  );
}
