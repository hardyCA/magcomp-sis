"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  registrarMovimiento,
  type MovimientoState,
} from "@/modules/inventario/actions";
import { TIPOS_MOVIMIENTO } from "@/modules/inventario/constantes";

export type ProductoOpcion = { id: number; nombre: string; stock: number };

type Props = {
  productos: ProductoOpcion[];
  productoInicial?: ProductoOpcion;
  ocultarSelector?: boolean;
  usuarioActual?: string | null;
};

export function MovimientoForm({
  productos,
  productoInicial,
  ocultarSelector = false,
  usuarioActual,
}: Props) {
  const [state, formAction, pending] = useActionState<
    MovimientoState,
    FormData
  >(registrarMovimiento, undefined);

  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  const [productoId, setProductoId] = useState(
    productoInicial ? String(productoInicial.id) : ""
  );
  const [tipo, setTipo] = useState<string>("ENTRADA");

  const productoSeleccionado =
    productoInicial ??
    productos.find((p) => String(p.id) === productoId);
  const esAjuste = tipo === "AJUSTE";

  return (
    <form action={formAction} className="card w-full bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Registrar movimiento</h2>

        {ocultarSelector ? (
          <>
            <input
              type="hidden"
              name="producto_id"
              value={String(productoInicial?.id ?? "")}
            />
            <div className="flex flex-col gap-1 rounded-lg bg-base-200 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-base-content/70">Producto</span>
                <span className="font-medium">{productoInicial?.nombre}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-base-content/70">Stock actual</span>
                <span className="font-semibold">{productoInicial?.stock}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-base-content/70">Registrado por</span>
                <span className="font-semibold">{usuarioActual ?? "—"}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <label className="form-control">
              <div className="label">
                <span className="label-text">Producto</span>
              </div>
              <select
                name="producto_id"
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                className="select select-bordered w-full"
                required
              >
                <option value="">Selecciona un producto</option>
                {productos.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre} · stock {producto.stock}
                  </option>
                ))}
              </select>
            </label>

            {productoSeleccionado ? (
              <p className="text-sm text-base-content/60">
                Stock actual:{" "}
                <span className="font-semibold text-base-content">
                  {productoSeleccionado.stock}
                </span>
              </p>
            ) : null}
          </>
        )}

        <label className="form-control">
          <div className="label">
            <span className="label-text">Tipo de movimiento</span>
          </div>
          <select
            name="tipo_movimiento"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="select select-bordered w-full"
            required
          >
            {TIPOS_MOVIMIENTO.map((t) => (
              <option key={t} value={t}>
                {t === "ENTRADA"
                  ? "Entrada (compras, devoluciones)"
                  : t === "SALIDA"
                    ? "Salida (consumo, merma)"
                    : "Ajuste (conteo físico real)"}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control">
          <div className="label">
            <span className="label-text">
              {esAjuste
                ? "Stock real (valor al que queda el inventario)"
                : tipo === "ENTRADA"
                  ? "Cantidad a ingresar"
                  : "Cantidad a retirar"}
            </span>
          </div>
          <input
            type="number"
            name="cantidad"
            min={esAjuste ? 0 : 1}
            step="1"
            className="input input-bordered w-full"
            placeholder={esAjuste ? "Ej. 25" : "Ej. 5"}
            required
          />
        </label>

        <label className="form-control">
          <div className="label">
            <span className="label-text">Motivo (opcional)</span>
          </div>
          <input
            type="text"
            name="motivo"
            className="input input-bordered w-full"
            placeholder="Ej. reposición de stock, merma detectada"
          />
        </label>

        <button type="submit" className="btn btn-primary mt-2" disabled={pending}>
          {pending ? "Registrando..." : "Registrar movimiento"}
        </button>

        {state?.error ? (
          <div role="alert" className="alert alert-error mt-2 py-2 text-sm">
            <span>{state.error}</span>
          </div>
        ) : null}
        {state?.success ? (
          <div role="alert" className="alert alert-success mt-2 py-2 text-sm">
            <span>{state.success}</span>
          </div>
        ) : null}
      </div>
    </form>
  );
}
