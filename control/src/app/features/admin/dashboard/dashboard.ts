// ── IMPORTS ──────────────────────────────────
import { ChangeDetectorRef, Component, OnInit, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';             // Directivas ngIf, ngFor
import { Router, RouterLink } from '@angular/router';       // Navegación entre rutas

// ── ANGULAR MATERIAL ──────────────────────────
import { MatCardModule } from '@angular/material/card';         // Cards de resumen
import { MatButtonModule } from '@angular/material/button';     // Botones Material
import { MatIconModule } from '@angular/material/icon';         // Íconos Material
import { MatDividerModule } from '@angular/material/divider';   // Separadores
import { MatListModule } from '@angular/material/list';         // Listas Material
import { MatChipsModule } from '@angular/material/chips';       // Chip de rol
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Spinner de carga

// ── SERVICIOS ─────────────────────────────────
import { AuthService, Usuario } from '../../../core/services/auth.service';
import { ProductosService } from '../../../core/services/productos.service';
import { DolarService, Cotizacion } from '../../../core/services/dolar.service';

// ── DECORADOR ────────────────────────────────
// Página principal del panel de administración.
// Muestra resumen del negocio y accesos rápidos.
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})

// ── CLASE ────────────────────────────────────
export class DashboardComponent implements OnInit {

  // ── SERVICIOS INYECTADOS ──────────────────
  private authService      = inject(AuthService);
  private productosService = inject(ProductosService);
  private dolarService      = inject(DolarService);
  private router           = inject(Router);
  private cdr               = inject(ChangeDetectorRef); // Detección de cambios
  private ngZone             = inject(NgZone);            // Zona de Angular

  // ── DATOS DEL USUARIO ─────────────────────
  usuarioLogueado: Usuario | null = null;

  // ── ESTADÍSTICAS ──────────────────────────
  totalProductos: number = 0; // Total de productos
  stockBajo: number      = 0; // Productos con stock menor a 5
  enOferta: number       = 0; // Productos en oferta
  sinStock: number       = 0; // Productos sin stock
  
  // ── COTIZACIÓN DEL DÓLAR ──────────────────
  // Se consume desde una API externa (DolarAPI) — fuente de datos
  // relacionada a la temática del negocio (precios en pesos).
  dolarOficial: Cotizacion | undefined = undefined; // Cotización actual
  cargandoDolar: boolean               = true;      // Spinner mientras carga
  errorDolar: boolean                  = false;      // Si falló la consulta

  // ── ACCESOS RÁPIDOS ───────────────────────
  accesos = [
    { label: 'Gestión de Productos', icono: 'inventory_2',     ruta: '/admin/productos', roles: ['admin', 'repositor'] },
    { label: 'Caja',                 icono: 'point_of_sale',   ruta: '/admin/caja',      roles: ['admin', 'empleado']  },
    { label: 'Usuarios',             icono: 'manage_accounts', ruta: '/admin/usuarios',  roles: ['admin']              },
  ];

  // ── LIFECYCLE HOOK ────────────────────────
  ngOnInit(): void {
    this.usuarioLogueado = this.authService.obtenerUsuario();
    this.cargarEstadisticas();
    this.cargarCotizacionDolar();
  }

  // ── MÉTODO: CARGAR ESTADÍSTICAS ───────────
    cargarEstadisticas(): void {
    this.productosService.getAll().subscribe({
      next: (productos) => {
        this.ngZone.run(() => {
          this.totalProductos = productos.length;
          this.stockBajo      = productos.filter(p => p.stock > 0 && p.stock < 5).length;
          this.enOferta       = productos.filter(p => p.oferta).length;
          this.sinStock       = productos.filter(p => p.stock === 0).length;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Error:', err);
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── MÉTODO: CARGAR COTIZACIÓN DEL DÓLAR ───
  // Consume la API externa DolarAPI (fuente de datos externa
  // relacionada a la temática del negocio).
    cargarCotizacionDolar(): void {
    this.cargandoDolar = true;
    this.dolarService.getDolarOficial().subscribe({
      next: (cotizacion) => {
        this.ngZone.run(() => {
          this.dolarOficial  = cotizacion;
          this.cargandoDolar = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Error cargando cotización del dólar:', err);
          this.errorDolar    = true;
          this.cargandoDolar = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── MÉTODO: PUEDE ACCEDER ─────────────────
  puedeAcceder(roles: string[]): boolean {
    return roles.includes(this.usuarioLogueado?.rol || '');
  }

  // ── MÉTODO: LOGOUT ────────────────────────
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}