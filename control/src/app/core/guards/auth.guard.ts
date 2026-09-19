// ── IMPORTS ──────────────────────────────────
import { inject } from '@angular/core';           // Para inyectar servicios
import { CanActivateFn, Router } from '@angular/router'; // Tipo del guard y router

// ── SERVICIOS ─────────────────────────────────
import { AuthService } from '../services/auth.service'; // Servicio de autenticación

// ── GUARD GENERAL: estaLogueado ───────────────
// Protege rutas que requieren login.
// Si no hay sesión → redirige al login.
export const authGuard: CanActivateFn = (route, state) => {

  // Inyectamos los servicios necesarios
  const authService = inject(AuthService); // Servicio de auth
  const router = inject(Router);           // Router para redirigir

  // Verificamos si hay sesión activa
  if (authService.estaLogueado()) {
    return true; // Tiene sesión → puede acceder
  }

  // No tiene sesión → redirige al login
  router.navigate(['/login']);
  return false;
};

// ── GUARD DE ADMIN ────────────────────────────
// Protege rutas que requieren rol de administrador.
// Si no es admin → redirige al dashboard.
export const adminGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificamos si es admin
  if (authService.esAdmin()) {
    return true; // Es admin → puede acceder
  }

  // No es admin → redirige al dashboard
  router.navigate(['/admin/dashboard']);
  return false;
};