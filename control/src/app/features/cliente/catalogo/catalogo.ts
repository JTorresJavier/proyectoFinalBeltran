// ── IMPORTS BASE ──────────────────────────────
import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Pipes y directivas comunes
import { FormsModule  } from '@angular/forms';  // ngModel para búsqueda y filtros

// ── ANGULAR MATERIAL ──────────────────────────
import { MatCardModule            } from '@angular/material/card';
import { MatButtonModule          } from '@angular/material/button';
import { MatIconModule            } from '@angular/material/icon';
import { MatInputModule           } from '@angular/material/input';
import { MatFormFieldModule       } from '@angular/material/form-field';
import { MatSelectModule          } from '@angular/material/select';
import { MatChipsModule           } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule           } from '@angular/material/badge';

// ── COMPONENTES PROPIOS ───────────────────────
import { NavbarComponent } from '../../../shared/components/navbar/navbar';

// ── SERVICIOS ─────────────────────────────────
import { ProductosService, Producto } from '../../../core/services/productos.service';

// ── DECORADOR ────────────────────────────────
// Página de catálogo del cliente.
// Muestra todos los productos con búsqueda, chips de categoría y filtro de oferta.
@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    NavbarComponent,
  ],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})

// ── CLASE ────────────────────────────────────
export class CatalogoComponent implements OnInit {

  // ── SERVICIOS INYECTADOS ──────────────────
  private productosService = inject(ProductosService);  // API REST de productos
  private cdr              = inject(ChangeDetectorRef); // Fuerza actualización de la vista
  private ngZone           = inject(NgZone);            // Zona Angular para detectar cambios HTTP

  // ── ESTADO ────────────────────────────────
  productos: Producto[]         = [];  // Lista completa de productos (original, sin filtrar)
  productosFiltrados: Producto[] = []; // Lista visible con filtros aplicados (array real, no getter)
  cargando: boolean             = false; // Spinner mientras carga la API

  // ── FILTROS ───────────────────────────────
  // Se actualizan desde el template con ngModel
  private _textoBusqueda: string = '';
  private _categoriaSeleccionada: string = '';
  private _soloOfertas: boolean = false;

  // ── GETTERS/SETTERS DE FILTROS ────────────
  // Cada setter aplica los filtros automáticamente al cambiar el valor

  get textoBusqueda(): string { return this._textoBusqueda; }
  set textoBusqueda(v: string) {
    this._textoBusqueda = v;
    this.aplicarFiltros(); // Re-filtra al cambiar el texto
  }

  get categoriaSeleccionada(): string { return this._categoriaSeleccionada; }
  set categoriaSeleccionada(v: string) {
    this._categoriaSeleccionada = v;
    this.aplicarFiltros(); // Re-filtra al cambiar la categoría
  }

  get soloOfertas(): boolean { return this._soloOfertas; }
  set soloOfertas(v: boolean) {
    this._soloOfertas = v;
    this.aplicarFiltros(); // Re-filtra al togglear ofertas
  }

  // ── CATEGORÍAS CON ÍCONO ─────────────────
  // Lista de categorías con su ícono de Material Icons para los chips
  categorias = [
    { nombre: 'Bebidas',    icono: 'local_bar'         },
    { nombre: 'Snacks',     icono: 'fastfood'          },
    { nombre: 'Lácteos',    icono: 'egg'               },
    { nombre: 'Limpieza',   icono: 'cleaning_services' },
    { nombre: 'Golosinas',  icono: 'cake'              },
    { nombre: 'Fiambres',   icono: 'lunch_dining'      },
    { nombre: 'Carnes',     icono: 'kebab_dining'      },
  ];

  // ── LIFECYCLE: ngOnInit ───────────────────
  // Carga todos los productos al inicializar.
  // Usa NgZone.run() + detectChanges() para que Angular
  // detecte los cambios que llegan desde HTTP
  ngOnInit(): void {
    this.cargando = true;
    this.productosService.getAll().subscribe({
      next: (productos) => {
        this.ngZone.run(() => {
          this.productos = productos;       // Guarda la lista completa
          this.aplicarFiltros();            // Llena productosFiltrados (= todos al inicio)
          this.cargando  = false;           // Oculta el spinner
          this.cdr.detectChanges();         // Fuerza la actualización de la vista
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Error cargando productos:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── MÉTODO: APLICAR FILTROS ───────────────
  // Recalcula productosFiltrados según los filtros activos.
  // Se llama desde los setters y desde ngOnInit cuando llegan los datos.
  aplicarFiltros(): void {
    this.productosFiltrados = this.productos.filter(p => {
      const coincideTexto     = p.nombre.toLowerCase()
                                  .includes(this._textoBusqueda.toLowerCase());
      const coincideCategoria = this._categoriaSeleccionada
                                  ? p.categoria === this._categoriaSeleccionada
                                  : true;
      const coincideOferta    = this._soloOfertas ? p.oferta : true;
      return coincideTexto && coincideCategoria && coincideOferta;
    });
    this.cdr.detectChanges(); // Actualiza la vista tras cada filtrado
  }

  // ── MÉTODO: CANTIDAD POR CATEGORÍA ────────
  // Devuelve cuántos productos hay en una categoría (para el badge del chip)
  cantidadEnCategoria(nombre: string): number {
    return this.productos.filter(p => p.categoria === nombre).length;
  }

  // ── GETTER: CANTIDAD DE OFERTAS ───────────
  // Devuelve cuántos productos tienen oferta activa
  get cantidadOfertas(): number {
    return this.productos.filter(p => p.oferta).length;
  }

  // ── MÉTODO: SELECCIONAR CATEGORÍA ────────
  // Alterna la categoría activa; si ya está activa, la deselecciona
  seleccionarCategoria(nombre: string): void {
    this.categoriaSeleccionada = this._categoriaSeleccionada === nombre ? '' : nombre;
  }

  // ── MÉTODO: PRECIO FINAL ─────────────────
  // Calcula el precio con el descuento aplicado — ej: 1000 con 40% → 600
  precioFinal(precio: number, descuento: number): number {
    return precio - (precio * descuento / 100);
  }

  // ── MÉTODO: LIMPIAR FILTROS ───────────────
  // Resetea búsqueda, categoría y flag de oferta
  limpiarFiltros(): void {
    this._textoBusqueda         = '';
    this._categoriaSeleccionada = '';
    this._soloOfertas           = false;
    this.aplicarFiltros();
  }
}