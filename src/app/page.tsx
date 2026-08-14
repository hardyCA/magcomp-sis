import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-3xl text-center">
        <p className="badge badge-primary badge-outline mb-6">Sistema Comercial</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          MAG COMP
        </h1>
        <p className="mt-4 text-lg text-base-content/70">
          Gestión de ventas, inventario, cotizaciones y catálogo, en BOB y USD.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/catalogo" className="btn btn-primary">
            Ver catálogo
          </Link>
          <Link href="/login" className="btn btn-outline">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
