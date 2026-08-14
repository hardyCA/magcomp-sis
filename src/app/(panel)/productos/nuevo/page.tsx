import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getMonedaBase, getMonedaDisplay, getTipoCambioGlobal } from "@/lib/config";
import { ProductoForm } from "@/modules/productos/components/ProductoForm";

export default async function NuevoProductoPage() {
  await requireAdmin();

  const supabase = await createClient();
  const [{ data: categorias }, { data: marcas }, monedaBase, monedaDisplay, tasa] =
    await Promise.all([
      supabase.from("categorias").select("id, nombre").order("nombre"),
      supabase.from("marcas").select("id, nombre").order("nombre"),
      getMonedaBase(),
      getMonedaDisplay(),
      getTipoCambioGlobal(),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo producto</h1>
        <p className="mt-1 text-base-content/60">
          Crea un producto para tu catálogo e inventario.
        </p>
      </div>
      <ProductoForm
        categorias={categorias ?? []}
        marcas={marcas ?? []}
        monedaBase={monedaBase}
        monedaDisplay={monedaDisplay}
        tasa={tasa}
      />
    </div>
  );
}
