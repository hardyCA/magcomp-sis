import { requirePermiso } from "@/lib/session";
import Link from "next/link";

export default async function DashboardPage() {
  const profile = await requirePermiso("dashboard");

  const esAdmin = profile.rol === "ADMINISTRADOR";

  const modulos = [
    ...(esAdmin
      ? [
          { href: "/productos", titulo: "Productos", descripcion: "Gestiona el catálogo de productos" },
          { href: "/categorias", titulo: "Categorías", descripcion: "Organiza tus productos por categorías" },
          { href: "/marcas", titulo: "Marcas", descripcion: "Administra las marcas" },
          { href: "/reportes", titulo: "Reportes", descripcion: "Ventas, inventario y cotizaciones por período" },
          { href: "/configuracion", titulo: "Configuración", descripcion: "Tipo de cambio y parámetros del sistema" },
        ]
      : []),
    { href: "/ventas", titulo: "Ventas", descripcion: "Registra ventas con carrito y descuentos" },
    { href: "/cotizaciones", titulo: "Cotizaciones", descripcion: "Crea y gestiona cotizaciones a clientes" },
    { href: "/inventario", titulo: "Inventario", descripcion: "Controla stock, entradas, salidas y ajustes" },
    { href: "/catalogo", titulo: "Catálogo", descripcion: "Vista pública de tu catálogo" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Hola, {profile.nombre}</h1>
        <div className="mt-2 flex items-center gap-2">
          <span className="badge badge-lg badge-primary">{profile.rol ?? "Sin rol"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modulos.map((modulo) => (
          <Link
            key={modulo.href}
            href={modulo.href}
            className="card border border-base-300 bg-base-100 shadow-sm transition hover:shadow-md"
          >
            <div className="card-body">
              <h2 className="card-title text-lg">{modulo.titulo}</h2>
              <p className="text-sm text-base-content/70">{modulo.descripcion}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
