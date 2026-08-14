import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { MarcasManager } from "@/modules/marcas/components/MarcasManager";

export default async function MarcasPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data } = await supabase
    .from("marcas")
    .select("id, nombre")
    .order("nombre");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marcas</h1>
        <p className="mt-1 text-base-content/60">
          Administra las marcas que se muestran en el catálogo.
        </p>
      </div>
      <MarcasManager marcas={data ?? []} />
    </div>
  );
}
