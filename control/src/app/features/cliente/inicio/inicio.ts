// ── IMPORTS ──────────────────────────────────
import { Component } from '@angular/core';        // Decorador principal
import { CommonModule } from '@angular/common';   // Directivas ngIf, ngFor
import { RouterLink } from '@angular/router';     // Navegación entre rutas

// ── ANGULAR MATERIAL ──────────────────────────
import { MatButtonModule } from '@angular/material/button'; // Botones Material
import { MatCardModule } from '@angular/material/card';     // Cards Material
import { MatIconModule } from '@angular/material/icon';     // Íconos Material
import { MatChipsModule } from '@angular/material/chips';   // Chips para categorías

// ── COMPONENTES COMPARTIDOS ───────────────────
import { NavbarComponent } from '../../../shared/components/navbar/navbar'; // Navbar

// ── DECORADOR ────────────────────────────────
// Página principal de StoreHub — vista del CLIENTE.
// Muestra: navbar, banner de bienvenida y sección de ofertas.
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    CommonModule,      // Para @if, @for
    RouterLink,        // Para navegar al catálogo
    MatButtonModule,   // Botones Material
    MatCardModule,     // Cards de ofertas
    MatIconModule,     // Íconos
    MatChipsModule,    // Chips de categorías
    NavbarComponent,   // Navbar compartido
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})

// ── CLASE ────────────────────────────────────
// Lógica de la página de inicio
export class InicioComponent {

  // ── DATOS DEL BANNER ──────────────────────
  // Texto principal que ve el cliente al entrar
  nombreTienda: string = 'StoreHub';
  slogan: string = 'Todo lo que necesitás, en un solo lugar';

  // ── CATEGORÍAS DESTACADAS ─────────────────
  // Se muestran como chips en el inicio
  categorias: string[] = [
    'Bebidas', 'Snacks', 'Lácteos',
    'Limpieza', 'Golosinas', 'Fiambres'
  ];

  // ── OFERTAS DEL DÍA ───────────────────────
  // Productos destacados mostrados en cards
  ofertas = [
    { nombre: 'Coca Cola 2.25L',  precio: 1500, descuento: 15, icono: 'local_drink'    },
    { nombre: 'Papas Fritas',     precio: 800,  descuento: 20, icono: 'fastfood'       },
    { nombre: 'Yogur x4',         precio: 1200, descuento: 10, icono: 'icecream'       },
    { nombre: 'Detergente 750ml', precio: 950,  descuento: 25, icono: 'cleaning_services' },
  ];

  // ── MÉTODO: PRECIO CON DESCUENTO ──────────
  // Calcula el precio final aplicando el descuento
  precioFinal(precio: number, descuento: number): number {
    return precio - (precio * descuento / 100);
  }
}