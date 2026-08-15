import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import {
  UsuariosManager,
  type UsuarioRow,
} from "@/modules/usuarios/components/UsuariosManager";
import { NuevoUsuarioForm } from "@/modules/usuarios/components/NuevoUsuarioForm";
import { PermisosMatriz } from "@/modules/usuarios/components/PermisosMatriz";

export default async function UsuariosPage() {
  const admin = await requireAdmin();

  const supabase = await createClient();

  const [{ data: roles }, { data: modulos }, { data: permisos }, { data: usuarios }] =
    await Promise.all([
      supabase.from("roles").select("id, nombre").order("nombre"),
      supabase.from("modulos").select("id, clave, nombre").order("orden"),
      supabase.from("rol_permisos").select("rol_id, modulo_id"),
      supabase.rpc("obtener_usuarios"),
    ]);

  const filas = (usuarios ?? []) as UsuarioRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuarios y roles</h1>
        <p className="mt-1 text-base-content/60">
          Crea usuarios, asigna roles y controla qué módulos ve cada rol.
        </p>
      </div>

      <NuevoUsuarioForm roles={roles ?? []} />

      <UsuariosManager
        usuarios={filas}
        roles={roles ?? []}
        usuarioActualId={admin.id}
      />

      <PermisosMatriz
        roles={roles ?? []}
        modulos={modulos ?? []}
        permisos={permisos ?? []}
      />
    </div>
  );
}