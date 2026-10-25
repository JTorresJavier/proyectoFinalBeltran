// ── IMPORTS ──────────────────────────────────
import { Routes } from '@angular/router';
import { authGuard, adminGuard, noEsCajeroGuard, cajaGuard, invitadoGuard } from './core/guards/auth.guard';

// Premium Market es una herramienta interna: todas las pantallas
// piden sesión y la URL raíz lleva al login (o al inicio si ya hay sesión).
export const routes: Routes = [

  // ── RUTA RAÍZ ────────────────────────────────
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },

  // ── RUTA LOGIN ────────────────────────────────
  // Única pantalla sin sesión; con sesión activa redirige al inicio
  {
    path: 'login',
    loadComponent: () =>
      import('./features/admin/login/login')
        .then(m => m.LoginComponent),
    canActivate: [invitadoGuard]
  },

  // ── OPERACIÓN DIARIA — todos los roles ───────
  // Portal con promos vigentes y consulta de precios y stock
  {
    path: 'inicio',
    loadComponent: () =>
      import('./features/operacion/inicio/inicio')
        .then(m => m.InicioComponent),
    canActivate: [authGuard]
  },
  {
    path: 'catalogo',
    loadComponent: () =>
      import('./features/operacion/catalogo/catalogo')
        .then(m => m.CatalogoComponent),
    canActivate: [authGuard]
  },

  // ── PEDIDOS A PROVEEDOR — admin, empleado, repositor ──
  {
    path: 'admin/pedidos',
    loadComponent: () =>
      import('./features/admin/pedidos/pedidos')
        .then(m => m.PedidosComponent),
    canActivate: [authGuard, noEsCajeroGuard]
  },
  { path: 'carrito', redirectTo: 'admin/pedidos' },

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
