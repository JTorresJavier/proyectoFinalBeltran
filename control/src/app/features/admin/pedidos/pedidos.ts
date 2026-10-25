import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PedidoService, ItemPedido, PedidoRegistrado } from '../../../core/services/pedido.service';
import { ProductosService, Producto } from '../../../core/services/productos.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductoImagenComponent } from '../../../shared/components/producto-imagen/producto-imagen';

// ── PEDIDO A PROVEEDOR ────────────────────────
// Reemplaza al carrito de clientes: el personal arma la lista
// de reposición desde la consulta de precios o desde las
// sugerencias de stock bajo, y la registra con su proveedor.
@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    CurrencyPipe,
    DatePipe,
    ProductoImagenComponent,
  ],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css'
})
export class PedidosComponent implements OnInit {

  private pedidoService    = inject(PedidoService);
  private productosService = inject(ProductosService);
  private authService      = inject(AuthService);
  private snackBar         = inject(MatSnackBar);
  private cdr              = inject(ChangeDetectorRef);
  private ngZone           = inject(NgZone);

  pedido$        = this.pedidoService.pedido$;
  totalEstimado$ = this.pedidoService.totalEstimado$;
  cantidadTotal$ = this.pedidoService.cantidadTotal$;

  sugeridos: Producto[] = [];          // Stock bajo o agotado
  historial: PedidoRegistrado[] = [];

  // ── FORMULARIO REACTIVO ───────────────────
  // El proveedor se valida sin espacios: "  " no cuenta como nombre
  formulario = new FormGroup({
    proveedor: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\s*\S.*\S\s*$/)] }),
    observaciones: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
  });

  get proveedor() { return this.formulario.controls.proveedor; }

  ngOnInit(): void {
    this.historial = this.pedidoService.historial();
    this.productosService.getAll().subscribe({
      next: (productos) => {
        this.ngZone.run(() => {
          // Primero los agotados, después los de menos stock
          this.sugeridos = productos
            .filter(p => p.stock < 5)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 12);
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('Error cargando sugeridos:', err),
    });
  }

  getId(item: ItemPedido): string {
    return this.pedidoService.idDe(item.producto);
  }

  yaPedido(producto: Producto): number {
    return this.pedidoService.cantidadDe(producto);
  }

  aumentar(item: ItemPedido): void {
    this.pedidoService.cambiarCantidad(this.getId(item), item.cantidad + 1);
  }

  disminuir(item: ItemPedido): void {
    this.pedidoService.cambiarCantidad(this.getId(item), item.cantidad - 1);
  }

  // Cantidad escrita a mano en el input
  fijarCantidad(item: ItemPedido, valor: string): void {
    const cantidad = Math.floor(Number(valor));
    if (Number.isFinite(cantidad)) {
      this.pedidoService.cambiarCantidad(this.getId(item), cantidad);
    }
  }

  // Agrega un sugerido con la cantidad que falta para llegar a 20 unidades
  agregarSugerido(producto: Producto): void {
    const faltante = Math.max(20 - producto.stock, 1);
    this.pedidoService.agregar(producto, faltante);
    this.snackBar.open(`${producto.nombre}: +${faltante} u. al pedido`, 'OK', { duration: 2000, panelClass: 'snackbar--info' });
  }

  eliminar(item: ItemPedido): void {
    this.pedidoService.quitar(this.getId(item));
    this.snackBar.open(`${item.producto.nombre} quitado del pedido`, 'OK', { duration: 2000 });
  }

  vaciar(): void {
    this.pedidoService.vaciar();
    this.snackBar.open('Pedido vaciado', 'OK', { duration: 2000 });
  }

  // ── HISTORIAL: DETALLE Y COPIA ────────────
  expandido: string | null = null; // id del pedido abierto

  alternarDetalle(id: string): void {
    this.expandido = this.expandido === id ? null : id;
  }

  // Copia el pedido como texto para mandarlo al proveedor (mail o WhatsApp)
  copiar(pedido: PedidoRegistrado): void {
    const fecha = new Date(pedido.fecha).toLocaleDateString('es-AR');
    const lineas = pedido.items.map(i => `- ${i.cantidad} u. ${i.nombre}`);
    const texto = [
      `Pedido Premium Market — ${fecha}`,
      `Proveedor: ${pedido.proveedor}`,
      ...lineas,
      ...(pedido.observaciones ? [`Observaciones: ${pedido.observaciones}`] : []),
    ].join('\n');

    navigator.clipboard.writeText(texto).then(
      () => this.snackBar.open('Pedido copiado al portapapeles', 'OK', { duration: 2000, panelClass: 'snackbar--info' }),
      () => this.snackBar.open('No se pudo copiar. Abrí el detalle y copialo a mano.', 'Cerrar', { duration: 3000, panelClass: 'snackbar--warning' }),
    );
  }

  registrar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { proveedor, observaciones } = this.formulario.getRawValue();
    const usuario = this.authService.obtenerUsuario()?.nombre ?? 'Sin usuario';
    let pedido: PedidoRegistrado | null;
    try {
      pedido = this.pedidoService.registrar(proveedor, observaciones, usuario);
    } catch {
      // El pedido en curso se conserva para poder reintentar
      this.snackBar.open('No se pudo guardar el pedido. Liberá espacio del navegador y probá de nuevo.', 'Cerrar', { duration: 4000, panelClass: 'snackbar--error' });
      return;
    }
    if (!pedido) return;

    this.historial = this.pedidoService.historial();
    this.formulario.reset();
    this.snackBar.open(
      `Pedido a ${pedido.proveedor} registrado: ${pedido.totalUnidades} unidades`,
      'OK',
      { duration: 3000, panelClass: 'snackbar--success' }
    );
  }
}
