// ── MODELO ───────────────────────────────────
// Cotización del dólar (DolarAPI).

// ── INTERFACE ────────────────────────────────
// Define la forma de una cotización según DolarAPI
export interface Cotizacion {
  compra: number;              // Precio de compra
  venta: number;                // Precio de venta
  casa: string;                  // Identificador ('oficial', 'blue', etc.)
  nombre: string;                // Nombre legible ('Oficial', 'Blue', etc.)
  moneda: string;                // Moneda de referencia ('USD')
  fechaActualizacion: string;    // Última actualización
}
