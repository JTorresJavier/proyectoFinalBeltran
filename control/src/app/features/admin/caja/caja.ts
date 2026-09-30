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
import { RouterLink } from '@angular/router';

// ── INTERFACE ────────────────────────────────
// Item del carrito — producto + cantidad + subtotal
interface ItemCarrito {
  producto: Producto; // Producto completo
  cantidad: number;   // Cantidad seleccionada
  subtotal: number;   // precio * cantidad
}

// ── DECORADOR ────────────────────────────────
// Página de caja inteligente de StoreHub.
// Redondea a $50 según el acumulado del día
// para mantener el fallo de caja en $0,00.
@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
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

// ── CLASE ────────────────────────────────────
export class CajaComponent implements OnInit {

  // ── SERVICIOS INYECTADOS ──────────────────
  private productosService = inject(ProductosService);  // CRUD de productos
  private authService      = inject(AuthService);       // Sesión del usuario
  private cajaService      = inject(CajaService);       // Lógica de caja
  private snackBar         = inject(MatSnackBar);       // Notificaciones
  private cdr              = inject(ChangeDetectorRef); // Detección de cambios
  private ngZone           = inject(NgZone);            // Zona de Angular

  // ── MATH EXPUESTO AL TEMPLATE ─────────────
  // Necesario para usar Math.abs() en el HTML
  Math = Math;

  // ── DATOS ─────────────────────────────────
  usuarioLogueado: Usuario | null = null; // Usuario logueado
  productos: Producto[]           = [];   // Productos con stock
  productosFiltrados: Producto[]  = [];   // Productos filtrados

  // ── CARRITO ───────────────────────────────
  carrito: ItemCarrito[] = []; // Items del carrito

  // ── BÚSQUEDA ──────────────────────────────
  textoBusqueda: string = ''; // TWO-WAY BINDING con [(ngModel)]

  // ── ESTADO DE PANTALLAS ───────────────────
  cobrando: boolean         = false; // Pantalla de cobro activa
  mostrarHistorial: boolean = false; // Panel de historial visible
  mostrarCierre: boolean    = false; // Pantalla de cierre activa
  cajaAbierta: boolean      = false; // Si la caja está abierta
  mostrarApertura: boolean  = false; // Pantalla de apertura activa

  // ── PAGO ──────────────────────────────────
  metodoPago: string   = 'efectivo'; // Método de pago seleccionado
  montoPagado: number  = 0;          // Monto que entrega el cliente
  montoInicial: number = 0;          // Monto de apertura de caja

  // ── ACUMULADO ─────────────────────────────
  // Diferencia acumulada del día en efectivo.
  // Positivo = cobramos de más | Negativo = cobramos de menos.
  // Meta: mantenerlo en $0,00 al cierre.
  acumulado: number = 0;

  // ── CIERRE ────────────────────────────────
  efectivoContado: number = 0; // Efectivo contado al cerrar la caja

  // ── LIFECYCLE HOOK ────────────────────────
  // Se ejecuta al inicializar el componente
  ngOnInit(): void {
    this.usuarioLogueado = this.authService.obtenerUsuario();
    this.acumulado       = this.cajaService.obtenerAcumulado();

    // Verificamos si la caja está abierta
    const estado     = this.cajaService.obtenerEstado();
    this.cajaAbierta = estado?.abierta ?? false;

    // Si la caja no está abierta → mostramos pantalla de apertura
    if (!this.cajaAbierta) {
      this.mostrarApertura = true;
    } else {
      this.cargarProductos();
    }
  }

