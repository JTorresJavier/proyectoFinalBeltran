// ── IMPORTS ──────────────────────────────────
import { ApplicationConfig } from '@angular/core';              // Configuración principal
import { provideRouter } from '@angular/router';                // Proveedor del router
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';       // Proveedor de HttpClient para API REST
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'; // Animaciones de Angular Material

import { routes } from './app.routes'; // Nuestras rutas definidas en app.routes.ts

// ── CONFIGURACIÓN PRINCIPAL ───────────────────
// Registra todos los servicios globales de StoreHub
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),        // Registra las rutas de la app
    provideHttpClient(withInterceptors([authInterceptor])),          // Habilita HttpClient para la API REST
    provideAnimationsAsync(),     // Habilita animaciones de Angular Material
  ]
};
