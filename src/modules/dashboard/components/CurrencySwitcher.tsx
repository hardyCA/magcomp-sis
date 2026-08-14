"use client";

import { useRouter } from "next/navigation";
import { formatMoneda } from "@/utils/format";
import { type Moneda } from "@/utils/moneda";

export function CurrencySwitcher({
  tasa,
  moneda,
  compact = false,
}: {
  tasa: number;
  moneda: Moneda;
  compact?: boolean;
}) {
  const router = useRouter();

  const elegir = (m: Moneda) => {
    document.cookie = `moneda_display=${m};path=/;max-age=31536000;SameSite=Lax`;
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      {!compact ? (
        <span className="hidden text-xs text-base-content/60 md:inline">
          1 USD = {formatMoneda(tasa, "BOB")}
        </span>
      ) : null}
      <div className="join">
        <button
          type="button"
          onClick={() => elegir("BOB")}
          className={`btn btn-sm join-item ${moneda === "BOB" ? "btn-primary" : "btn-outline"}`}
        >
          Bs
        </button>
        <button
          type="button"
          onClick={() => elegir("USD")}
          className={`btn btn-sm join-item ${moneda === "USD" ? "btn-primary" : "btn-outline"}`}
        >
          USD
        </button>
      </div>
    </div>
  );
}
