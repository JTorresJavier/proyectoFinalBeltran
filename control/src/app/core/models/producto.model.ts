// ── MODELO ───────────────────────────────────
// Producto del catálogo tal como lo devuelve la API.

// ── INTERFACE ────────────────────────────────
// Define la forma de un Producto — contrato de datos
export interface Producto {
  _id?: string;        // ← MongoDB usa _id
  id?: string;         // ← compatibilidad
  nombre: string;      // Nombre del producto
  categoria: string;   // Categoría
  precio: number;      // Precio en ARS
  stock: number;       // Cantidad disponible
  descripcion: string; // Descripción breve
  icono: string;       // Ícono de Material Icons
  oferta: boolean;     // Si está en oferta
  descuento: number;   // Porcentaje de descuento
}
