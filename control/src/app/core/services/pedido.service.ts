import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { Producto } from './productos.service';

// ── INTERFACES ────────────────────────────────

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

const CLAVE_PEDIDO    = 'pm_pedido_actual';
const CLAVE_HISTORIAL = 'pm_pedidos_registrados';
const MAX_POR_ITEM    = 999;

// ── SERVICIO ──────────────────────────────────
// Arma el pedido de reposición a proveedores.
// Los productos se agregan desde la consulta de precios
// (sin tope de stock: se pide justamente lo que falta).
// El pedido en curso y el historial se guardan en LocalStorage.
@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  private items$ = new BehaviorSubject<ItemPedido[]>(this.leer<ItemPedido[]>(CLAVE_PEDIDO, []));

  // Observable público del pedido en curso
  pedido$ = this.items$.asObservable();

  // Total de unidades (para el badge del header)
  cantidadTotal$ = this.items$.pipe(
    map(items => items.reduce((acc, item) => acc + item.cantidad, 0))
  );

  // Costo estimado a precio de lista
  totalEstimado$ = this.items$.pipe(
    map(items => items.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0))
  );

  // Cantidad de productos distintos
  lineas$ = this.items$.pipe(
    map(items => items.length)
  );

  // Identificador estable de un producto (MongoDB usa _id)
  idDe(producto: Producto): string {
    return producto._id ?? producto.id ?? producto.nombre;
  }

  // Cantidad que ya está pedida de un producto (0 si no está)
  cantidadDe(producto: Producto): number {
    const id = this.idDe(producto);
    return this.items$.value.find(i => this.idDe(i.producto) === id)?.cantidad ?? 0;
  }

  agregar(producto: Producto, cantidad = 1): void {
    const items = this.items$.value;
    const id = this.idDe(producto);
    const idx = items.findIndex(i => this.idDe(i.producto) === id);

    if (idx >= 0) {
      const nuevos = [...items];
      nuevos[idx] = { ...items[idx], cantidad: Math.min(items[idx].cantidad + cantidad, MAX_POR_ITEM) };
      this.guardar(nuevos);
    } else {
      this.guardar([...items, { producto, cantidad: Math.min(cantidad, MAX_POR_ITEM) }]);
    }
  }

  quitar(productoId: string): void {
    this.guardar(this.items$.value.filter(i => this.idDe(i.producto) !== productoId));
  }

  cambiarCantidad(productoId: string, cantidad: number): void {
    const items = this.items$.value;
    const idx = items.findIndex(i => this.idDe(i.producto) === productoId);
    if (idx < 0) return;

    if (cantidad <= 0) {
      this.quitar(productoId);
      return;
    }

    const nuevos = [...items];
    nuevos[idx] = { ...items[idx], cantidad: Math.min(cantidad, MAX_POR_ITEM) };
    this.guardar(nuevos);
  }

  vaciar(): void {
    this.guardar([]);
  }

  // ── REGISTRAR PEDIDO ──────────────────────
  // Pasa el pedido en curso al historial y lo vacía.
  // Si el historial no se puede guardar, lanza un error
  // y el pedido en curso queda intacto para no perderlo.
  registrar(proveedor: string, observaciones: string, usuario: string): PedidoRegistrado | null {
    const items = this.items$.value;
    if (items.length === 0) return null;

    const pedido: PedidoRegistrado = {
      id: Date.now().toString(36),
      fecha: new Date().toISOString(),
      proveedor: proveedor.trim(),
      observaciones: observaciones.trim(),
      usuario,
      items: items.map(i => ({
        nombre: i.producto.nombre,
        categoria: i.producto.categoria,
        cantidad: i.cantidad,
        costoEstimado: i.producto.precio * i.cantidad,
      })),
      totalUnidades: items.reduce((a, i) => a + i.cantidad, 0),
      totalEstimado: items.reduce((a, i) => a + i.producto.precio * i.cantidad, 0),
    };

    if (!this.escribir(CLAVE_HISTORIAL, [pedido, ...this.historial()])) {
      throw new Error('No se pudo guardar el pedido en este navegador');
    }
    this.vaciar();
    return pedido;
  }

  // Pedidos registrados, más recientes primero
  historial(): PedidoRegistrado[] {
    return this.leer<PedidoRegistrado[]>(CLAVE_HISTORIAL, []);
  }

  private guardar(items: ItemPedido[]): void {
    this.items$.next(items);
    this.escribir(CLAVE_PEDIDO, items);
  }

  // Devuelve false si el navegador rechaza la escritura (storage lleno o privado)
  private escribir(clave: string, valor: unknown): boolean {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch {
      return false;
    }
  }

  private leer<T>(clave: string, porDefecto: T): T {
    try {
      const raw = localStorage.getItem(clave);
      return raw ? JSON.parse(raw) : porDefecto;
    } catch {
      return porDefecto;
    }
  }
}
