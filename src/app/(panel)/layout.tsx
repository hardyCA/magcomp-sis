import { redirect } from "next/navigation";
import { getProfile } from "@/lib/session";
import { getTipoCambioGlobal, getMonedaDisplay } from "@/lib/config";
import { Sidebar } from "@/modules/dashboard/components/Sidebar";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, tasa, monedaDisplay] = await Promise.all([
    getProfile(),
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
      tasa={tasa}
      monedaDisplay={monedaDisplay}
    >
      {children}
    </Sidebar>
  );
}