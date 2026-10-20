import { Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CarritoService, ItemCarrito } from '../../../core/services/carrito.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatCardModule,
    MatSnackBarModule,
    CurrencyPipe
  ],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css'
})
export class CarritoComponent {

  private carritoService = inject(CarritoService);
  private snackBar = inject(MatSnackBar);

  carrito$ = this.carritoService.carrito$;
  total$ = this.carritoService.total$;

  precioFinal(item: ItemCarrito): number {
    const p = item.producto;
    return p.oferta && p.descuento > 0
      ? p.precio * (1 - p.descuento / 100)
      : p.precio;
  }

  subtotal(item: ItemCarrito): number {
    return this.precioFinal(item) * item.cantidad;
  }

  getId(item: ItemCarrito): string {
    return item.producto._id ?? item.producto.id ?? item.producto.nombre;
  }

  aumentar(item: ItemCarrito): void {
    const id = this.getId(item);
    this.carritoService.cambiarCantidad(id, item.cantidad + 1);
  }

  disminuir(item: ItemCarrito): void {
    const id = this.getId(item);
    this.carritoService.cambiarCantidad(id, item.cantidad - 1);
  }

  eliminar(item: ItemCarrito): void {
    const id = this.getId(item);
    this.carritoService.quitar(id);
    this.snackBar.open(`${item.producto.nombre} eliminado`, 'OK', { duration: 2000 });
  }

  vaciar(): void {
    this.carritoService.vaciar();
    this.snackBar.open('Carrito vaciado', 'OK', { duration: 2000 });
  }

  finalizarCompra(): void {
    // TODO: implementar checkout (generar pedido, redirigir a pago)
    this.snackBar.open('¡Pedido recibido! Próximamente checkout completo.', 'OK', { duration: 3000 });
  }
}
