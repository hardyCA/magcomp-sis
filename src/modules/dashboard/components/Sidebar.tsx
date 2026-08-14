"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/modules/auth/actions";
import { CurrencySwitcher } from "@/modules/dashboard/components/CurrencySwitcher";
import { type Moneda } from "@/utils/moneda";

type NavLink = { href: string; label: string };

export function Sidebar({
  nombre,
  rol,
  tasa,
  monedaDisplay,
  children,
}: {
  nombre: string;
  rol: string | null;
  tasa: number;
  monedaDisplay: Moneda;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const esAdmin = rol === "ADMINISTRADOR";

  const links: NavLink[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/ventas", label: "Ventas" },
    { href: "/ventas/historial", label: "Historial de ventas" },
    { href: "/cotizaciones", label: "Cotizaciones" },
    { href: "/inventario", label: "Inventario" },
    ...(esAdmin
      ? [
          { href: "/productos", label: "Productos" },
          { href: "/categorias", label: "Categorías" },
          { href: "/marcas", label: "Marcas" },
          { href: "/clientes", label: "Clientes" },
          { href: "/reportes", label: "Reportes" },
          { href: "/configuracion", label: "Configuración" },
        ]
      : []),
    { href: "/catalogo", label: "Catálogo" },
  ];

  const isActive = (href: string) => {
    const coincide = (l: NavLink) =>
      pathname === l.href || pathname.startsWith(`${l.href}/`);
    const candidatos = links.filter(coincide);
    const masEspecifico = candidatos.reduce<NavLink | null>(
      (mejor, l) =>
        !mejor || l.href.length > mejor.href.length ? l : mejor,
      null
    );
    return masEspecifico?.href === href;
  };

  return (
    <div className="drawer lg:drawer-open">
      <input id="sidebar-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex min-h-full flex-col">
        <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100 lg:hidden">
          <div className="navbar w-full px-4">
            <div className="navbar-start">
              <label
                htmlFor="sidebar-drawer"
                aria-label="Abrir menú"
                className="btn btn-ghost btn-square"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </label>
            </div>
            <div className="navbar-center">
              <Link href="/dashboard" className="text-lg font-bold tracking-tight">
                MAG COMP
              </Link>
            </div>
            <div className="navbar-end">
              <CurrencySwitcher tasa={tasa} moneda={monedaDisplay} compact />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
      </div>

      <div className="drawer-side">
        <label htmlFor="sidebar-drawer" aria-label="Cerrar menú" className="drawer-overlay"></label>
        <aside className="flex min-h-full w-72 flex-col border-r border-base-300 bg-base-100 p-4">
          <div className="px-2 pb-4">
            <Link href="/dashboard" className="text-xl font-bold tracking-tight">
              MAG COMP
            </Link>
            <p className="mt-1 text-xs text-base-content/50">
              Sistema comercial
            </p>
          </div>

          <nav className="flex-1">
            <ul className="menu gap-1 p-0">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={isActive(link.href) ? "active" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-4 space-y-3 border-t border-base-200 pt-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-tight">
                  {nombre}
                </p>
                <p className="text-xs text-base-content/60">
                  {esAdmin ? "Administrador" : rol ?? "Usuario"}
                </p>
              </div>
              <form action={logout}>
                <button type="submit" className="btn btn-outline btn-sm btn-error">
                  Salir
                </button>
              </form>
            </div>
            <CurrencySwitcher tasa={tasa} moneda={monedaDisplay} />
          </div>
        </aside>
      </div>
    </div>
  );
}