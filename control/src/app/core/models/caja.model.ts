// ── MODELO ───────────────────────────────────
// Ventas, estado de caja y turnos (se guardan en LocalStorage).

// Define una venta completa registrada en caja
export interface Venta {
  id: string;            // ID único de la venta
  fecha: string;         // Fecha y hora de la venta
  cajero: string;        // Nombre del cajero
  items: ItemVenta[];    // Productos vendidos
  total: number;         // Total real de la venta
  totalCobrado: number;  // Total redondeado que se cobró
  diferencia: number;    // Diferencia (totalCobrado - total)
  metodoPago: string;    // Método de pago usado
}

// Define un item dentro de una venta
export interface ItemVenta {
  nombre: string;   // Nombre del producto
  cantidad: number; // Cantidad vendida
  precio: number;   // Precio unitario
  subtotal: number; // precio * cantidad
}

// Define el estado de la caja del día
export interface EstadoCaja {
  abierta: boolean;       // Si la caja está abierta
  montoInicial: number;   // Monto con el que se abrió
  fechaApertura: string;  // Fecha y hora de apertura
  cajero: string;         // Cajero que abrió la caja
}

// ── INTERFACE: REGISTRO DE TURNO ──────────────
// Guarda quién abrió y cerró la caja y cuándo
export interface RegistroTurno {
  cajero: string;          // Nombre del cajero
  fechaApertura: string;   // Cuándo abrió la caja
  fechaCierre: string;     // Cuándo cerró la caja
  totalVendido: number;    // Total vendido en el turno
  cantidadVentas: number;  // Cantidad de ventas del turno
}
