// ── IMPORTS ──────────────────────────────────
import { bootstrapApplication } from '@angular/platform-browser'; // Arranca la app standalone
import { AppComponent } from './app/app';                         // Componente raíz
import { appConfig } from './app/app.config';                     // Configuración principal

// ── INICIO DE LA APLICACIÓN ───────────────────
// Arranca StoreHub con el componente raíz y la configuración
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err)); // Muestra errores en consola si falla
