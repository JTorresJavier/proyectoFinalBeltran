// ── IMPORTS ──────────────────────────────────
import { Component } from '@angular/core';     // Decorador principal de Angular
import { RouterOutlet } from '@angular/router'; // Permite insertar páginas según la URL

// ── DECORADOR ────────────────────────────────
// Componente RAÍZ de StoreHub.
// Es el primero en cargar. Solo contiene el router-outlet
// que actúa como contenedor de todas las páginas.
@Component({
  selector: 'app-root',                // Etiqueta usada en index.html
  imports: [RouterOutlet],             // Habilitamos el router
  templateUrl: './app.html',           // Vista del componente
  styleUrl: './app.css'                // Estilos del componente
})

// ── CLASE ────────────────────────────────────
// Sin lógica propia — solo actúa como contenedor principal
export class AppComponent {
  title = 'StoreHub'; // Nombre de la aplicación
}