  // ── MÉTODO: CARGAR PRODUCTOS ──────────────
  // GET — Obtiene productos con stock desde la API
  cargarProductos(): void {
    this.productosService.getAll().subscribe({
      next: (productos) => {
        this.ngZone.run(() => {
          // Solo mostramos productos con stock disponible
          this.productos          = productos.filter(p => p.stock > 0);
          this.productosFiltrados = this.productos;
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('Error cargando productos:', err)
    });
  }

  // ── MÉTODO: ABRIR CAJA ────────────────────
  // Registra la apertura con el monto inicial
  abrirCaja(): void {
    if (this.montoInicial < 0) {
      this.snackBar.open('⚠️ El monto inicial no puede ser negativo', 'Cerrar', { duration: 2000 });
      return;
    }
    this.cajaService.abrirCaja(this.montoInicial, this.usuarioLogueado?.nombre || '');
    this.cajaAbierta     = true;
    this.mostrarApertura = false;
    this.snackBar.open(`✅ Caja abierta con $${this.montoInicial}`, 'Cerrar', { duration: 3000 });
    this.cargarProductos();
  }

  // ── MÉTODO: FILTRAR PRODUCTOS ─────────────
  // Filtra por texto — vinculado con (input) en el HTML
  filtrar(): void {
    this.productosFiltrados = this.productos.filter(p =>
      p.nombre.toLowerCase().includes(this.textoBusqueda.toLowerCase())
    );
  }

  // ── MÉTODO: AGREGAR AL CARRITO ────────────
  // Agrega un producto o incrementa su cantidad
  agregarAlCarrito(producto: Producto): void {
    const itemExistente = this.carrito.find(i => i.producto.id === producto.id);
    if (itemExistente) {
      if (itemExistente.cantidad < producto.stock!) {
        itemExistente.cantidad++;
        itemExistente.subtotal = itemExistente.cantidad * itemExistente.producto.precio;
        this.snackBar.open(`+1 ${producto.nombre}`, '', { duration: 800 });
      } else {
        this.snackBar.open(`⚠️ Stock máximo alcanzado`, 'Cerrar', { duration: 2000 });
      }
    } else {
      this.carrito.push({ producto, cantidad: 1, subtotal: producto.precio });
      this.snackBar.open(`✅ ${producto.nombre} agregado`, '', { duration: 800 });
    }
  }

  // ── MÉTODO: CAMBIAR CANTIDAD ──────────────
  // Incrementa o decrementa la cantidad de un item
  cambiarCantidad(item: ItemCarrito, cambio: number): void {
    const nuevaCantidad = item.cantidad + cambio;
    if (nuevaCantidad <= 0) { this.quitarDelCarrito(item); return; }
    if (nuevaCantidad > item.producto.stock!) {
      this.snackBar.open('⚠️ Sin stock suficiente', 'Cerrar', { duration: 2000 });
      return;
    }
    item.cantidad = nuevaCantidad;
    item.subtotal = nuevaCantidad * item.producto.precio;
  }

  // ── MÉTODO: QUITAR DEL CARRITO ────────────
  quitarDelCarrito(item: ItemCarrito): void {
    this.carrito = this.carrito.filter(i => i.producto.id !== item.producto.id);
  }

  // ── MÉTODO: LIMPIAR CARRITO ───────────────
  limpiarCarrito(): void {
    if (!confirm('¿Limpiar el carrito?')) return;
    this.carrito = [];
  }

  // ── MÉTODO: COBRAR ────────────────────────
  // Abre la pantalla de cobro con el monto redondeado
  cobrar(): void {
    if (this.carrito.length === 0) {
      this.snackBar.open('⚠️ El carrito está vacío', 'Cerrar', { duration: 2000 });
      return;
    }
    // Sugerimos el monto redondeado como monto pagado por defecto
    this.montoPagado = this.totalRedondeado;
    this.cobrando    = true;
  }

  // ── MÉTODO: CONFIRMAR COBRO ───────────────
  // Registra la venta y actualiza el acumulado
  confirmarCobro(): void {
    if (this.metodoPago === 'efectivo' && this.montoPagado < this.totalRedondeado) {
      this.snackBar.open('⚠️ Monto insuficiente', 'Cerrar', { duration: 2000 });
      return;
    }

    // ── DIFERENCIA DE ESTA VENTA ──────────────
    // Es la diferencia entre lo que cobramos (redondeado) y el total real.
    // Positivo = cobramos de más → acumulado sube
    // Negativo = cobramos de menos → acumulado baja
    // Solo aplica en efectivo — con otros métodos no hay redondeo.
    const diferencia = this.metodoPago === 'efectivo'
      ? this.totalRedondeado - this.total  // redondeado - real
      : 0;

    // ── CREAMOS LA VENTA ──────────────────────
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
      total:        this.total,            // Total real sin redondear
      totalCobrado: this.metodoPago === 'efectivo'
        ? this.totalRedondeado             // En efectivo cobramos el redondeado
        : this.total,                      // En otros métodos cobramos el exacto
      diferencia,                          // Diferencia de esta venta
      metodoPago:   this.metodoPago,
    };

    // ── GUARDAMOS LA VENTA ────────────────────
    // El servicio guarda en LocalStorage y actualiza el acumulado
    this.cajaService.guardarVenta(venta);
    this.acumulado = this.cajaService.obtenerAcumulado();

    // ── VUELTO REAL AL CLIENTE ────────────────
    // Es lo que el cliente nos dio menos lo que cobramos (redondeado)
    const vueltoReal = this.montoPagado - this.totalRedondeado;

    // ── DESCONTAMOS STOCK EN LA API ───────────
    // MongoDB usa _id, no id — usamos _id primero
    this.carrito.forEach(item => {
      const id = (item.producto as any)._id || item.producto.id!;
      this.productosService.update(id, {
        ...item.producto,
        stock: item.producto.stock! - item.cantidad
      }).subscribe();
    });

    // ── MENSAJE DE ÉXITO ──────────────────────
    const msg = this.metodoPago === 'efectivo'
      ? `✅ Cobrado $${this.totalRedondeado} — Vuelto: $${vueltoReal} — Acumulado: ${this.acumulado >= 0 ? '+' : ''}$${this.acumulado}`
      : `✅ Cobro confirmado — $${this.total}`;
    this.snackBar.open(msg, 'Cerrar', { duration: 4000 });

    // ── LIMPIAMOS Y RECARGAMOS ────────────────
    this.carrito     = [];
    this.cobrando    = false;
    this.montoPagado = 0;
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
    this.cajaAbierta     = false;
    this.mostrarCierre   = false;
    this.acumulado       = 0;
    this.snackBar.open('✅ Caja cerrada correctamente', 'Cerrar', { duration: 3000 });
    this.mostrarApertura = true;
  }

  // ── GETTERS ───────────────────────────────

  // Total real del carrito (sin redondear)
  get total(): number {
    return this.carrito.reduce((acc, item) => acc + item.subtotal, 0);
  }

  // Total redondeado a $50 según el acumulado del día
  // Si acumulado > 0 → redondeamos hacia ABAJO (cobramos menos para compensar)
  // Si acumulado < 0 → redondeamos hacia ARRIBA (cobramos más para compensar)
  get totalRedondeado(): number {
    return this.cajaService.redondearA50(this.total, this.acumulado);
  }

  // Diferencia de esta venta: redondeado - real
  get diferenciaVenta(): number {
    return this.totalRedondeado - this.total;
  }

  // Vuelto real al cliente: lo que pagó - lo que cobramos (redondeado)
  get vuelto(): number {
    return this.montoPagado - this.totalRedondeado;
  }

  // Cantidad total de items en el carrito
  get cantidadItems(): number {
    return this.carrito.reduce((acc, item) => acc + item.cantidad, 0);
  }

  // Billetes sugeridos para dar de vuelto
  get billetesVuelto(): { billete: number; cantidad: number }[] {
    return this.cajaService.calcularBilletes(this.vuelto);
  }

  // Ventas registradas hoy
  get ventasHoy(): Venta[] {
    return this.cajaService.obtenerVentasDeHoy();
  }

  // Total vendido hoy
  get totalHoy(): number {
    return this.cajaService.totalVendidoHoy();
  }

  // Totales por método de pago
  get totalesPorMetodo() {
    return this.cajaService.totalPorMetodo();
  }

  // Diferencia real entre efectivo esperado y contado al cierre
  get diferenciaCierre(): number {
    const estado           = this.cajaService.obtenerEstado();
    const efectivoEsperado = (estado?.montoInicial || 0) + this.totalesPorMetodo.efectivo;
    return this.efectivoContado - efectivoEsperado;
  }

  // Estado del acumulado para mostrar color en el header
  get estadoAcumulado(): string {
    if (Math.abs(this.acumulado) <= 50)  return 'ok';      // Verde — normal
    if (Math.abs(this.acumulado) <= 150) return 'warning'; // Naranja — revisar
    return 'danger';                                        // Rojo — fallo grave
  }
}