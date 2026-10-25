// ── IMPORTS BASE ──────────────────────────────
import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Pipes y directivas comunes
import { FormsModule  } from '@angular/forms';  // ngModel para búsqueda y filtros
import { ActivatedRoute, Router } from '@angular/router';

// ── ANGULAR MATERIAL ──────────────────────────
import { MatButtonModule          } from '@angular/material/button';
import { MatIconModule            } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// ── COMPONENTES PROPIOS ───────────────────────
import { ProductoImagenComponent } from '../../../shared/components/producto-imagen/producto-imagen';

// ── SERVICIOS ─────────────────────────────────
import { ProductosService, Producto } from '../../../core/services/productos.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { AuthService } from '../../../core/services/auth.service';

type FiltroStock = '' | 'agotado' | 'bajo';
type Orden = 'nombre' | 'precio-asc' | 'precio-desc' | 'stock';

const POR_PAGINA = 48;

// ── DECORADOR ────────────────────────────────
// Consulta de precios y stock para el personal.
// Búsqueda, categorías, filtros de oferta y stock, orden y
// "Agregar al pedido" para armar la reposición.
// Los filtros también llegan por URL (?q=, ?ofertas=1, ?stock=bajo)
// desde el buscador del header y las alertas del inicio.
@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ProductoImagenComponent,
  ],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class CatalogoComponent implements OnInit {

  // ── SERVICIOS INYECTADOS ──────────────────
  private productosService = inject(ProductosService);  // API REST de productos
  private pedidoService    = inject(PedidoService);     // Pedido a proveedor
  private authService      = inject(AuthService);       // Rol del usuario
  private route            = inject(ActivatedRoute);    // Filtros desde la URL
  private router           = inject(Router);            // Ir al pedido desde el aviso
  private snackBar         = inject(MatSnackBar);
  private cdr              = inject(ChangeDetectorRef); // Fuerza actualización de la vista
  private ngZone           = inject(NgZone);            // Zona Angular para detectar cambios HTTP

  // ── ESTADO ────────────────────────────────
  productos: Producto[]          = []; // Lista completa (original, sin filtrar)
  productosFiltrados: Producto[] = []; // Lista con filtros aplicados
  cargando = false;
  error = false;
  visibles = POR_PAGINA;              // Cuántos se muestran ("Mostrar más")

  // ── FILTROS ───────────────────────────────
  textoBusqueda = '';
  categoriaSeleccionada = '';
  soloOfertas = false;
  filtroStock: FiltroStock = '';
  orden: Orden = 'nombre';

  // Solo quien repone puede armar pedidos
  puedePedir = ['admin', 'empleado', 'repositor'].includes(this.authService.obtenerUsuario()?.rol ?? '');

  // ── CATEGORÍAS CON ÍCONO ─────────────────
  categorias = [
    { nombre: 'Gaseosas',              icono: 'local_drink'       },
    { nombre: 'Aguas y Jugos',         icono: 'water_drop'        },
    { nombre: 'Bebidas con Alcohol',   icono: 'sports_bar'        },
    { nombre: 'Lácteos',               icono: 'egg'               },
    { nombre: 'Fiambres',              icono: 'lunch_dining'      },
    { nombre: 'Carnes',                icono: 'kebab_dining'      },
    { nombre: 'Congelados',            icono: 'ac_unit'           },
    { nombre: 'Verdulería',            icono: 'eco'               },
    { nombre: 'Panadería',             icono: 'bakery_dining'     },
    { nombre: 'Almacén',               icono: 'storefront'        },
    { nombre: 'Enlatados',             icono: 'inventory_2'       },
    { nombre: 'Aceites y Condimentos', icono: 'oil_barrel'        },
    { nombre: 'Cereales y Legumbres',  icono: 'grass'             },
    { nombre: 'Desayuno y Merienda',   icono: 'free_breakfast'    },
    { nombre: 'Snacks',                icono: 'fastfood'          },
    { nombre: 'Golosinas',             icono: 'cake'              },
    { nombre: 'Limpieza',              icono: 'cleaning_services' },
    { nombre: 'Higiene Personal',      icono: 'soap'              },
    { nombre: 'Perfumería',            icono: 'self_care'         },
    { nombre: 'Farmacia',              icono: 'local_pharmacy'    },
    { nombre: 'Mascotas',              icono: 'pets'              },
    { nombre: 'Ferretería',            icono: 'hardware'          },
    { nombre: 'Librería',              icono: 'menu_book'         },
    { nombre: 'Electrónica',           icono: 'devices'           },
    { nombre: 'Infantil',              icono: 'child_care'        },
    { nombre: 'Textil',                icono: 'checkroom'         },
  ];

  // ── LIFECYCLE: ngOnInit ───────────────────
  // Escucha los filtros de la URL y carga el catálogo una vez
  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.textoBusqueda         = params.get('q') ?? '';
      this.soloOfertas           = params.get('ofertas') === '1';
      this.categoriaSeleccionada = params.get('categoria') ?? '';
      const stock = params.get('stock');
      this.filtroStock = stock === 'agotado' || stock === 'bajo' ? stock : '';
      this.aplicarFiltros();
    });

    this.cargando = true;
    this.productosService.getAll().subscribe({
      next: (productos) => {
        this.ngZone.run(() => {
          this.productos = productos;
          this.cargando  = false;
          this.aplicarFiltros();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Error cargando productos:', err);
          this.cargando = false;
          this.error = true;
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── MÉTODO: APLICAR FILTROS ───────────────
  // Recalcula productosFiltrados según búsqueda, categoría,
  // oferta y stock, y los ordena según el criterio elegido.
  aplicarFiltros(): void {
    const texto = this.normalizar(this.textoBusqueda);

    this.productosFiltrados = this.productos
      .filter(p => {
        const coincideTexto     = !texto || this.normalizar(`${p.nombre} ${p.categoria} ${p.descripcion}`).includes(texto);
        const coincideCategoria = !this.categoriaSeleccionada || p.categoria === this.categoriaSeleccionada;
        const coincideOferta    = !this.soloOfertas || p.oferta;
        const coincideStock     = this.filtroStock === 'agotado' ? p.stock === 0
                                : this.filtroStock === 'bajo'    ? p.stock > 0 && p.stock < 5
                                : true;
        return coincideTexto && coincideCategoria && coincideOferta && coincideStock;
      })
      .sort((a, b) => {
        switch (this.orden) {
          case 'precio-asc':  return this.precioDe(a) - this.precioDe(b);
          case 'precio-desc': return this.precioDe(b) - this.precioDe(a);
          case 'stock':       return a.stock - b.stock;
          default:            return a.nombre.localeCompare(b.nombre, 'es');
        }
      });

    this.visibles = POR_PAGINA;
    this.cdr.detectChanges();
  }

  // ── MÉTODOS DE FILTRO ─────────────────────
  seleccionarCategoria(nombre: string): void {
    this.categoriaSeleccionada = this.categoriaSeleccionada === nombre ? '' : nombre;
    this.aplicarFiltros();
  }

  alternarOfertas(): void {
    this.soloOfertas = !this.soloOfertas;
    this.aplicarFiltros();
  }

  alternarStock(filtro: FiltroStock): void {
    this.filtroStock = this.filtroStock === filtro ? '' : filtro;
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.textoBusqueda = '';
    this.categoriaSeleccionada = '';
    this.soloOfertas = false;
    this.filtroStock = '';
    this.aplicarFiltros();
  }

  mostrarMas(): void {
    this.visibles += POR_PAGINA;
  }

  get hayFiltros(): boolean {
    return !!(this.textoBusqueda || this.categoriaSeleccionada || this.soloOfertas || this.filtroStock);
  }

  // ── CONTADORES ────────────────────────────
  cantidadEnCategoria(nombre: string): number {
    return this.productos.filter(p => p.categoria === nombre).length;
  }

  get cantidadOfertas(): number {
    return this.productos.filter(p => p.oferta).length;
  }

  get cantidadAgotados(): number {
    return this.productos.filter(p => p.stock === 0).length;
  }

  get cantidadStockBajo(): number {
    return this.productos.filter(p => p.stock > 0 && p.stock < 5).length;
  }

  // ── PRECIOS ───────────────────────────────
  // Calcula el precio con el descuento aplicado — ej: 1000 con 40% → 600
  precioFinal(precio: number, descuento: number): number {
    return precio - (precio * descuento / 100);
  }

  private precioDe(p: Producto): number {
    return p.oferta ? this.precioFinal(p.precio, p.descuento) : p.precio;
  }

  // ── PEDIDO A PROVEEDOR ────────────────────
  cantidadPedida(p: Producto): number {
    return this.pedidoService.cantidadDe(p);
  }

  agregarAlPedido(producto: Producto): void {
    this.pedidoService.agregar(producto);
    this.snackBar
      .open(`${producto.nombre} agregado al pedido`, 'Ver pedido', { duration: 2500, panelClass: 'snackbar--info' })
      .onAction()
      .subscribe(() => this.router.navigate(['/admin/pedidos']));
  }

  // Búsqueda sin tildes ni mayúsculas: "lacteos" encuentra "Lácteos"
  private normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
}
