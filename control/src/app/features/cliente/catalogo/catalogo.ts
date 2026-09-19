// ── IMPORTS ──────────────────────────────────
import { Component, OnInit, inject } from '@angular/core'; // Component, lifecycle hook e inject
import { CommonModule } from '@angular/common';             // Directivas ngIf, ngFor
import { FormsModule } from '@angular/forms';              // Para ngModel en el buscador

// ── ANGULAR MATERIAL ──────────────────────────
import { MatCardModule } from '@angular/material/card';           // Cards de productos
import { MatButtonModule } from '@angular/material/button';       // Botones Material
import { MatIconModule } from '@angular/material/icon';           // Íconos Material
import { MatInputModule } from '@angular/material/input';         // Input del buscador
import { MatFormFieldModule } from '@angular/material/form-field';// Campo de formulario
import { MatSelectModule } from '@angular/material/select';       // Select de categorías
import { MatChipsModule } from '@angular/material/chips';         // Chips de filtros
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Loading

// ── COMPONENTES COMPARTIDOS ───────────────────
import { NavbarComponent } from '../../../shared/components/navbar/navbar'; // Navbar

// ── INTERFACE ────────────────────────────────
// Define la forma de un producto
interface Producto {
  id: number;          // Identificador único
  nombre: string;      // Nombre del producto
  categoria: string;   // Categoría del producto
  precio: number;      // Precio en ARS
  stock: number;       // Cantidad disponible
  descripcion: string; // Descripción breve
  icono: string;       // Ícono de Material Icons
}

// ── DECORADOR ────────────────────────────────
// Página de catálogo — vista del CLIENTE.
// Muestra todos los productos con buscador y filtro por categoría.
@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,              // Para [(ngModel)] en el buscador
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    NavbarComponent,
  ],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})

// ── CLASE ────────────────────────────────────
// Lógica de la página de catálogo
export class CatalogoComponent implements OnInit {

  // ── DATOS DE PRODUCTOS ────────────────────
  // Lista completa de productos (luego vendrá de la API)
  productos: Producto[] = [
    { id: 1, nombre: 'Coca Cola 2.25L',    categoria: 'Bebidas',   precio: 1500, stock: 20, descripcion: 'Bebida gaseosa',        icono: 'local_drink'       },
    { id: 2, nombre: 'Pepsi 2.25L',        categoria: 'Bebidas',   precio: 1400, stock: 15, descripcion: 'Bebida gaseosa',        icono: 'local_drink'       },
    { id: 3, nombre: 'Papas Fritas 100g',  categoria: 'Snacks',    precio: 800,  stock: 30, descripcion: 'Snack salado',          icono: 'fastfood'          },
    { id: 4, nombre: 'Yogur x4',           categoria: 'Lácteos',   precio: 1200, stock: 10, descripcion: 'Yogur frutado',         icono: 'icecream'          },
    { id: 5, nombre: 'Detergente 750ml',   categoria: 'Limpieza',  precio: 950,  stock: 25, descripcion: 'Detergente líquido',    icono: 'cleaning_services' },
    { id: 6, nombre: 'Alfajor Doble',      categoria: 'Golosinas', precio: 450,  stock: 50, descripcion: 'Alfajor de chocolate',  icono: 'cake'              },
    { id: 7, nombre: 'Jamón Cocido 200g',  categoria: 'Fiambres',  precio: 1800, stock: 8,  descripcion: 'Jamón cocido feteado',  icono: 'lunch_dining'      },
    { id: 8, nombre: 'Agua Mineral 1.5L',  categoria: 'Bebidas',   precio: 600,  stock: 40, descripcion: 'Agua sin gas',          icono: 'water_drop'        },
  ];

  // ── FILTROS ───────────────────────────────
  textoBusqueda: string = '';    // Texto del buscador — vinculado con [(ngModel)]
  categoriaSeleccionada: string = ''; // Categoría seleccionada en el select

  // ── CATEGORÍAS ────────────────────────────
  // Lista de categorías para el filtro
  categorias: string[] = ['Bebidas', 'Snacks', 'Lácteos', 'Limpieza', 'Golosinas', 'Fiambres'];

  // ── LIFECYCLE HOOK ────────────────────────
  // Se ejecuta al inicializar el componente
  ngOnInit(): void {
    // Aquí luego cargaremos los productos desde la API
    console.log('Catálogo iniciado');
  }

  // ── GETTER: PRODUCTOS FILTRADOS ───────────
  // Filtra los productos según el texto de búsqueda y la categoría
  // Se recalcula automáticamente cuando cambian los filtros
  get productosFiltrados(): Producto[] {
    return this.productos.filter(p => {
      // Filtra por texto — sin distinguir mayúsculas
      const coincideTexto = p.nombre.toLowerCase()
        .includes(this.textoBusqueda.toLowerCase());
      // Filtra por categoría — si no hay categoría seleccionada muestra todos
      const coincideCategoria = this.categoriaSeleccionada
        ? p.categoria === this.categoriaSeleccionada
        : true;
      return coincideTexto && coincideCategoria; // Ambos filtros deben cumplirse
    });
  }

  // ── MÉTODO: LIMPIAR FILTROS ───────────────
  // Resetea el buscador y la categoría seleccionada
  limpiarFiltros(): void {
    this.textoBusqueda = '';
    this.categoriaSeleccionada = '';
  }
}