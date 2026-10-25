// ── IMPORTS ──────────────────────────────────
import { ChangeDetectorRef, Component, OnInit, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ── ANGULAR MATERIAL ──────────────────────────
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';

// ── SERVICIOS ─────────────────────────────────
import { ProductosService, Producto } from '../../../core/services/productos.service';
import { AuthService, Usuario } from '../../../core/services/auth.service';
import { CajaService, Venta } from '../../../core/services/caja.service';
import { Router } from '@angular/router';
import { ProductoImagenComponent } from '../../../shared/components/producto-imagen/producto-imagen';

// ── INTERFACE ────────────────────────────────
interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductoImagenComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule,
    MatTableModule,
    MatBadgeModule,
  ],
  templateUrl: './caja.html',
  styleUrl: './caja.css'
})
export class CajaComponent implements OnInit {

  // ── SERVICIOS INYECTADOS ──────────────────
  private productosService = inject(ProductosService);
  private authService      = inject(AuthService);
  private cajaService      = inject(CajaService);
  private snackBar         = inject(MatSnackBar);
  private cdr              = inject(ChangeDetectorRef);
  private ngZone           = inject(NgZone);
  private router           = inject(Router);

  Math = Math;

  // ── DATOS ─────────────────────────────────
  usuarioLogueado: Usuario | null = null;
  productos: Producto[]           = [];
  productosFiltrados: Producto[]  = [];

  // ── CARRITO ───────────────────────────────
  carrito: ItemCarrito[] = [];

  // ── BÚSQUEDA ──────────────────────────────
  textoBusqueda: string = '';

  // ── ESTADO DE PANTALLAS ───────────────────
  cobrando: boolean         = false;
  mostrarHistorial: boolean = false;
  mostrarCierre: boolean    = false;
  cajaAbierta: boolean      = false;
  mostrarApertura: boolean  = false;

  // ── PAGO ──────────────────────────────────
  metodoPago: string    = 'efectivo';
  montoPagado: number   = 0;
  montoCobrado: number  = 0;  // ← lo que vos decidís cobrar (editable)
  montoInicial: number  = 0;

  // ── ACUMULADO ─────────────────────────────
  acumulado: number = 0;

  // ── CIERRE ────────────────────────────────
  efectivoContado: number = 0;

  // ── LIFECYCLE HOOK ────────────────────────
  ngOnInit(): void {
    this.usuarioLogueado = this.authService.obtenerUsuario();
    this.acumulado       = this.cajaService.obtenerAcumulado();

    const estado     = this.cajaService.obtenerEstado();
    this.cajaAbierta = estado?.abierta ?? false;

    if (!this.cajaAbierta) {
      this.mostrarApertura = true;
    } else {
      this.cargarProductos();
    }
  }

