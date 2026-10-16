import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// ── INTERCEPTOR DE AUTENTICACIÓN ──────────────────────────────────────
// Agrega automáticamente los headers de usuario en cada request HTTP.
// El backend los usa para saber quién hizo cada acción (auditoría).
//
// Headers que agrega:
//   x-usuario     → nombre de usuario logueado
//   x-rol         → rol del usuario
//   x-usuario-id  → _id de MongoDB
//
// Registrar en app.config.ts:
//   provideHttpClient(withInterceptors([authInterceptor]))
// ─────────────────────────────────────────────────────────────────────
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const usuario     = authService.obtenerUsuario();

  if (usuario) {
    const reqConHeaders = req.clone({
      setHeaders: {
        'x-usuario':    usuario.usuario || '',
        'x-rol':        usuario.rol     || '',
        'x-usuario-id': (usuario as any)._id || ''
      }
    });
    return next(reqConHeaders);
  }

  return next(req);
};