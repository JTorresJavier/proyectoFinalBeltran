// ── IMPORTS ──────────────────────────────────
import { Injectable, inject } from '@angular/core'; // Decorador e inyección
import { HttpClient } from '@angular/common/http';  // Para llamadas HTTP
import { Observable } from 'rxjs';                  // Para manejar respuestas asíncronas

// ── INTERFACE ────────────────────────────────
// Define la forma de un Producto — contrato de datos
export interface Producto {
  id?: string;         // Opcional — lo asigna MockAPI
  nombre: string;      // Nombre del producto
  categoria: string;   // Categoría
  precio: number;      // Precio en ARS
  stock: number;       // Cantidad disponible
  descripcion: string; // Descripción breve
  icono: string;       // Ícono de Material Icons
  oferta: boolean;     // Si está en oferta
  descuento: number;   // Porcentaje de descuento
}

// ── DECORADOR ────────────────────────────────
// Servicio que centraliza todas las llamadas HTTP
// relacionadas con productos hacia la API REST.
@Injectable({
  providedIn: 'root' // Disponible en toda la app (Singleton)
})
export class ProductosService {

  // ── CONFIGURACIÓN ─────────────────────────
  private http = inject(HttpClient); // Inyectamos HttpClient
  private apiUrl = 'https://6a9c3e100ad174e139e91cb8.mockapi.io/api/v1/productos'; // URL base

  // ── MÉTODOS CRUD ──────────────────────────

  // GET — Obtener todos los productos
  getAll(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  // GET — Obtener un producto por id
  getById(id: string): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  // POST — Crear un nuevo producto
  create(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, producto);
  }

  // PUT — Actualizar un producto existente
  update(id: string, producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, producto);
  }

  // DELETE — Eliminar un producto
  delete(id: string): Observable<Producto> {
    return this.http.delete<Producto>(`${this.apiUrl}/${id}`);
  }
}