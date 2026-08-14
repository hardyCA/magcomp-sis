import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { ClientesManager } from "@/modules/clientes/components/ClientesManager";
import { Paginador } from "@/components/Paginador";

const POR_PAGINA = 15;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string | string[]; error?: string }>;
}) {
  await requireAdmin();

  const sp = await searchParams;
  const paginaRaw = Array.isArray(sp.pagina) ? sp.pagina[0] ?? "1" : sp.pagina ?? "1";
  const pagina = Math.max(1, Math.floor(Number(paginaRaw)) || 1);

  const supabase = await createClient();

  const desde = (pagina - 1) * POR_PAGINA;
  const hasta = desde + POR_PAGINA - 1;

  const [{ data, count }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nombre", { count: "exact" })
      .order("nombre")
      .range(desde, hasta),
  ]);

  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clientes</h1>
        <p className="mt-1 text-base-content/60">
          Gestiona los clientes que se registran en las ventas.
        </p>
      </div>

      {sp.error === "enuso" ? (
        <div role="alert" className="alert alert-warning py-2 text-sm">
          <span>
            No se pudo eliminar: el cliente tiene ventas registradas.
          </span>
        </div>
      ) : null}

      <ClientesManager clientes={data ?? []} pagina={pagina} />

      <Paginador pagina={pagina} totalPaginas={totalPaginas} path="/clientes" />
    </div>
  );
}