import { NextRequest, NextResponse } from "next/server";
import { requirePermiso } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PRODUCTOS_POR_PAGINA } from "@/modules/ventas/constantes";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await requirePermiso("ventas");

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const paginaRaw = Number(sp.get("pagina"));
  const pagina = Number.isInteger(paginaRaw) && paginaRaw > 0 ? paginaRaw : 1;
  const desde = (pagina - 1) * PRODUCTOS_POR_PAGINA;

  const supabase = await createClient();

  let query = supabase
    .from("productos")
    .select("id, nombre, codigo_barras, imagen, precio_venta, moneda, stock", {
      count: "exact",
    })
    .eq("activo", true)
    .gt("stock", 0)
    .order("nombre")
    .range(desde, desde + PRODUCTOS_POR_PAGINA - 1);

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,codigo_barras.ilike.%${q}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[api/productos] error:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los productos." },
      { status: 500 }
    );
  }

  const total = count ?? 0;

  return NextResponse.json({
    productos: data ?? [],
    pagina,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / PRODUCTOS_POR_PAGINA)),
  });
}
