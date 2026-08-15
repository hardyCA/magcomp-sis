import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import {
  UsuariosManager,
  type UsuarioRow,
} from "@/modules/usuarios/components/UsuariosManager";

export default async function UsuariosPage() {
  const admin = await requireAdmin();

  const supabase = await createClient();

  const [{ data: roles }, { data: usuarios }] = await Promise.all([
    supabase.from("roles").select("id, nombre").order("nombre"),
    supabase.rpc("obtener_usuarios"),
  ]);

  const filas = (usuarios ?? []) as UsuarioRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuarios y roles</h1>
        <p className="mt-1 text-base-content/60">
          Administra los usuarios del sistema: asigna roles y controla el
          acceso.
        </p>
      </div>

      <UsuariosManager
        usuarios={filas}
        roles={roles ?? []}
        usuarioActualId={admin.id}
      />
    </div>
  );
}