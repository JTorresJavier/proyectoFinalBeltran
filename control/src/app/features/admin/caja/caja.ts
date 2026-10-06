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
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle';

// ── INTERFACE ────────────────────────────────
// Define la estructura de cada item en el carrito de compras
interface ItemCarrito {
  producto: Producto; // Producto completo con todos sus datos
  cantidad: number;   // Cantidad seleccionada por el cajero
  subtotal: number;   // precio con descuento aplicado * cantidad
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
    ThemeToggleComponent,
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
  private snackBar         = inject(MatSnackBar);       // Notificaciones toast
  private cdr              = inject(ChangeDetectorRef); // Fuerza detección de cambios
  private ngZone           = inject(NgZone);            // Vuelve al hilo de Angular

  // ── MATH EXPUESTO AL TEMPLATE ─────────────
  // Necesario para usar Math.abs() directamente en el HTML
  Math = Math;

  // ── DATOS ─────────────────────────────────
  usuarioLogueado: Usuario | null = null; // Usuario con sesión activa
  productos: Producto[]           = [];   // Lista completa de productos con stock
  productosFiltrados: Producto[]  = [];   // Lista filtrada por búsqueda

  // ── CARRITO ───────────────────────────────
  carrito: ItemCarrito[] = []; // Items agregados para la venta actual

  // ── BÚSQUEDA ──────────────────────────────
  textoBusqueda: string = ''; // Texto vinculado con [(ngModel)] en el buscador

  // ── ESTADO DE PANTALLAS ───────────────────
  cobrando: boolean         = false; // Muestra la pantalla de cobro
  mostrarHistorial: boolean = false; // Muestra el panel lateral de historial
  mostrarCierre: boolean    = false; // Muestra la pantalla de cierre de caja
  cajaAbierta: boolean      = false; // Si la caja fue abierta correctamente
  mostrarApertura: boolean  = false; // Muestra la pantalla de apertura

  // ── PAGO ──────────────────────────────────
  metodoPago: string   = 'efectivo'; // Método seleccionado por el cajero
  montoPagado: number  = 0;          // Monto que entrega el cliente
  montoInicial: number = 0;          // Efectivo con el que se abre la caja

  // ── ACUMULADO ─────────────────────────────
  // Diferencia acumulada del día en efectivo.
  // Positivo = cobramos de más | Negativo = cobramos de menos.
  // Meta: mantenerlo en $0,00 al cierre.
  acumulado: number = 0;

  // ── CIERRE ────────────────────────────────
  efectivoContado: number = 0; // Efectivo contado físicamente al cerrar

  // ── LIFECYCLE HOOK ────────────────────────
  // Se ejecuta al cargar el componente: obtiene el usuario,
  // el acumulado del día y verifica si la caja está abierta
  ngOnInit(): void {
    this.usuarioLogueado = this.authService.obtenerUsuario();
    this.acumulado       = this.cajaService.obtenerAcumulado();

    const estado     = this.cajaService.obtenerEstado();
    this.cajaAbierta = estado?.abierta ?? false;

    // Si la caja no está abierta mostramos la pantalla de apertura
    if (!this.cajaAbierta) {
      this.mostrarApertura = true;
    } else {
      this.cargarProductos();
    }
  }

  // ── MÉTODO: CARGAR PRODUCTOS ──────────────
  // Obtiene desde la API todos los productos que tienen stock disponible
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
  // Registra la apertura con el monto inicial en efectivo
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
  // Filtra la lista de productos según el texto ingresado en el buscador
  filtrar(): void {
    this.productosFiltrados = this.productos.filter(p =>
      p.nombre.toLowerCase().includes(this.textoBusqueda.toLowerCase())
    );
  }

  // ── MÉTODO: PRECIO REAL ───────────────────
  // Calcula el precio final aplicando el descuento si el producto está en oferta.
  // Si no tiene oferta, devuelve el precio original sin modificar.
  precioReal(producto: Producto): number {
    return (producto.oferta && producto.descuento)
      ? producto.precio * (1 - producto.descuento / 100)
      : producto.precio;
  }

  // ── MÉTODO: AGREGAR AL CARRITO ────────────
  // Agrega un producto al carrito o incrementa su cantidad si ya existe.
  // Usa _id de MongoDB o id según cuál esté disponible.
  // El subtotal siempre usa el precio con descuento aplicado.
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
  // Incrementa o decrementa la cantidad de un item del carrito.
  // Si llega a 0 lo elimina. Recalcula el subtotal con precio real.
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
  // Elimina un item del carrito comparando por _id de MongoDB o id
  quitarDelCarrito(item: ItemCarrito): void {
    const idItem = (item.producto as any)._id || item.producto.id;
    this.carrito = this.carrito.filter(i => {
      const id = (i.producto as any)._id || i.producto.id;
      return id !== idItem;
    });
  }

  // ── MÉTODO: LIMPIAR CARRITO ───────────────
  // Vacía todo el carrito tras confirmación del cajero
  limpiarCarrito(): void {
    if (!confirm('¿Limpiar el carrito?')) return;
    this.carrito = [];
  }

  // ── MÉTODO: COBRAR ────────────────────────
  // Abre la pantalla de cobro con el total redondeado precargado
  cobrar(): void {
    if (this.carrito.length === 0) {
      this.snackBar.open('⚠️ El carrito está vacío', 'Cerrar', { duration: 2000, panelClass: 'snackbar--warning' });
      return;
    }
    this.montoPagado = this.totalRedondeado;
    this.cobrando    = true;
  }

