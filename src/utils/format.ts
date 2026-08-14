export function formatMoneda(valor: number, moneda: "BOB" | "USD"): string {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

export function convertirPrecio(
  precio: number,
  monedaOrigen: "BOB" | "USD",
  monedaDestino: "BOB" | "USD",
  tasa: number
): number {
  if (monedaOrigen === monedaDestino) {
    return precio;
  }
  if (monedaOrigen === "BOB") {
    return precio / tasa;
  }
  return precio * tasa;
}