  // ── MÉTODO: CARGAR PRODUCTOS ──────────────
  cargarProductos(): void {
    this.productosService.getAll().subscribe({
      next: (productos) => {
        this.ngZone.run(() => {
          this.productos          = productos.filter(p => p.stock > 0);
          this.productosFiltrados = this.productos;
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('Error cargando productos:', err)
    });
  }

  // ── MÉTODO: ABRIR CAJA ────────────────────
  abrirCaja(): void {
    if (this.montoInicial < 0) {
      this.snackBar.open('⚠️ El monto inicial no puede ser negativo', 'Cerrar', { duration: 2000, panelClass: 'snackbar--warning' });
      return;
    }
    this.cajaService.abrirCaja(this.montoInicial, this.usuarioLogueado?.nombre || '');
    this.cajaAbierta     = true;
    this.mostrarApertura = false;
    this.snackBar.open(`✅ Caja abierta con $${this.montoInicial}`, 'Cerrar', { duration: 3000, panelClass: 'snackbar--success' });
    this.cargarProductos();
  }

  // ── MÉTODO: FILTRAR PRODUCTOS ─────────────
  filtrar(): void {
    this.productosFiltrados = this.productos.filter(p =>
      p.nombre.toLowerCase().includes(this.textoBusqueda.toLowerCase())
    );
  }

  // ── MÉTODO: PRECIO REAL ───────────────────
  precioReal(producto: Producto): number {
    return (producto.oferta && producto.descuento)
      ? producto.precio * (1 - producto.descuento / 100)
      : producto.precio;
  }

  // ── MÉTODO: AGREGAR AL CARRITO ────────────
  agregarAlCarrito(producto: Producto): void {
    const idB = (producto as any)._id || producto.id;
    const itemExistente = this.carrito.find(i => {
      const idA = (i.producto as any)._id || i.producto.id;
      return idA === idB;
    });
    const precio = this.precioReal(producto);
    if (itemExistente) {
      if (itemExistente.cantidad < producto.stock!) {
        itemExistente.cantidad++;
        itemExistente.subtotal = itemExistente.cantidad * precio;
        this.snackBar.open(`+1 ${producto.nombre}`, '', { duration: 800, panelClass: 'snackbar--info' });
      } else {
        this.snackBar.open(`⚠️ Stock máximo alcanzado`, 'Cerrar', { duration: 2000, panelClass: 'snackbar--warning' });
      }
    } else {
      this.carrito.push({ producto, cantidad: 1, subtotal: precio });
      this.snackBar.open(`✅ ${producto.nombre} agregado`, '', { duration: 800, panelClass: 'snackbar--success' });
    }
  }

  // ── MÉTODO: CAMBIAR CANTIDAD ──────────────
  cambiarCantidad(item: ItemCarrito, cambio: number): void {
    const nuevaCantidad = item.cantidad + cambio;
    if (nuevaCantidad <= 0) { this.quitarDelCarrito(item); return; }
    if (nuevaCantidad > item.producto.stock!) {
      this.snackBar.open('⚠️ Sin stock suficiente', 'Cerrar', { duration: 2000, panelClass: 'snackbar--warning' });
      return;
    }
    item.cantidad = nuevaCantidad;
    item.subtotal = nuevaCantidad * this.precioReal(item.producto);
  }

  // ── MÉTODO: QUITAR DEL CARRITO ────────────
  quitarDelCarrito(item: ItemCarrito): void {
    const idItem = (item.producto as any)._id || item.producto.id;
    this.carrito = this.carrito.filter(i => {
      const id = (i.producto as any)._id || i.producto.id;
      return id !== idItem;
    });
  }

  // ── MÉTODO: LIMPIAR CARRITO ───────────────
  limpiarCarrito(): void {
    if (!confirm('¿Limpiar el carrito?')) return;
    this.carrito = [];
  }

  // ── MÉTODO: COBRAR ────────────────────────
  cobrar(): void {
    if (this.carrito.length === 0) {
      this.snackBar.open('⚠️ El carrito está vacío', 'Cerrar', { duration: 2000, panelClass: 'snackbar--warning' });
      return;
    }
    this.montoPagado  = this.totalRedondeado;
    this.montoCobrado = this.totalRedondeado;  // ← por defecto igual al redondeado, editable
    this.cobrando     = true;
  }

  // ── MÉTODO: CONFIRMAR COBRO ───────────────
  confirmarCobro(): void {

    // La diferencia usa montoCobrado (lo que vos decidís registrar),
    // no montoPagado (lo que dio el cliente) ni totalRedondeado.
    // Así si cobrás $50000 en vez de $49950 → diferencia = +$50
    const diferencia = this.metodoPago === 'efectivo'
      ? this.montoCobrado - this.total
      : 0;

    const venta: Venta = {
      id:           this.cajaService.generarId(),
      fecha:        new Date().toISOString(),
      cajero:       this.usuarioLogueado?.nombre || '',
      items:        this.carrito.map(i => ({
        nombre:   i.producto.nombre,
        cantidad: i.cantidad,
        precio:   i.producto.precio,
        subtotal: i.subtotal,
      })),
      total:        this.total,
      totalCobrado: this.metodoPago === 'efectivo'
        ? this.montoPagado
        : this.total,
      diferencia,
      metodoPago:   this.metodoPago,
    };

    this.cajaService.guardarVenta(venta);
    this.acumulado = this.cajaService.obtenerAcumulado();

    const vueltoReal = this.montoPagado - this.montoCobrado;

    // ── DESCONTAMOS STOCK EN LA API ───────────
    this.carrito.forEach(item => {
      const id = (item.producto as any)._id || item.producto.id!;
      this.productosService.update(id, {
        ...item.producto,
        stock: item.producto.stock! - item.cantidad
      }).subscribe();
    });

    const msg = this.metodoPago === 'efectivo'
      ? vueltoReal >= 0
        ? `✅ Cobrado $${this.montoCobrado} — Vuelto: $${vueltoReal} — Acumulado: ${this.acumulado >= 0 ? '+' : ''}$${this.acumulado}`
        : `✅ Cobrado $${this.montoCobrado} — Debe: $${Math.abs(vueltoReal)} — Acumulado: ${this.acumulado >= 0 ? '+' : ''}$${this.acumulado}`
      : `✅ Cobro confirmado — $${this.total}`;
    this.snackBar.open(msg, 'Cerrar', { duration: 4000, panelClass: 'snackbar--success' });

    this.carrito      = [];
    this.cobrando     = false;
    this.montoPagado  = 0;
    this.montoCobrado = 0;
    this.cargarProductos();
  }

  // ── MÉTODO: CANCELAR COBRO ────────────────
  cancelarCobro(): void {
    this.cobrando = false;
  }

  // ── MÉTODO: CERRAR CAJA ───────────────────
  cerrarCaja(): void {
    this.efectivoContado = 0;
    this.mostrarCierre   = true;
  }

  // ── MÉTODO: CONFIRMAR CIERRE ──────────────
  confirmarCierre(): void {
    this.cajaService.cerrarCaja();
    this.snackBar.open('✅ Caja cerrada — Hasta luego!', 'Cerrar', { duration: 2000, panelClass: 'snackbar--success' });
    setTimeout(() => {
      this.authService.logout();
      this.router.navigate(['/login']);
    }, 2000);
  }

  // ── GETTERS ───────────────────────────────

  get total(): number {
    return this.carrito.reduce((acc, item) => acc + item.subtotal, 0);
  }

  get totalRedondeado(): number {
    return this.cajaService.redondearA50(this.total, this.acumulado);
  }

  get diferenciaVenta(): number {
    return this.montoCobrado - this.total;
  }

  // Diferencia en tiempo real mientras editás montoCobrado
  get diferenciaCobro(): number {
    return this.montoCobrado - this.total;
  }

  get vuelto(): number {
    return this.montoPagado - this.montoCobrado;  // vuelto respecto a lo que cobrás
  }

  get cantidadItems(): number {
    return this.carrito.reduce((acc, item) => acc + item.cantidad, 0);
  }

  get billetesVuelto(): { billete: number; cantidad: number }[] {
    return this.cajaService.calcularBilletes(this.vuelto);
  }

  get ventasHoy(): Venta[] {
    return this.cajaService.obtenerVentasDeHoy();
  }

  get totalHoy(): number {
    return this.cajaService.totalVendidoHoy();
  }

  get totalesPorMetodo() {
    return this.cajaService.totalPorMetodo();
  }

  get diferenciaCierre(): number {
    const estado           = this.cajaService.obtenerEstado();
    const efectivoEsperado = (estado?.montoInicial || 0) + this.totalesPorMetodo.efectivo;
    return this.efectivoContado - efectivoEsperado;
  }

  get estadoAcumulado(): string {
    if (Math.abs(this.acumulado) <= 50)  return 'ok';
    if (Math.abs(this.acumulado) <= 150) return 'warning';
    return 'danger';
  }
}
