import fs from "node:fs/promises";
import path from "node:path";
import {
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import sharp from "sharp";
import { requirePermiso } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { formatMoneda } from "@/utils/format";
import { type Moneda } from "@/utils/moneda";

export const dynamic = "force-dynamic";

const A4 = { width: 595.28, height: 841.89 };
const MARGEN = 40;
const GRIS = rgb(0.55, 0.55, 0.55);
const OSCURO = rgb(0.13, 0.13, 0.13);
const NEGRO = rgb(0, 0, 0);

type RawProducto = {
  id: number;
  nombre: string;
  codigo_barras: string | null;
  imagen: string | null;
  precio_venta: number;
  moneda: Moneda;
  categorias: { nombre: string } | null;
  marcas: { nombre: string } | null;
};

function truncar(
  texto: string,
  font: PDFFont,
  size: number,
  maxAncho: number
): string {
  if (font.widthOfTextAtSize(texto, size) <= maxAncho) {
    return texto;
  }
  let t = texto;
  while (t.length > 0 && font.widthOfTextAtSize(t + "…", size) > maxAncho) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

type ImagenProcesada = { data: Buffer; width: number; height: number };

async function procesarImagen(
  url: string
): Promise<ImagenProcesada | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    const img = sharp(bytes).rotate();
    const meta = await img.metadata();
    if (!meta.width || !meta.height) return null;
    const maxLado = 80;
    const escala = Math.min(1, maxLado / Math.max(meta.width, meta.height));
    const width = Math.max(1, Math.round(meta.width * escala));
    const height = Math.max(1, Math.round(meta.height * escala));
    const data = await img
      .resize(width, height)
      .jpeg({ quality: 80 })
      .toBuffer();
    return { data, width, height };
  } catch (error) {
    console.error("[catalogo-pdf] no se pudo procesar la imagen:", url, error);
    return null;
  }
}

