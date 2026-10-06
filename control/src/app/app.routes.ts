// ── IMPORTS ──────────────────────────────────
import { Routes } from '@angular/router';                    // Tipo Routes
import { authGuard, adminGuard } from './core/guards/auth.guard'; // Guards de protección

// ── RUTAS PÚBLICAS Y PRIVADAS ─────────────────
// Define la navegación completa de StoreHub.
// Las rutas usan Lazy Loading — se cargan solo cuando se necesitan.
// Las rutas de admin están protegidas por guards.
export const routes: Routes = [

  // ── RUTA RAÍZ ────────────────────────────────
  // Redirige la URL vacía al inicio del cliente
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },

  // ── RUTAS PÚBLICAS (vista cliente) ───────────
  // Accesibles sin login
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

  // ── RUTA LOGIN ────────────────────────────────
  // Accesible sin login — puerta de entrada al admin
  {
    path: 'login',
    loadComponent: () =>
      import('./features/admin/login/login')
        .then(m => m.LoginComponent)
  },

  // ── RUTAS PRIVADAS (vista admin) ─────────────
  // Protegidas por authGuard — requieren login
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard')
        .then(m => m.DashboardComponent),
    canActivate: [authGuard] // Solo si está logueado
  },
  {
    path: 'admin/productos',
    loadComponent: () =>
      import('./features/admin/productos/productos')
        .then(m => m.ProductosComponent),
    canActivate: [authGuard] // Solo si está logueado
  },
  {
    path: 'admin/caja',
    loadComponent: () =>
      import('./features/admin/caja/caja')
        .then(m => m.CajaComponent),
    canActivate: [authGuard] // Solo si está logueado
  },

  {
    path: 'admin/usuarios',
    loadComponent: () =>
      import('./features/admin/usuarios/usuarios')
        .then(m => m.UsuariosComponent),
    canActivate: [authGuard, adminGuard] // Logueado Y además admin
  },
  
  {
    path: 'admin/recepciones',
    loadComponent: () =>
      import('./features/admin/recepciones/recepciones')
        .then(m => m.RecepcionesComponent),
    canActivate: [authGuard] // Logueado — cualquier rol puede recepcionar mercadería
  },

  // ── RUTA COMODÍN ─────────────────────────────
  // Cualquier URL no definida redirige al inicio
  {
    path: '**',
    redirectTo: 'inicio'
  }
];