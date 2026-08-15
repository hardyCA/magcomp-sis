"use client";

import { useActionState } from "react";
import {
  anularVenta,
  type AnularVentaState,
} from "@/modules/ventas/actions";

export function BotonAnular({
  ventaId,
  numero,
}: {
  ventaId: number;
  numero: string;
}) {
  const [state, formAction, pending] = useActionState<AnularVentaState, FormData>(
    anularVenta,
    undefined
  );

  const modalId = `modal-anular-${ventaId}`;

  const cerrar = () => {
    (document.getElementById(modalId) as HTMLDialogElement | null)?.close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() =>
          (document.getElementById(modalId) as HTMLDialogElement | null)?.showModal()
        }
        className="btn btn-outline btn-error btn-sm"
      >
        Anular
      </button>

      <dialog id={modalId} className="modal">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Anular venta {numero}</h3>
          <p className="mt-2 text-sm text-base-content/60">
            El stock volverá a su valor anterior y los montos dejarán de
            contar en los reportes. La venta se mantendrá en el historial
            marcada como <strong>ANULADA</strong>. Esta acción no se puede
            deshacer.
          </p>

          <form action={formAction} className="mt-4 space-y-3">
            <input type="hidden" name="venta_id" value={ventaId} />

            <label className="form-control">
              <div className="label">
                <span className="label-text">Motivo de anulación (opcional)</span>
              </div>
              <textarea
                name="motivo"
                rows={3}
                placeholder="Ej.: venta errada, devolución, cliente no retiró el pedido"
                className="textarea textarea-bordered w-full"
              />
            </label>

            {state?.error ? (
              <div role="alert" className="alert alert-error py-2 text-sm">
                <span>{state.error}</span>
              </div>
            ) : null}

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={cerrar}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-error"
                disabled={pending}
              >
                {pending ? "Anulando..." : "Confirmar anulación"}
              </button>
            </div>
          </form>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button type="submit">Cerrar</button>
        </form>
      </dialog>
    </>
  );
}
