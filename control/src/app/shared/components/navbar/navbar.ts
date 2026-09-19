// ── IMPORTS ──────────────────────────────────
import { Component, inject } from '@angular/core'; // Component e inject para DI
import { RouterLink, RouterLinkActive } from '@angular/router'; // Navegación entre rutas
import { CommonModule } from '@angular/common'; // Directivas ngIf, ngFor, etc.

// ── ANGULAR MATERIAL ──────────────────────────
import { MatToolbarModule } from '@angular/material/toolbar'; // Barra de navegación
import { MatButtonModule } from '@angular/material/button';   // Botones Material
import { MatIconModule } from '@angular/material/icon';       // Íconos Material

// ── DECORADOR ────────────────────────────────
// Componente compartido — se usa en todas las páginas.
// Muestra el logo, links de navegación y botón de admin.
@Component({
  selector: 'app-navbar',        // Se usa como <app-navbar> en cada página
  standalone: true,
  imports: [
    CommonModule,       // Para @if, @for
    RouterLink,         // Para navegar entre rutas
    RouterLinkActive,   // Para marcar el link activo
    MatToolbarModule,   // Toolbar de Material
    MatButtonModule,    // Botones de Material
    MatIconModule,      // Íconos de Material
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})

// ── CLASE ────────────────────────────────────
// Lógica del navbar — links públicos y acceso al admin
export class NavbarComponent {

  // ── LINKS DEL MENÚ ────────────────────────
  // Array de links que se muestran en el navbar con @for
  linksCliente = [
    { label: 'Inicio',    ruta: '/inicio'   }, // Link a la página principal
    { label: 'Catálogo',  ruta: '/catalogo' }, // Link al catálogo de productos
  ];
}