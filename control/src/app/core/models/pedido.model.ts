// ── MODELO ───────────────────────────────────
// Pedido de reposición a proveedores.

import { Producto } from './producto.model';

// Un renglón del pedido de reposición
export interface ItemPedido {
  producto: Producto;
  cantidad: number;
}

// Pedido ya registrado y enviado al proveedor
export interface PedidoRegistrado {
  id: string;
  fecha: string;          // ISO
  proveedor: string;
  observaciones: string;
  usuario: string;        // Quién lo armó
  items: { nombre: string; categoria: string; cantidad: number; costoEstimado: number }[];
  totalUnidades: number;
  totalEstimado: number;
}
