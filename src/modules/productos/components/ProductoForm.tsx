"use client";

import { useActionState, useState } from "react";
import {
  crearProducto,
  actualizarProducto,
  type ProductoState,
} from "@/modules/productos/actions";
import { convertirPrecio } from "@/utils/format";
import { type Moneda } from "@/utils/moneda";

export type ProductoFormData = {
  id?: number;
  nombre: string;
  codigo_barras: string | null;
  categoria_id: number | null;
  marca_id: number | null;
  precio_venta: number;
  moneda: Moneda;
  stock: number;
  stock_minimo: number;
  imagen: string | null;
};

export function ProductoForm({
  categorias,
  marcas,
  producto,
  monedaBase,
  monedaDisplay,
  tasa,
}: {
  categorias: { id: number; nombre: string }[];
  marcas: { id: number; nombre: string }[];
  producto?: ProductoFormData;
  monedaBase: Moneda;
  monedaDisplay: Moneda;
  tasa: number;
}) {
  const action = producto ? actualizarProducto : crearProducto;
  const [state, formAction, pending] = useActionState<ProductoState, FormData>(
    action,
    undefined
  );

  const [preview, setPreview] = useState<string | null>(
    producto?.imagen ?? null
  );
  const [archivoNombre, setArchivoNombre] = useState<string | null>(null);
  const [quitar, setQuitar] = useState(false);

  const precioInicial = producto
    ? convertirPrecio(producto.precio_venta, producto.moneda, monedaDisplay, tasa)
    : "";

  function seleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setArchivoNombre(file?.name ?? null);
    if (file) {
      setQuitar(false);
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(quitar ? null : producto?.imagen ?? null);
    }
  }

  return (
    <form
      action={formAction}
      className="mx-auto max-w-4xl space-y-6"
    >
      {producto ? (
        <input type="hidden" name="id" value={producto.id} />
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title text-lg">Información general</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="form-control sm:col-span-2">
                  <div className="label">
                    <span className="label-text">Nombre *</span>
                  </div>
                  <input
                    type="text"
                    name="nombre"
                    defaultValue={producto?.nombre}
                    className="input input-bordered w-full"
                    placeholder="Ej. Monitor LG 24 pulgadas"
                    required
                  />
                </label>

                <label className="form-control">
                  <div className="label">
                    <span className="label-text">Código de barras</span>
                  </div>
                  <input
                    type="text"
                    name="codigo_barras"
                    defaultValue={producto?.codigo_barras ?? ""}
                    className="input input-bordered w-full"
                    placeholder="Ej. 7801234567890"
                  />
                </label>

                <label className="form-control">
                  <div className="label">
                    <span className="label-text">Categoría</span>
                  </div>
                  <select
                    name="categoria_id"
                    defaultValue={producto?.categoria_id ?? ""}
                    className="select select-bordered w-full"
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-control sm:col-span-2">
                  <div className="label">
                    <span className="label-text">Marca</span>
                  </div>
                  <select
                    name="marca_id"
                    defaultValue={producto?.marca_id ?? ""}
                    className="select select-bordered w-full"
                  >
                    <option value="">Sin marca</option>
                    {marcas.map((marca) => (
                      <option key={marca.id} value={marca.id}>
                        {marca.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </section>

          <section className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title text-lg">Precio y stock</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="form-control sm:col-span-2">
                  <div className="label">
                    <span className="label-text">
                      Precio de venta (en {monedaDisplay}) *
                    </span>
                  </div>
                  <input
                    type="number"
                    name="precio_venta"
                    defaultValue={precioInicial}
                    min={0}
                    step="0.01"
                    className="input input-bordered w-full"
                    placeholder="0.00"
                    required
                  />
                  <div className="label">
                    <span className="label-text-alt text-base-content/60">
                      Se guarda en {monedaBase} · 1 USD = {tasa} Bs
                    </span>
                  </div>
                </label>

                {producto ? (
                  <div className="form-control sm:col-span-2">
                    <div className="label">
                      <span className="label-text">Stock actual</span>
                    </div>
                    <input
                      type="text"
                      value={`${producto.stock} unidades`}
                      className="input input-bordered w-full"
                      readOnly
                    />
                    <div className="label">
                      <span className="label-text-alt text-base-content/60">
                        El stock se gestiona desde el módulo de inventario.
                      </span>
                    </div>
                  </div>
                ) : (
                  <label className="form-control">
                    <div className="label">
                      <span className="label-text">Stock inicial</span>
                    </div>
                    <input
                      type="number"
                      name="stock"
                      defaultValue="0"
                      min={0}
                      step="1"
                      className="input input-bordered w-full"
                    />
                  </label>
                )}

                <label className="form-control">
                  <div className="label">
                    <span className="label-text">Stock mínimo</span>
                  </div>
                  <input
                    type="number"
                    name="stock_minimo"
                    defaultValue={producto?.stock_minimo ?? 0}
                    min={0}
                    step="1"
                    className="input input-bordered w-full"
                  />
                  <div className="label">
                    <span className="label-text-alt text-base-content/60">
                      Recibirás alerta cuando el stock llegue a este valor.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </section>
        </div>

        <section className="card h-fit bg-base-100 shadow lg:sticky lg:top-4">
          <div className="card-body">
            <h2 className="card-title text-lg">Imagen</h2>
            <div className="aspect-square overflow-hidden rounded-box border border-base-300 bg-base-200">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Vista previa del producto"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-base-content/40">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                  <span className="text-xs font-medium">Sin imagen</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {producto?.imagen ? (
                <label className="label flex cursor-pointer justify-between gap-2">
                  <span className="label-text text-sm">Quitar imagen</span>
                  <input
                    type="checkbox"
                    name="quitar_imagen"
                    value="1"
                    checked={quitar}
                    onChange={(e) => {
                      setQuitar(e.target.checked);
                      if (e.target.checked) setPreview(null);
                    }}
                    className="checkbox checkbox-sm"
                  />
                </label>
              ) : null}

              <input
                type="file"
                name="imagen_file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={seleccionarArchivo}
                className="file-input file-input-bordered file-input-sm w-full"
              />
              {archivoNombre ? (
                <p className="truncate text-sm text-success">
                  {archivoNombre}
                </p>
              ) : (
                <p className="text-xs text-base-content/60">
                  JPG, PNG, WEBP o GIF · máximo 2 MB
                </p>
              )}

              <div className="divider">o</div>

              <label className="form-control">
                <div className="label">
                  <span className="label-text">Pegar URL (opcional)</span>
                </div>
                <input
                  type="url"
                  name="imagen"
                  defaultValue={producto?.imagen ?? ""}
                  className="input input-bordered w-full"
                  placeholder="https://..."
                />
                <div className="label">
                  <span className="label-text-alt text-base-content/60">
                    El archivo tiene prioridad sobre la URL.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </section>
      </div>

      {state?.error ? (
        <div role="alert" className="alert alert-error py-2 text-sm">
          <span>{state.error}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2 border-t border-base-300 pt-4">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => window.history.back()}
        >
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending
            ? "Guardando..."
            : producto
              ? "Guardar cambios"
              : "Crear producto"}
        </button>
      </div>
    </form>
  );
}