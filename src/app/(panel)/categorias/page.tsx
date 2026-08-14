import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { CategoriasManager } from "@/modules/categorias/components/CategoriasManager";

export default async function CategoriasPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data } = await supabase
    .from("categorias")
    .select("id, nombre")
    .order("nombre");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Categorías</h1>
        <p className="mt-1 text-base-content/60">
          Organiza tus productos por categorías para el catálogo.
        </p>
      </div>
      <CategoriasManager categorias={data ?? []} />
    </div>
  );
}
