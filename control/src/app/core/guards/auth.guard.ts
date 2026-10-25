// ── IMPORTS ──────────────────────────────────
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// ── GUARD: LOGIN ──────────────────────────────
// Protege todas las rutas admin.
// Sin sesión activa → redirige al login.
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (authService.estaLogueado()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

// ── GUARD: SOLO SIN SESIÓN ────────────────────
// Ruta: login. Si ya hay sesión, no tiene sentido volver
// a loguearse → redirige al portal de inicio.
export const invitadoGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (!authService.estaLogueado()) {
    return true;
  }

  return router.createUrlTree(['/inicio']);
};

// ── GUARD: SOLO ADMIN ─────────────────────────
// Rutas: estadisticas, usuarios, movimientos
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (authService.esAdmin()) {
    return true;
  }

  router.navigate(['/admin/dashboard']);
  return false;
};

// ── GUARD: ADMIN + EMPLEADO + REPOSITOR ───────
// Rutas: recepciones (cajero NO puede entrar)
export const noEsCajeroGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  const usuario = authService.obtenerUsuario();
  const rol = usuario?.rol;

  if (rol === 'admin' || rol === 'empleado' || rol === 'repositor') {
    return true;
  }

  router.navigate(['/admin/dashboard']);
  return false;
};

// ── GUARD: ADMIN + CAJERO ─────────────────────
// Rutas: caja (empleado y repositor NO pueden entrar)
export const cajaGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  const usuario = authService.obtenerUsuario();
  const rol = usuario?.rol;

  if (rol === 'admin' || rol === 'cajero') {
    return true;
  }

  router.navigate(['/admin/dashboard']);
  return false;
};