export async function GET() {
  await requirePermiso("inventario");

  const supabase = await createClient();

  const [{ data: productos }, { data: negocio }] = await Promise.all([
    supabase
      .from("productos")
      .select(
        "id, nombre, codigo_barras, imagen, precio_venta, moneda, categorias(nombre), marcas(nombre)"
      )
      .eq("activo", true)
      .gt("stock", 0)
      .order("nombre"),
    supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", "nombre_negocio")
      .maybeSingle(),
  ]);

  const lista = (productos ?? []) as unknown as RawProducto[];
  const nombreNegocio = negocio?.valor ?? "MAG COMP";

  const porCategoria = new Map<string, RawProducto[]>();
  for (const p of lista) {
    const nombre = p.categorias?.nombre ?? "Sin categoría";
    const grupo = porCategoria.get(nombre);
    if (grupo) {
      grupo.push(p);
    } else {
      porCategoria.set(nombre, [p]);
    }
  }
  const agrupados = [...porCategoria.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  let logoBytes: Uint8Array | null = null;
  try {
    logoBytes = new Uint8Array(
      await fs.readFile(path.join(process.cwd(), "public", "logo.png"))
    );
  } catch {
    logoBytes = null;
  }

  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const logo =
    logoBytes && logoBytes.length > 8 ? await doc.embedPng(logoBytes) : null;

  const fecha = `Fecha: ${new Date().toLocaleDateString("es-BO")}`;
  const ancho = A4.width - 2 * MARGEN;
  const anchoProducto = 200;
  const anchoCodigo = 90;
  const anchoMarca = 90;
  const anchoPrecio = 80;

  let page: PDFPage = doc.addPage([A4.width, A4.height]);
  let y = A4.height - MARGEN;
  let nPagina = 1;

  const nuevaPagina = () => {
    page = doc.addPage([A4.width, A4.height]);
    nPagina += 1;
    y = A4.height - MARGEN;
    const cab = `${nombreNegocio} · Catálogo de productos`;
    page.drawText(cab, { x: MARGEN, y: y - 4, size: 8, font: regular, color: GRIS });
    page.drawText(`Página ${nPagina}`, {
      x: MARGEN + ancho - regular.widthOfTextAtSize(`Página ${nPagina}`, 8),
      y: y - 4,
      size: 8,
      font: regular,
      color: GRIS,
    });
    page.drawLine({
      start: { x: MARGEN, y: y - 10 },
      end: { x: MARGEN + ancho, y: y - 10 },
      thickness: 0.5,
      color: GRIS,
    });
    y = y - 22;
  };

  // ---- Encabezado de la primera página ----
  const tamLogo = 40;
  if (logo) {
    try {
      page.drawImage(logo, { x: MARGEN, y: y - tamLogo, width: tamLogo, height: tamLogo });
    } catch {
      page.drawText(nombreNegocio, {
        x: MARGEN,
        y: y - 12,
        size: 16,
        font: bold,
        color: NEGRO,
      });
    }
  }
  page.drawText(nombreNegocio, {
    x: MARGEN + (logo ? tamLogo + 10 : 0),
    y: y - 13,
    size: 17,
    font: bold,
    color: NEGRO,
  });
  page.drawText("Catálogo de productos", {
    x: MARGEN + (logo ? tamLogo + 10 : 0),
    y: y - 26,
    size: 9,
    font: regular,
    color: GRIS,
  });
  const anchoFecha = regular.widthOfTextAtSize(fecha, 9);
  page.drawText(fecha, {
    x: MARGEN + ancho - anchoFecha,
    y: y - 13,
    size: 9,
    font: regular,
    color: GRIS,
  });
  page.drawLine({
    start: { x: MARGEN, y: y - 38 },
    end: { x: MARGEN + ancho, y: y - 38 },
    thickness: 1,
    color: NEGRO,
  });
  y = y - 54;

  const altoFila = 34;

  const dibujarEncabezados = () => {
    page.drawText("Producto", { x: MARGEN + 40, y: y - 8, size: 8.5, font: bold, color: GRIS });
    page.drawText("Código", { x: MARGEN + anchoProducto, y: y - 8, size: 8.5, font: bold, color: GRIS });
    page.drawText("Marca", { x: MARGEN + anchoProducto + anchoCodigo, y: y - 8, size: 8.5, font: bold, color: GRIS });
    page.drawText("Precio", {
      x: MARGEN + anchoProducto + anchoCodigo + anchoMarca + anchoPrecio - regular.widthOfTextAtSize("Precio", 8.5),
      y: y - 8,
      size: 8.5,
      font: bold,
      color: GRIS,
    });
  };

  for (const [categoria, grupo] of agrupados) {
    // Espacio mínimo para dibujar el título de la categoría y al menos una fila.
    // Las categorías grandes se reparten entre páginas.
    if (y - (29 + 14 + altoFila) < MARGEN) {
      nuevaPagina();
    }

    page.drawText(categoria, { x: MARGEN, y: y - 11, size: 13, font: bold, color: OSCURO });
    page.drawLine({
      start: { x: MARGEN, y: y - 17 },
      end: { x: MARGEN + ancho, y: y - 17 },
      thickness: 0.6,
      color: NEGRO,
    });
    y = y - 29;

    dibujarEncabezados();
    y = y - 14;

    let filaIdx = 0;
    for (const p of grupo) {
      if (y - altoFila < MARGEN) {
        nuevaPagina();
        page.drawText(categoria, { x: MARGEN, y: y - 11, size: 13, font: bold, color: OSCURO });
        page.drawLine({
          start: { x: MARGEN, y: y - 17 },
          end: { x: MARGEN + ancho, y: y - 17 },
          thickness: 0.6,
          color: NEGRO,
        });
        y = y - 29;
        dibujarEncabezados();
        y = y - 14;
      }

      if (filaIdx % 2 === 1) {
        page.drawRectangle({
          x: MARGEN,
          y: y - altoFila,
          width: ancho,
          height: altoFila,
          color: rgb(0.95, 0.95, 0.95),
        });
      }
      filaIdx += 1;

      let imagen: ImagenProcesada | null = null;
      if (p.imagen) {
        imagen = await procesarImagen(p.imagen);
      }

      const tamMini = 28;
      if (imagen) {
        const proporcion = Math.min(
          tamMini / imagen.width,
          tamMini / imagen.height,
          1
        );
        const dispW = imagen.width * proporcion;
        const dispH = imagen.height * proporcion;
        page.drawImage(await doc.embedJpg(imagen.data), {
          x: MARGEN + 6 + (tamMini - dispW) / 2,
          y: y - tamMini - 3 + (tamMini - dispH) / 2,
          width: dispW,
          height: dispH,
        });
      } else {
        page.drawRectangle({
          x: MARGEN + 6,
          y: y - tamMini - 3,
          width: tamMini,
          height: tamMini,
          color: rgb(0.9, 0.9, 0.9),
        });
      }

      page.drawText(truncar(p.nombre, regular, 9, anchoProducto - 50), {
        x: MARGEN + 40,
        y: y - 17,
        size: 9,
        font: regular,
        color: OSCURO,
      });
      page.drawText(truncar(p.codigo_barras ?? "—", regular, 8.5, anchoCodigo - 8), {
        x: MARGEN + anchoProducto,
        y: y - 17,
        size: 8.5,
        font: regular,
        color: OSCURO,
      });
      page.drawText(truncar(p.marcas?.nombre ?? "—", regular, 8.5, anchoMarca - 8), {
        x: MARGEN + anchoProducto + anchoCodigo,
        y: y - 17,
        size: 8.5,
        font: regular,
        color: OSCURO,
      });
      const precio = formatMoneda(p.precio_venta, p.moneda);
      page.drawText(precio, {
        x:
          MARGEN +
          anchoProducto +
          anchoCodigo +
          anchoMarca +
          anchoPrecio -
          regular.widthOfTextAtSize(precio, 9),
        y: y - 17,
        size: 9,
        font: bold,
        color: NEGRO,
      });

      y = y - altoFila;
    }

    y = y - 8;
  }

  const pdfBytes = await doc.save();
  return new Response(new Uint8Array(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="catalogo-mag-comp.pdf"',
    },
  });
}
