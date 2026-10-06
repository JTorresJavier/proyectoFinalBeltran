// ── IMPORTS ──────────────────────────────────
import { Component, inject } from '@angular/core'; // Decorador principal e inyección
import { RouterOutlet } from '@angular/router'; // Permite insertar páginas según la URL

import { routeAnimations } from './route-animations'; // Animación de transición entre páginas
import { ThemeService } from './core/services/theme.service';

// ── DECORADOR ────────────────────────────────
// Componente RAÍZ de StoreHub.
// Es el primero en cargar. Solo contiene el router-outlet
// que actúa como contenedor de todas las páginas.
@Component({
  selector: 'app-root',                // Etiqueta usada en index.html
  imports: [RouterOutlet],             // Habilitamos el router
  templateUrl: './app.html',           // Vista del componente
  styleUrl: './app.css',               // Estilos del componente
  animations: [routeAnimations]        // Transición entre páginas al navegar
})

// ── CLASE ────────────────────────────────────
// Sin lógica propia — solo actúa como contenedor principal
export class AppComponent {
  constructor() {
    inject(ThemeService);
  }

  title = 'StoreHub'; // Nombre de la aplicación
}
