import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getMonedaBase } from "@/lib/config";
import { convertirPrecio } from "@/utils/format";
import { type Moneda } from "@/utils/moneda";
import { FiltroReportes } from "@/modules/reportes/components/FiltroReportes";
import { ReportesTabs, type ReportesDatos } from "@/modules/reportes/components/ReportesTabs";

type FechaISODate = { desde: string; hasta: string };

function parseFechas(
  sp: { desde?: string | string[]; hasta?: string | string[] }
): FechaISODate {
  const hoy = new Date();
  const aTexto = (f: Date) => {
    const m = String(f.getMonth() + 1).padStart(2, "0");
    const d = String(f.getDate()).padStart(2, "0");
    return `${f.getFullYear()}-${m}-${d}`;
  };
  const desdeRaw = Array.isArray(sp.desde) ? sp.desde[0] : sp.desde;
  const hastaRaw = Array.isArray(sp.hasta) ? sp.hasta[0] : sp.hasta;
  const desde = /^\d{4}-\d{2}-\d{2}$/.test(desdeRaw ?? "")
    ? desdeRaw!
    : aTexto(hoy);
  const hasta = /^\d{4}-\d{2}-\d{2}$/.test(hastaRaw ?? "")
    ? hastaRaw!
    : aTexto(hoy);
  if (hasta < desde) {
    return { desde: hasta, hasta: desde };
  }
  return { desde, hasta };
}

function inicioDia(texto: string): string {
  return new Date(`${texto}T00:00:00`).toISOString();
}

function finDia(texto: string): string {
  return new Date(`${texto}T23:59:59.999`).toISOString();
}

function aBase(
  monto: number,
  monedaVenta: Moneda,
  tipoCambio: number,
  monedaBase: Moneda
): number {
  return convertirPrecio(monto, monedaVenta, monedaBase, tipoCambio);
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string | string[]; hasta?: string | string[] }>;
}) {
  await requireAdmin();

  const sp = await searchParams;
  const { desde, hasta } = parseFechas(sp);
  const desdeISO = inicioDia(desde);
  const hastaISO = finDia(hasta);

  const supabase = await createClient();
  const monedaBase = await getMonedaBase();

  const [
    ventasRes,
    detalleRes,
    movimientosRes,
    cotizacionesRes,
    productosRes,
  ] = await Promise.all([
    supabase
      .from("ventas")
      .select("id, fecha, moneda, tipo_cambio, total")
      .gte("fecha", desdeISO)
      .lte("fecha", hastaISO),
    supabase
      .from("detalle_ventas")
      .select(
        "producto_id, cantidad, subtotal, ventas!inner(moneda, tipo_cambio), productos!inner(nombre)"
      )
      .gte("ventas.fecha", desdeISO)
      .lte("ventas.fecha", hastaISO),
    supabase
      .from("movimientos_inventario")
      .select(
        "tipo_movimiento, cantidad, productos(categoria_id, categorias(nombre))"
      )
      .gte("created_at", desdeISO)
      .lte("created_at", hastaISO),
    supabase
      .from("cotizaciones")
      .select("estado, moneda, tipo_cambio, total")
      .gte("fecha", desdeISO)
      .lte("fecha", hastaISO),
    supabase
      .from("productos")
      .select(
        "id, nombre, codigo_barras, imagen, stock, stock_minimo, precio_venta, moneda, activo, categorias(nombre)"
      )
      .eq("activo", true)
      .order("nombre"),
  ]);

  const ventas = ventasRes.data ?? [];
  const detalle = (detalleRes.data ?? []) as {
    producto_id: number;
    cantidad: number;
    subtotal: number;
    ventas: { moneda: Moneda; tipo_cambio: number };
    productos: { nombre: string };
  }[];

  const totalVendidoBase = ventas.reduce(
    (acc, v) => acc + aBase(v.total, v.moneda, v.tipo_cambio, monedaBase),
    0
  );
  const totalVentas = ventas.length;
  const ticketPromedio = totalVentas > 0 ? totalVendidoBase / totalVentas : 0;

  const porProducto = new Map<
    number,
    { nombre: string; cantidad: number; ingresos: number }
  >();
  for (const d of detalle) {
    const existe = porProducto.get(d.producto_id);
    const ingresos = aBase(
      d.subtotal,
      d.ventas.moneda,
      d.ventas.tipo_cambio,
      monedaBase
    );
    if (existe) {
      existe.cantidad += d.cantidad;
      existe.ingresos += ingresos;
    } else {
      porProducto.set(d.producto_id, {
        nombre: d.productos.nombre,
        cantidad: d.cantidad,
        ingresos,
      });
    }
  }
  const topProductos = [...porProducto.values()]
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);

  const productosActivos = (productosRes.data ?? []) as {
    id: number;
    nombre: string;
    codigo_barras: string | null;
    imagen: string | null;
    stock: number;
    stock_minimo: number;
    precio_venta: number;
    moneda: Moneda;
    activo: boolean;
    categorias: { nombre: string } | null;
  }[];
  const productosConCategoria = productosActivos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    codigo_barras: p.codigo_barras,
    imagen: p.imagen,
    stock: p.stock,
    stock_minimo: p.stock_minimo,
    precio_venta: p.precio_venta,
    moneda: p.moneda,
    categoria: p.categorias?.nombre ?? "Sin categoría",
  }));
  const porCategoria = new Map<string, typeof productosConCategoria>();
  for (const p of productosConCategoria) {
    const nombre = p.categoria;
    const grupo = porCategoria.get(nombre);
    if (grupo) {
      grupo.push(p);
    } else {
      porCategoria.set(nombre, [p]);
    }
  }
  const productosPorCategoria = [...porCategoria.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  const totalUnidadesStock = productosConCategoria.reduce(
    (acc, p) => acc + p.stock,
    0
  );
  const stockBajo = productosConCategoria.filter(
    (p) => p.stock <= p.stock_minimo
  );

  const movimientos = (movimientosRes.data ?? []) as {
    tipo_movimiento: "ENTRADA" | "SALIDA" | "AJUSTE" | "VENTA";
    cantidad: number;
    productos: {
      categoria_id: number | null;
      categorias: { nombre: string } | null;
    } | null;
  }[];

  const estadosCotizaciones: ReportesDatos["estadosCotizaciones"] = {
    PENDIENTE: 0,
    ACEPTADA: 0,
    RECHAZADA: 0,
    VENCIDA: 0,
  };
  const totalCotizacionesBase = (cotizacionesRes.data ?? []).reduce(
    (acc, c) => acc + aBase(c.total, c.moneda, c.tipo_cambio, monedaBase),
    0
  );
  for (const c of cotizacionesRes.data ?? []) {
    if (c.estado in estadosCotizaciones) {
      estadosCotizaciones[c.estado] += 1;
    }
  }

  const datos: ReportesDatos = {
    monedaBase,
    desde,
    hasta,
    totalVendidoBase,
    totalVentas,
    ticketPromedio,
    topProductos,
    stockBajo,
    productosPorCategoria,
    totalUnidadesStock,
    movimientos,
    totalCotizacionesBase,
    estadosCotizaciones,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reportes</h1>
        <p className="mt-1 text-base-content/60">
          Resumen del {desde} al {hasta} (valores en {monedaBase}).
        </p>
      </div>

      <FiltroReportes desde={desde} hasta={hasta} />

      <ReportesTabs datos={datos} />
    </div>
  );
}