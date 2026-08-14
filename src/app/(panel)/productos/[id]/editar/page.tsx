import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getMonedaBase, getMonedaDisplay, getTipoCambioGlobal } from "@/lib/config";
import { ProductoForm } from "@/modules/productos/components/ProductoForm";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const productoId = Number(id);

  if (!Number.isInteger(productoId)) {
    notFound();
  }

  const supabase = await createClient();
  const [{ data: producto }, { data: categorias }, { data: marcas }, monedaBase, monedaDisplay, tasa] =
    await Promise.all([
      supabase.from("productos").select("*").eq("id", productoId).maybeSingle(),
      supabase.from("categorias").select("id, nombre").order("nombre"),
      supabase.from("marcas").select("id, nombre").order("nombre"),
      getMonedaBase(),
      getMonedaDisplay(),
      getTipoCambioGlobal(),
    ]);

  if (!producto) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar producto</h1>
        <p className="mt-1 text-base-content/60">
          <Link href="/productos" className="link link-primary">
            Volver a productos
          </Link>
        </p>
      </div>
      <ProductoForm
        categorias={categorias ?? []}
        marcas={marcas ?? []}
        producto={producto}
        monedaBase={monedaBase}
        monedaDisplay={monedaDisplay}
        tasa={tasa}
      />
    </div>
  );
}
