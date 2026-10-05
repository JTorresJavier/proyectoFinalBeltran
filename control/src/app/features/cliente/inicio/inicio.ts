// ── IMPORTS BASE ──────────────────────────────
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Pipes y directivas comunes

// ── ROUTER ────────────────────────────────────
import { RouterLink } from '@angular/router'; // Links de navegación entre rutas

// ── ANGULAR MATERIAL ──────────────────────────
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule   } from '@angular/material/card';
import { MatIconModule   } from '@angular/material/icon';
import { MatChipsModule  } from '@angular/material/chips';

// ── COMPONENTES PROPIOS ───────────────────────
import { NavbarComponent } from '../../../shared/components/navbar/navbar';

// ── SERVICIOS ─────────────────────────────────
import { ProductosService, Producto } from '../../../core/services/productos.service';

// ── DECORADOR ────────────────────────────────
// Página de inicio del cliente.
// Estructura: Hero Carrusel → Stats → Categorías → Ofertas → CTA → Beneficios → Footer
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    NavbarComponent,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})

// ── CLASE ────────────────────────────────────
export class InicioComponent implements OnInit, OnDestroy {

  // ── SERVICIOS INYECTADOS ──────────────────
  private productosService = inject(ProductosService);  // API REST de productos
  private cdr              = inject(ChangeDetectorRef); // Fuerza actualización de la vista
  private ngZone           = inject(NgZone);            // Zona Angular para detectar cambios de HTTP

  // ── ESTADO GENERAL ────────────────────────
  nombreTienda: string   = 'StoreHub';                           // Nombre de la tienda
  slogan: string         = 'Todo lo que necesitás, en un solo lugar'; // Slogan visible en el hero
  ofertas: Producto[]    = [];   // Productos filtrados con oferta:true (máx. 6)
  totalProductos: number = 0;   // Cantidad total de productos (para las stats)

  // ── CARRUSEL HERO ─────────────────────────
  heroActivo: number  = 0;        // Índice del slide del hero visible actualmente
  heroTotal:  number  = 3;        // Total de slides del hero (fijo)
  private heroTimer:  any;        // Timer del auto-avance del hero carrusel

  // ── CATEGORÍAS CON ÍCONO ─────────────────
  // Lista de categorías con su ícono de Material Icons
  categoriasConIcono = [
    { nombre: 'Bebidas',    icono: 'local_bar'         },
    { nombre: 'Snacks',     icono: 'fastfood'          },
    { nombre: 'Lácteos',    icono: 'egg'               },
    { nombre: 'Limpieza',   icono: 'cleaning_services' },
    { nombre: 'Golosinas',  icono: 'cake'              },
    { nombre: 'Fiambres',   icono: 'lunch_dining'      },
  ];

  // Lista de nombres de categorías (para las stats de la barra)
  categorias: string[] = this.categoriasConIcono.map(c => c.nombre);

  // ── BENEFICIOS ────────────────────────────
  // Cards de "Por qué elegirnos" con ícono, color y texto
  beneficios = [
    {
      icono: 'verified',
      titulo: 'Productos de calidad',
      descripcion: 'Seleccionamos los mejores productos para vos.',
      color: '#1976d2'
    },
    {
      icono: 'update',
      titulo: 'Stock actualizado',
      descripcion: 'El stock se actualiza en tiempo real con cada venta.',
      color: '#43a047'
    },
    {
      icono: 'local_offer',
      titulo: 'Ofertas diarias',
      descripcion: 'Descuentos frescos todos los días en productos seleccionados.',
      color: '#e53935'
    },
    {
      icono: 'storefront',
      titulo: 'Atención personalizada',
      descripcion: 'Te atendemos con la calidez de un negocio de barrio.',
      color: '#fb8c00'
    },
  ];

  // ── LIFECYCLE: ngOnInit ───────────────────
  // Carga las ofertas e inicia el auto-avance del hero
  ngOnInit(): void {
    this.cargarOfertas();
    this.iniciarHeroTimer();
  }

  // ── LIFECYCLE: ngOnDestroy ────────────────
  // Limpia el timer del hero para evitar memory leaks
  ngOnDestroy(): void {
    if (this.heroTimer) clearInterval(this.heroTimer);
  }

  // ── MÉTODO: CARGAR OFERTAS ────────────────
  // GET — Trae todos los productos, guarda el total
  // y filtra los que tienen oferta:true (máx. 6).
  // Usa NgZone + detectChanges para forzar la actualización de la vista
  cargarOfertas(): void {
    this.productosService.getAll().subscribe({
      next: (productos) => {
        this.ngZone.run(() => {
          this.totalProductos = productos.length;                          // Total para stats
          this.ofertas        = productos.filter(p => p.oferta).slice(0, 6); // Máx. 6 en oferta
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Error cargando ofertas:', err);
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── MÉTODO: INICIAR TIMER DEL HERO ───────
  // Auto-avanza el hero cada 5 segundos y vuelve al inicio
  iniciarHeroTimer(): void {
    if (this.heroTimer) clearInterval(this.heroTimer);
    this.heroTimer = setInterval(() => {
      this.ngZone.run(() => {
        this.heroActivo = this.heroActivo >= this.heroTotal - 1 ? 0 : this.heroActivo + 1;
        this.cdr.detectChanges();
      });
    }, 5000); // 5 segundos entre slides del hero
  }

  // ── MÉTODO: MOVER HERO ───────────────────
  // Avanza (+1) o retrocede (-1) el hero manualmente; reinicia el timer
  moverHero(direccion: number): void {
    if (this.heroTimer) clearInterval(this.heroTimer);
    this.heroActivo = Math.max(0, Math.min(this.heroTotal - 1, this.heroActivo + direccion));
    this.iniciarHeroTimer();
  }

  // ── MÉTODO: IR A SLIDE DEL HERO ──────────
  // Navega directo a un slide del hero por índice (para los dots)
  irAHeroSlide(index: number): void {
    if (this.heroTimer) clearInterval(this.heroTimer);
    this.heroActivo = index;
    this.iniciarHeroTimer();
  }

  // ── MÉTODO: SCROLL A OFERTAS ─────────────
  // Hace scroll suave hasta la sección de ofertas
  scrollOfertas(): void {
    document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth' });
  }

  // ── MÉTODO: PRECIO FINAL ─────────────────
  // Calcula el precio con descuento — ej: 1000 con 40% → 600
  precioFinal(precio: number, descuento: number): number {
    return precio - (precio * descuento / 100);
  }
}