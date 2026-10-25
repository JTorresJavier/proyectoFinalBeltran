// ── IMPORTS ──────────────────────────────────
import { Component, inject } from '@angular/core'; // Decorador principal e inyección
import { AsyncPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router'; // Permite insertar páginas según la URL

import { routeAnimations } from './route-animations'; // Animación de transición entre páginas
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { NavbarComponent } from './shared/components/navbar/navbar';

// ── DECORADOR ────────────────────────────────
// Componente RAÍZ de Premium Market.
// Con sesión activa muestra el header interno arriba de cada
// pantalla; sin sesión solo queda el router-outlet (login).
@Component({
  selector: 'app-root',                     // Etiqueta usada en index.html
  imports: [RouterOutlet, AsyncPipe, NavbarComponent],
  templateUrl: './app.html',                // Vista del componente
  styleUrl: './app.css',                    // Estilos del componente
  animations: [routeAnimations]             // Transición entre páginas al navegar
})
export class AppComponent {
  constructor() {
    inject(ThemeService);
  }

  // Sesión reactiva: el header aparece y desaparece con el login/logout
  usuarioActual$ = inject(AuthService).usuarioActual$;

  title = 'Premium Market'; // Nombre de la aplicación
}
