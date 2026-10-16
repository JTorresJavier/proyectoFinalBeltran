import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { Producto } from './productos.service';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

const STORAGE_KEY = 'storehub_carrito';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {

  private items$ = new BehaviorSubject<ItemCarrito[]>(this.cargarDesdeStorage());

  // Observable público del carrito
  carrito$ = this.items$.asObservable();

  // Total de unidades (para el badge)
  cantidadTotal$ = this.items$.pipe(
    map(items => items.reduce((acc, item) => acc + item.cantidad, 0))
  );

  // Total en pesos
  total$ = this.items$.pipe(
    map(items =>
      items.reduce((acc, item) => {
        const precio = item.producto.oferta && item.producto.descuento > 0
          ? item.producto.precio * (1 - item.producto.descuento / 100)
          : item.producto.precio;
        return acc + precio * item.cantidad;
      }, 0)
    )
  );

  // Cantidad de líneas distintas (para mostrar en badge si se prefiere)
  lineas$ = this.items$.pipe(
    map(items => items.length)
  );

  agregar(producto: Producto): void {
    const items = this.items$.value;
    const id = producto._id ?? producto.id ?? producto.nombre;
    const idx = items.findIndex(i => (i.producto._id ?? i.producto.id ?? i.producto.nombre) === id);

    if (idx >= 0) {
      // Ya existe: incrementar cantidad respetando stock
      const item = items[idx];
      if (item.cantidad < producto.stock) {
        const nuevos = [...items];
        nuevos[idx] = { ...item, cantidad: item.cantidad + 1 };
        this.guardar(nuevos);
      }
    } else {
      if (producto.stock > 0) {
        this.guardar([...items, { producto, cantidad: 1 }]);
      }
    }
  }

  quitar(productoId: string): void {
    const nuevos = this.items$.value.filter(
      i => (i.producto._id ?? i.producto.id ?? i.producto.nombre) !== productoId
    );
    this.guardar(nuevos);
  }

  cambiarCantidad(productoId: string, cantidad: number): void {
    const items = this.items$.value;
    const idx = items.findIndex(
      i => (i.producto._id ?? i.producto.id ?? i.producto.nombre) === productoId
    );
    if (idx < 0) return;

    if (cantidad <= 0) {
      this.quitar(productoId);
      return;
    }

    const item = items[idx];
    const cantFinal = Math.min(cantidad, item.producto.stock);
    const nuevos = [...items];
    nuevos[idx] = { ...item, cantidad: cantFinal };
    this.guardar(nuevos);
  }

  vaciar(): void {
    this.guardar([]);
  }

  private guardar(items: ItemCarrito[]): void {
    this.items$.next(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch { /* storage lleno o privado */ }
  }

  private cargarDesdeStorage(): ItemCarrito[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}