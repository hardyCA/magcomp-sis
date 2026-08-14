"use client";

export function BotonImprimir() {
  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      onClick={() => window.print()}
    >
      Imprimir
    </button>
  );
}