"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/modules/auth/actions";
import { CurrencySwitcher } from "@/modules/dashboard/components/CurrencySwitcher";
import { type Moneda } from "@/utils/moneda";

type NavLink = { href: string; label: string; modulo: string };
type Seccion = { titulo: string; links: NavLink[] };

const ICONOS: Record<string, string> = {
  dashboard:
    "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
  ventas:
    "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z",
  historial_ventas:
    "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z",
  cotizaciones:
    "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  inventario:
    "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m10 6v2.25m-3.75 0V13.5m8.634-4.584c.412.31.866.31 1.366.16l-2.78-9.105a1.5 1.5 0 00-1.432-1.005H8.474a1.5 1.5 0 00-1.434 1.003L4.25 7.582m13.384 0c-.34-.254-.74-.367-1.148-.375-.5.01-1.02.155-1.486.375m-7.5 0c-.339-.254-.74-.367-1.148-.375-.5.01-1.02.155-1.486.375",
  productos:
    "M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9",
  categorias:
    "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z",
  marcas:
    "M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z",
  clientes:
    "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  reportes:
    "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  usuarios:
    "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
  configuracion:
    "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
  catalogo:
    "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
};

const SECCIONES: Seccion[] = [
  {
    titulo: "Principal",
    links: [
      { href: "/dashboard", label: "Dashboard", modulo: "dashboard" },
      { href: "/catalogo", label: "Catálogo", modulo: "catalogo" },
    ],
  },
  {
    titulo: "Comercial",
    links: [
      { href: "/ventas", label: "Ventas", modulo: "ventas" },
      {
        href: "/ventas/historial",
        label: "Historial de ventas",
        modulo: "historial_ventas",
      },
      { href: "/cotizaciones", label: "Cotizaciones", modulo: "cotizaciones" },
      { href: "/clientes", label: "Clientes", modulo: "clientes" },
    ],
  },
  {
    titulo: "Inventario",
    links: [
      { href: "/inventario", label: "Inventario", modulo: "inventario" },
      { href: "/productos", label: "Productos", modulo: "productos" },
      { href: "/categorias", label: "Categorías", modulo: "categorias" },
      { href: "/marcas", label: "Marcas", modulo: "marcas" },
    ],
  },
  {
    titulo: "Administración",
    links: [
      { href: "/reportes", label: "Reportes", modulo: "reportes" },
      { href: "/usuarios", label: "Usuarios y roles", modulo: "usuarios" },
      {
        href: "/configuracion",
        label: "Configuración",
        modulo: "configuracion",
      },
    ],
  },
];

function Icono({ d }: { d: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export function Sidebar({
  nombre,
  rol,
  permisos,
  tasa,
  monedaDisplay,
  children,
}: {
  nombre: string;
  rol: string | null;
  permisos: string[];
  tasa: number;
  monedaDisplay: Moneda;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const secciones = SECCIONES.map((seccion) => ({
    ...seccion,
    links: seccion.links.filter((l) => permisos.includes(l.modulo)),
  })).filter((seccion) => seccion.links.length > 0);

  const isActive = (href: string) => {
    const coincide = (l: NavLink) =>
      pathname === l.href || pathname.startsWith(`${l.href}/`);
    const candidatos = secciones
      .flatMap((s) => s.links)
      .filter(coincide);
    const masEspecifico = candidatos.reduce<NavLink | null>(
      (mejor, l) =>
        !mejor || l.href.length > mejor.href.length ? l : mejor,
      null
    );
    return masEspecifico?.href === href;
  };

  const iniciales = nombre
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const rolBadge =
    rol === "ADMINISTRADOR"
      ? "badge-primary"
      : rol === "VENDEDOR"
        ? "badge-info"
        : "badge-ghost";

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
            <div className="navbar-center flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="MAG COMP"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
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
        <aside className="flex h-dvh w-72 flex-col border-r border-base-300 bg-base-100">
          <div className="flex items-center gap-3 border-b border-base-200 px-5 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-sm">
              <Image
                src="/logo.png"
                alt="Logo MAG COMP"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold leading-tight tracking-tight">
                MAG COMP
              </p>
              <p className="mt-0.5 text-xs text-base-content/50">
                Sistema comercial
              </p>
            </div>
          </div>

          <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-3">
            {secciones.map((seccion) => (
              <div key={seccion.titulo} className="mb-1">
                <p className="px-3 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wider text-base-content/40">
                  {seccion.titulo}
                </p>
                <ul className="space-y-0.5">
                  {seccion.links.map((link) => {
                    const activo = isActive(link.href);
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          aria-current={activo ? "page" : undefined}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            activo
                              ? "bg-primary text-primary-content shadow-sm"
                              : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                          }`}
                        >
                          <Icono d={ICONOS[link.modulo]} />
                          <span className="truncate">{link.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-t border-base-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {iniciales}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight">
                  {nombre}
                </p>
                <span className={`badge badge-sm ${rolBadge}`}>
                  {rol ?? "Usuario"}
                </span>
              </div>
              <div className="tooltip tooltip-left" data-tip="Cerrar sesión">
                <form action={logout}>
                  <button
                    type="submit"
                    aria-label="Cerrar sesión"
                    className="btn btn-ghost btn-square btn-sm text-base-content/60 transition-colors hover:bg-error/10 hover:text-error"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
            <div className="mt-3 border-t border-base-200 pt-3">
              <CurrencySwitcher tasa={tasa} moneda={monedaDisplay} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
