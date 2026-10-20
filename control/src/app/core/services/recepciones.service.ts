// ── IMPORTS ──────────────────────────────────
import { Injectable, inject } from '@angular/core'; // Decorador e inyección
import { HttpClient } from '@angular/common/http';  // Para llamadas HTTP
import { Observable } from 'rxjs';                  // Para manejar respuestas asíncronas

// ── INTERFACE ────────────────────────────────
// Define la forma de una Recepción — contrato de datos
export interface Recepcion {
  _id?: string;           // MongoDB asigna este id
  producto: string;        // _id del producto al que se le suma stock
  productoNombre: string;  // Nombre del producto (para mostrar sin buscar)
  cantidad: number;        // Cantidad recibida
  proveedor: string;       // Quién trajo la mercadería
  observaciones: string;   // Notas opcionales
  usuario: string;         // Quién registró la recepción
  createdAt?: string;      // Fecha de recepción (la pone MongoDB automático)
}

// ── DECORADOR ────────────────────────────────
// Servicio que centraliza las llamadas HTTP de recepciones.
@Injectable({
  providedIn: 'root'
})
export class RecepcionesService {

  // ── CONFIGURACIÓN ─────────────────────────
  private http = inject(HttpClient);
  private apiUrl = 'https://storehub-api-t6br.onrender.com/api/recepciones';

  // ── MÉTODOS ────────────────────────────────

  // GET — Obtener el historial completo
  getAll(): Observable<Recepcion[]> {
    return this.http.get<Recepcion[]>(this.apiUrl);
  }

  // POST — Registrar una recepción (suma stock automáticamente en el backend)
  create(recepcion: Recepcion): Observable<Recepcion> {
    return this.http.post<Recepcion>(this.apiUrl, recepcion);
  }

  // DELETE — Eliminar un registro del historial
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
