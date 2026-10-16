// ── IMPORTS ──────────────────────────────────
import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

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

  // ── RUTAS PRIVADAS (vista admin) ─────────────
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard')
        .then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/estadisticas',
    loadComponent: () =>
      import('./features/admin/estadisticas/estadisticas')
        .then(m => m.EstadisticasComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/productos',
    loadComponent: () =>
      import('./features/admin/productos/productos')
        .then(m => m.ProductosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/caja',
    loadComponent: () =>
      import('./features/admin/caja/caja')
        .then(m => m.CajaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/usuarios',
    loadComponent: () =>
      import('./features/admin/usuarios/usuarios')
        .then(m => m.UsuariosComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin/recepciones',
    loadComponent: () =>
      import('./features/admin/recepciones/recepciones')
        .then(m => m.RecepcionesComponent),
    canActivate: [authGuard]
  },

  // ── NUEVA RUTA: MOVIMIENTOS ───────────────────
  // Solo accesible para admin (adminGuard)
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