import { requirePermiso } from "@/lib/session";
import { VentasLista } from "@/modules/ventas/components/VentasLista";

export default async function VentasHistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string | string[] }>;
}) {
  await requirePermiso("historial_ventas");

  const sp = await searchParams;
  const paginaRaw = Array.isArray(sp.pagina) ? sp.pagina[0] ?? "1" : sp.pagina ?? "1";
  const pagina = Math.max(1, Math.floor(Number(paginaRaw)) || 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Historial de ventas</h1>
        <p className="mt-1 text-base-content/60">
          Consulta las ventas registradas y sus boletas.
        </p>
      </div>

      <VentasLista pagina={pagina} />
    </div>
  );
}