  // ── MÉTODO: CONFIRMAR COBRO ───────────────
  // Registra la venta, actualiza el acumulado del día,
  // descuenta el stock en MongoDB y limpia el carrito
  confirmarCobro(): void {
    if (this.metodoPago === 'efectivo' && this.montoPagado < this.totalRedondeado) {
      this.snackBar.open('⚠️ Monto insuficiente', 'Cerrar', { duration: 2000, panelClass: 'snackbar--warning' });
      return;
    }

    // ── DIFERENCIA DE ESTA VENTA ──────────────
    // Positivo = cobramos de más → acumulado sube
    // Negativo = cobramos de menos → acumulado baja
    // Solo aplica en efectivo, con otros métodos no hay redondeo
    const diferencia = this.metodoPago === 'efectivo'
      ? this.totalRedondeado - this.total
      : 0;

    // ── CREAMOS LA VENTA ──────────────────────
    // Guardamos el precio original en el historial para tener el registro correcto
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
        ? this.totalRedondeado
        : this.total,
      diferencia,
      metodoPago:   this.metodoPago,
    };

    // ── GUARDAMOS LA VENTA ────────────────────
    // El servicio guarda en LocalStorage y actualiza el acumulado del día
    this.cajaService.guardarVenta(venta);
    this.acumulado = this.cajaService.obtenerAcumulado();

    // ── VUELTO REAL AL CLIENTE ────────────────
    // Lo que el cliente entregó menos lo que cobramos (redondeado)
    const vueltoReal = this.montoPagado - this.totalRedondeado;

    // ── DESCONTAMOS STOCK EN LA API ───────────
    // MongoDB devuelve _id en lugar de id, usamos _id primero
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
    this.snackBar.open(msg, 'Cerrar', { duration: 4000, panelClass: 'snackbar--success' });

    // ── LIMPIAMOS Y RECARGAMOS ────────────────
    this.carrito     = [];
    this.cobrando    = false;
    this.montoPagado = 0;
    this.cargarProductos();
  }

  // ── MÉTODO: CANCELAR COBRO ────────────────
  // Vuelve al carrito sin registrar nada
  cancelarCobro(): void {
    this.cobrando = false;
  }

  // ── MÉTODO: CERRAR CAJA ───────────────────
  // Muestra la pantalla de cierre con el resumen del día
  cerrarCaja(): void {
    this.efectivoContado = 0;
    this.mostrarCierre   = true;
  }

  // ── MÉTODO: CONFIRMAR CIERRE ──────────────
  // Cierra la caja, resetea el acumulado y muestra pantalla de apertura
  confirmarCierre(): void {
    this.cajaService.cerrarCaja();
    this.cajaAbierta     = false;
    this.mostrarCierre   = false;
    this.acumulado       = 0;
    this.snackBar.open('✅ Caja cerrada correctamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar--success' });
    this.mostrarApertura = true;
  }

  // ── GETTERS ───────────────────────────────

  // Suma de todos los subtotales del carrito (con descuentos ya aplicados)
  get total(): number {
    return this.carrito.reduce((acc, item) => acc + item.subtotal, 0);
  }

  // Total redondeado a $50 según el acumulado del día
  // Si acumulado > 0 → redondeamos hacia ABAJO (cobramos menos para compensar)
  // Si acumulado < 0 → redondeamos hacia ARRIBA (cobramos más para compensar)
  get totalRedondeado(): number {
    return this.cajaService.redondearA50(this.total, this.acumulado);
  }

  // Diferencia entre el total redondeado y el total real de esta venta
  get diferenciaVenta(): number {
    return this.totalRedondeado - this.total;
  }

  // Vuelto que corresponde dar al cliente
  get vuelto(): number {
    return this.montoPagado - this.totalRedondeado;
  }

  // Cantidad total de unidades en el carrito (suma de todas las cantidades)
  get cantidadItems(): number {
    return this.carrito.reduce((acc, item) => acc + item.cantidad, 0);
  }

  // Billetes sugeridos para armar el vuelto de forma óptima
  get billetesVuelto(): { billete: number; cantidad: number }[] {
    return this.cajaService.calcularBilletes(this.vuelto);
  }

  // Ventas registradas en el día de hoy
  get ventasHoy(): Venta[] {
    return this.cajaService.obtenerVentasDeHoy();
  }

  // Total en pesos vendido hoy
  get totalHoy(): number {
    return this.cajaService.totalVendidoHoy();
  }

  // Totales agrupados por método de pago (efectivo, débito, crédito, transferencia)
  get totalesPorMetodo() {
    return this.cajaService.totalPorMetodo();
  }

  // Diferencia entre el efectivo contado físicamente y lo esperado en caja
  get diferenciaCierre(): number {
    const estado           = this.cajaService.obtenerEstado();
    const efectivoEsperado = (estado?.montoInicial || 0) + this.totalesPorMetodo.efectivo;
    return this.efectivoContado - efectivoEsperado;
  }

  // Estado del acumulado para mostrar color en el header
  // ok = verde (normal) | warning = naranja (revisar) | danger = rojo (fallo grave)
  get estadoAcumulado(): string {
    if (Math.abs(this.acumulado) <= 50)  return 'ok';
    if (Math.abs(this.acumulado) <= 150) return 'warning';
    return 'danger';
  }
}
