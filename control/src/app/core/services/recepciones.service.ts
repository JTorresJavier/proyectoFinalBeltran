// ── IMPORTS ──────────────────────────────────
import { Injectable, inject } from '@angular/core'; // Decorador e inyección
import { HttpClient } from '@angular/common/http';  // Para llamadas HTTP
import { Observable } from 'rxjs';                  // Para manejar respuestas asíncronas
import { environment } from '../../../environments/environment'; // URL base de la API
import { Recepcion } from '../models/recepcion.model';
export type { Recepcion } from '../models/recepcion.model'; // Se re-exporta para los componentes

// ── DECORADOR ────────────────────────────────
// Servicio que centraliza las llamadas HTTP de recepciones.
@Injectable({
  providedIn: 'root'
})
export class RecepcionesService {

  // ── CONFIGURACIÓN ─────────────────────────
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/recepciones`;

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
