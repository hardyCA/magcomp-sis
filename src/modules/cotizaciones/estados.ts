export const ESTADOS_COTIZACION = [
  "PENDIENTE",
  "ACEPTADA",
  "RECHAZADA",
  "VENCIDA",
] as const;

export type EstadoCotizacion = (typeof ESTADOS_COTIZACION)[number];
