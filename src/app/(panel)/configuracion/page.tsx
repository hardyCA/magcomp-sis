import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getMonedaBase, getTipoCambioGlobal } from "@/lib/config";
import { formatMoneda } from "@/utils/format";
import { TipoCambioForm } from "@/modules/configuracion/components/TipoCambioForm";
import { MonedaBaseForm } from "@/modules/configuracion/components/MonedaBaseForm";

export default async function ConfiguracionPage() {
  await requireAdmin();

  const supabase = await createClient();
  const [{ data: tipoCambio }, monedaBase, tasa] = await Promise.all([
    supabase.from("tipo_cambio").select("valor").eq("id", 1).maybeSingle(),
    getMonedaBase(),
    getTipoCambioGlobal(),
  ]);

  const valor = tipoCambio?.valor ?? tasa;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="mt-1 text-base-content/60">
          Parámetros generales del sistema. Solo el administrador puede modificarlos.
        </p>
      </div>

      <MonedaBaseForm monedaBase={monedaBase} />
      <TipoCambioForm valor={valor} />

      <div className="card w-full max-w-xl bg-base-100 shadow">
        <div className="card-body">
          <h3 className="font-semibold">Referencia actual</h3>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-box border border-base-300 p-3">
              <p className="text-sm text-base-content/60">1 USD</p>
              <p className="text-xl font-bold">{formatMoneda(valor, "BOB")}</p>
            </div>
            <div className="rounded-box border border-base-300 p-3">
              <p className="text-sm text-base-content/60">1 Bs</p>
              <p className="text-xl font-bold">{formatMoneda(1 / valor, "USD")}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-base-content/60">
            Moneda base: <span className="font-semibold">{monedaBase}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
