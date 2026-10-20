// ── IMPORTS ──────────────────────────────────
import { Routes } from '@angular/router';
import { authGuard, adminGuard, noEsCajeroGuard, cajaGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  // ── RUTA RAÍZ ────────────────────────────────
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },

  // ── RUTAS PÚBLICAS (vista cliente) ───────────
  {
    path: 'inicio',
    loadComponent: () =>
      import('./features/cliente/inicio/inicio')
        .then(m => m.InicioComponent)
  },
  {
    path: 'catalogo',
    loadComponent: () =>
      import('./features/cliente/catalogo/catalogo')
        .then(m => m.CatalogoComponent)
  },
  {
    path: 'carrito',
    loadComponent: () =>
      import('./features/cliente/carrito/carrito')
        .then(m => m.CarritoComponent)
  },

  // ── RUTA LOGIN ────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./features/admin/login/login')
        .then(m => m.LoginComponent)
  },

  // ── DASHBOARD — todos los roles ───────────────
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard')
        .then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },

  // ── PRODUCTOS — todos los roles ───────────────
  {
    path: 'admin/productos',
    loadComponent: () =>
      import('./features/admin/productos/productos')
        .then(m => m.ProductosComponent),
    canActivate: [authGuard]
  },

  // ── RECEPCIONES — admin, empleado, repositor ──
  {
    path: 'admin/recepciones',
    loadComponent: () =>
      import('./features/admin/recepciones/recepciones')
        .then(m => m.RecepcionesComponent),
    canActivate: [authGuard, noEsCajeroGuard]
  },

  // ── CAJA — admin, cajero ──────────────────────
  {
    path: 'admin/caja',
    loadComponent: () =>
      import('./features/admin/caja/caja')
        .then(m => m.CajaComponent),
    canActivate: [authGuard, cajaGuard]
  },

  // ── ESTADÍSTICAS — solo admin ─────────────────
  {
    path: 'admin/estadisticas',
    loadComponent: () =>
      import('./features/admin/estadisticas/estadisticas')
        .then(m => m.EstadisticasComponent),
    canActivate: [authGuard, adminGuard]
  },

  // ── USUARIOS — solo admin ─────────────────────
  {
    path: 'admin/usuarios',
    loadComponent: () =>
      import('./features/admin/usuarios/usuarios')
        .then(m => m.UsuariosComponent),
    canActivate: [authGuard, adminGuard]
  },

  // ── MOVIMIENTOS — solo admin ──────────────────
  {
    path: 'admin/movimientos',
    loadComponent: () =>
      import('./features/admin/movimientos/movimientos')
        .then(m => m.MovimientosComponent),
    canActivate: [authGuard, adminGuard]
  },

  // ── RUTA COMODÍN ─────────────────────────────
  {
    path: '**',
    redirectTo: 'inicio'
  }
];