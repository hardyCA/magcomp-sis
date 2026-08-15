import { requirePermiso } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getMonedaBase, getMonedaDisplay, getTipoCambioGlobal } from "@/lib/config";
import { type Moneda } from "@/utils/moneda";
import {
  VentaPOS,
  type ProductoVenta,
} from "@/modules/ventas/components/VentaPOS";

export default async function VentasPage() {
  await requirePermiso("ventas");

  const supabase = await createClient();

  const [{ data: productos }, { data: clientes }, tasa, monedaBase, monedaDisplay] =
    await Promise.all([
      supabase
        .from("productos")
        .select("id, nombre, codigo_barras, imagen, precio_venta, moneda, stock")
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("clientes")
        .select("id, nombre")
        .order("nombre"),
      getTipoCambioGlobal(),
      getMonedaBase(),
      getMonedaDisplay(),
    ]);

  const lista = (productos ?? []) as unknown as ProductoVenta[];
  const clientesLista = (clientes ?? []) as unknown as { id: number; nombre: string }[];
  const moneda = monedaDisplay as Moneda;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ventas</h1>
        <p className="mt-1 text-base-content/60">
          Busca un producto, agrega al carrito y registra la venta.
        </p>
      </div>

      <VentaPOS
        productos={lista}
        clientes={clientesLista}
        tasa={tasa}
        monedaBase={monedaBase}
        monedaDisplay={moneda}
      />
    </div>
  );
}