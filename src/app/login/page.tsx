import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/modules/auth/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; registrado?: string; inactivo?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-4xl flex-col items-center gap-6">
        <div className="w-full overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-xl lg:grid lg:grid-cols-2">
        <aside className="hidden flex-col justify-between bg-gradient-to-br from-primary to-primary/60 p-10 text-primary-content lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Image
                src="/logo.png"
                alt="Logo MAG COMP"
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight">MAG COMP</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold leading-tight">
              Tu tienda, en un solo sistema
            </h1>
            <p className="mt-3 text-primary-content/85">
              Gestiona ventas, inventario, cotizaciones, catálogo y reportes
              desde un solo lugar, de forma rápida y segura.
            </p>
          </div>

          <p className="text-sm text-primary-content/70">
            Acceso exclusivo para el personal autorizado.
          </p>
        </aside>

        <section className="flex flex-col justify-center px-6 py-10 sm:px-10">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Image
                src="/logo.png"
                alt="Logo MAG COMP"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </div>
            <span className="text-lg font-bold tracking-tight">MAG COMP</span>
          </div>

          <h1 className="text-2xl font-bold">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-base-content/60">
            Bienvenido de nuevo. Ingresa tus credenciales para continuar.
          </p>

          {params.registrado ? (
            <div role="alert" className="alert alert-success mt-6 text-sm">
              <span>
                Cuenta creada. Revisa tu correo para confirmarla antes de
                ingresar.
              </span>
            </div>
          ) : null}

          {params.inactivo ? (
            <div role="alert" className="alert alert-error mt-6 text-sm">
              <span>
                Tu usuario está desactivado. Contacta al administrador.
              </span>
            </div>
          ) : null}

          <LoginForm next={params.next} />

          <p className="mt-6 text-center text-sm text-base-content/60">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="link link-primary font-semibold">
              Crear cuenta
            </Link>
          </p>
        </section>
      </div>

      <Link href="/" className="link link-neutral text-sm">
        Volver al inicio
      </Link>
      </div>
    </main>
  );
}
