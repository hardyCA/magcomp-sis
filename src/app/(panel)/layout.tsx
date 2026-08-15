import { redirect } from "next/navigation";
import { getProfile } from "@/lib/session";
import { obtenerPermisos } from "@/lib/permisos";
import { getTipoCambioGlobal, getMonedaDisplay } from "@/lib/config";
import { Sidebar } from "@/modules/dashboard/components/Sidebar";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, permisos, tasa, monedaDisplay] = await Promise.all([
    getProfile(),
    obtenerPermisos(),
    getTipoCambioGlobal(),
    getMonedaDisplay(),
  ]);

  if (!profile || !profile.activo) {
    redirect("/login?inactivo=1");
  }

  return (
    <Sidebar
      nombre={profile.nombre}
      rol={profile.rol}
      permisos={permisos}
      tasa={tasa}
      monedaDisplay={monedaDisplay}
    >
      {children}
    </Sidebar>
  );
}