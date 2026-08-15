"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import {
  getMonedaBase,
  getMonedaDisplay,
  getTipoCambioGlobal,
} from "@/lib/config";
import { convertirPrecio } from "@/utils/format";
import { type Moneda } from "@/utils/moneda";

export type ProductoState = { error?: string } | undefined;

const MAX_IMAGEN_BYTES = 2 * 1024 * 1024;
const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function validar(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const codigo_barras = String(formData.get("codigo_barras") ?? "").trim() || null;
  const categoriaRaw = formData.get("categoria_id");
  const marcaRaw = formData.get("marca_id");
  const precioEntrada = Number(formData.get("precio_venta"));
  const stock = Number(formData.get("stock"));
  const stock_minimo = Number(formData.get("stock_minimo"));

  if (!nombre) return { error: "Ingresa el nombre del producto." };
  if (!Number.isFinite(precioEntrada) || precioEntrada < 0) {
    return { error: "El precio de venta no es válido." };
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return { error: "El stock no es válido." };
  }
  if (!Number.isInteger(stock_minimo) || stock_minimo < 0) {
    return { error: "El stock mínimo no es válido." };
  }

  return {
    data: {
      nombre,
      codigo_barras,
      categoria_id: categoriaRaw ? Number(categoriaRaw) : null,
      marca_id: marcaRaw ? Number(marcaRaw) : null,
      precioEntrada,
      stock,
      stock_minimo,
    },
  };
}

async function precioEnBase(precioEntrada: number): Promise<number> {
  const [monedaDisplay, monedaBase, tasa] = await Promise.all([
    getMonedaDisplay(),
    getMonedaBase(),
    getTipoCambioGlobal(),
  ]);
  return convertirPrecio(precioEntrada, monedaDisplay, monedaBase, tasa);
}

async function monedaBaseActual(): Promise<Moneda> {
  return getMonedaBase();
}

async function subirImagen(
  supabase: SupabaseClient,
  formData: FormData,
  quitarImagen: boolean
): Promise<{ imagen: string | null; error?: string }> {
  const archivo = formData.get("imagen_file");

  const esArchivo =
    typeof archivo === "object" &&
    archivo !== null &&
    "size" in archivo &&
    "name" in archivo &&
    "type" in archivo &&
    (archivo as { size: number }).size > 0;

  if (esArchivo) {
    const { name, type, size } = archivo as {
      name: string;
      type: string;
      size: number;
    };

    if (!TIPOS_IMAGEN.includes(type)) {
      return {
        imagen: null,
        error: "El archivo debe ser una imagen (JPG, PNG, WEBP o GIF).",
      };
    }
    if (size > MAX_IMAGEN_BYTES) {
      return { imagen: null, error: "La imagen no puede superar los 2 MB." };
    }

    const extension = (name.split(".").pop() ?? "jpg").toLowerCase();
    const ruta = `${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("productos")
      .upload(ruta, archivo as File, { upsert: false, contentType: type });

    if (uploadError) {
      console.error("Error subiendo imagen:", uploadError);
      return {
        imagen: null,
        error: "No se pudo subir la imagen. Intenta de nuevo.",
      };
    }

    const { data } = supabase.storage.from("productos").getPublicUrl(ruta);
    return { imagen: data.publicUrl };
  }

  if (quitarImagen) {
    return { imagen: null };
  }

  const urlTexto = String(formData.get("imagen") ?? "").trim();
  return { imagen: urlTexto || null };
}

function rutaDesdeUrl(url: string): string | null {
  const prefijo = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/productos/`;
  return url.startsWith(prefijo) ? url.slice(prefijo.length) : null;
}

export async function crearProducto(
  _prevState: ProductoState,
  formData: FormData
): Promise<ProductoState> {
  await requireAdmin();
  const resultado = validar(formData);

  if ("error" in resultado) {
    return { error: resultado.error };
  }

  const supabase = await createClient();
  const { imagen, error: errorImagen } = await subirImagen(
    supabase,
    formData,
    false
  );
  if (errorImagen) {
    return { error: errorImagen };
  }

  const [precioBase, monedaBase] = await Promise.all([
    precioEnBase(resultado.data.precioEntrada),
    monedaBaseActual(),
  ]);

  const { error } = await supabase.from("productos").insert({
    nombre: resultado.data.nombre,
    codigo_barras: resultado.data.codigo_barras,
    categoria_id: resultado.data.categoria_id,
    marca_id: resultado.data.marca_id,
    precio_venta: precioBase,
    moneda: monedaBase,
    stock: resultado.data.stock,
    stock_minimo: resultado.data.stock_minimo,
    imagen,
  });

  if (error) {
    return { error: "No se pudo crear el producto. Intenta de nuevo." };
  }

  revalidatePath("/productos");
  redirect("/productos");
}

export async function actualizarProducto(
  _prevState: ProductoState,
  formData: FormData
): Promise<ProductoState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const resultado = validar(formData);

  if (!id) {
    return { error: "Producto no válido." };
  }

  if ("error" in resultado) {
    return { error: resultado.error };
  }

  const supabase = await createClient();
  const quitarImagen = formData.get("quitar_imagen") === "1";
  const { imagen, error: errorImagen } = await subirImagen(
    supabase,
    formData,
    quitarImagen
  );
  if (errorImagen) {
    return { error: errorImagen };
  }

  const [precioBase, monedaBase] = await Promise.all([
    precioEnBase(resultado.data.precioEntrada),
    monedaBaseActual(),
  ]);

  const { data: actual } = await supabase
    .from("productos")
    .select("imagen")
    .eq("id", id)
    .single();
  const imagenAnterior = actual?.imagen ?? null;

  let imagenFinal = imagen;
  if (imagenFinal === null && !quitarImagen) {
    imagenFinal = imagenAnterior;
  }

  if (imagenAnterior && imagenAnterior !== imagenFinal) {
    const rutaAnterior = rutaDesdeUrl(imagenAnterior);
    if (rutaAnterior) {
      const { error: removeError } = await supabase.storage
        .from("productos")
        .remove([rutaAnterior]);
      if (removeError) {
        console.error("Error eliminando imagen anterior:", removeError);
      }
    }
  }

  const { error } = await supabase
    .from("productos")
    .update({
      nombre: resultado.data.nombre,
      codigo_barras: resultado.data.codigo_barras,
      categoria_id: resultado.data.categoria_id,
      marca_id: resultado.data.marca_id,
      precio_venta: precioBase,
      moneda: monedaBase,
      stock_minimo: resultado.data.stock_minimo,
      imagen: imagenFinal,
    })
    .eq("id", id);

  if (error) {
    return { error: "No se pudo actualizar el producto. Intenta de nuevo." };
  }

  revalidatePath("/productos");
  redirect("/productos");
}

export async function toggleProducto(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const activo = formData.get("activo") === "1";

  if (!id) return;

  const supabase = await createClient();
  await supabase.from("productos").update({ activo: !activo }).eq("id", id);

  revalidatePath("/productos");
}