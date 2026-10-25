// ── MODELO ───────────────────────────────────
// Ingreso de mercadería de un proveedor.

// ── INTERFACE ────────────────────────────────
// Define la forma de una Recepción — contrato de datos
export interface Recepcion {
  _id?: string;           // MongoDB asigna este id
  producto: string;        // _id del producto al que se le suma stock
  productoNombre: string;  // Nombre del producto (para mostrar sin buscar)
  cantidad: number;        // Cantidad recibida
  proveedor: string;       // Quién trajo la mercadería
  observaciones: string;   // Notas opcionales
  usuario: string;         // Quién registró la recepción
  createdAt?: string;      // Fecha de recepción (la pone MongoDB automático)
}
