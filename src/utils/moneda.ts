export const MONEDAS = ["BOB", "USD"] as const;

export type Moneda = (typeof MONEDAS)[number];

export function esMoneda(valor: unknown): valor is Moneda {
  return valor === "BOB" || valor === "USD";
}
