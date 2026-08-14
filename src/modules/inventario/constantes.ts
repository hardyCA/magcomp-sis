export const TIPOS_MOVIMIENTO = ["ENTRADA", "SALIDA", "AJUSTE"] as const;
export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number];
