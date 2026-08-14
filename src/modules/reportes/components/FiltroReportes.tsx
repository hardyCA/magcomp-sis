"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function aFechaISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function FiltroReportes({
  desde,
  hasta,
}: {
  desde: string;
  hasta: string;
}) {
  const router = useRouter();
  const [desdeVal, setDesdeVal] = useState(desde);
  const [hastaVal, setHastaVal] = useState(hasta);

  const aplicar = (nDesde: string, nHasta: string) => {
    const params = new URLSearchParams();
    if (nDesde) params.set("desde", nDesde);
    if (nHasta) params.set("hasta", nHasta);
    router.replace(`/reportes?${params.toString()}`);
  };

  const hoy = new Date();
  const haceDias = (dias: number) => {
    const d = new Date();
    d.setDate(d.getDate() - (dias - 1));
    return d;
  };
  const mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const presets = [
    { label: "Hoy", desde: aFechaISO(hoy), hasta: aFechaISO(hoy) },
    { label: "7 días", desde: aFechaISO(haceDias(7)), hasta: aFechaISO(hoy) },
    { label: "30 días", desde: aFechaISO(haceDias(30)), hasta: aFechaISO(hoy) },
    { label: "Este mes", desde: aFechaISO(mes), hasta: aFechaISO(hoy) },
  ];

  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title text-base">Período del reporte</h2>

        <div className="flex flex-wrap items-end gap-2">
          <label className="form-control w-full sm:w-auto">
            <div className="label">
              <span className="label-text">Desde</span>
            </div>
            <input
              type="date"
              value={desdeVal}
              onChange={(e) => setDesdeVal(e.target.value)}
              className="input input-bordered input-sm w-full sm:w-44"
            />
          </label>

          <label className="form-control w-full sm:w-auto">
            <div className="label">
              <span className="label-text">Hasta</span>
            </div>
            <input
              type="date"
              value={hastaVal}
              onChange={(e) => setHastaVal(e.target.value)}
              className="input input-bordered input-sm w-full sm:w-44"
            />
          </label>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => aplicar(desdeVal, hastaVal)}
          >
            Aplicar
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => {
                setDesdeVal(preset.desde);
                setHastaVal(preset.hasta);
                aplicar(preset.desde, preset.hasta);
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}