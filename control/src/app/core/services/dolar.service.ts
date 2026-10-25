// ── IMPORTS ──────────────────────────────────
import { Injectable, inject } from '@angular/core'; // Decorador e inyección
import { HttpClient } from '@angular/common/http';  // Para llamadas HTTP
import { Observable, map } from 'rxjs';             // Observable y operador map
import { environment } from '../../../environments/environment'; // URL base de la API
import { Cotizacion } from '../models/cotizacion.model';
export type { Cotizacion } from '../models/cotizacion.model'; // Se re-exporta para los componentes

// ── DECORADOR ────────────────────────────────
// Servicio que consulta la cotización del dólar en Argentina
// usando la API pública y gratuita DolarAPI (sin necesidad de API key).
@Injectable({
  providedIn: 'root' // Disponible en toda la app (Singleton)
})
export class DolarService {

  // ── CONFIGURACIÓN ─────────────────────────
  private http = inject(HttpClient);                    // Inyectamos HttpClient
  private apiUrl = `${environment.apiUrl}/dolar`;    // Proxy de DolarAPI en nuestro backend

  // ── MÉTODO: OBTENER TODAS LAS COTIZACIONES ─
  // GET — Devuelve el array completo (oficial, blue, bolsa, etc.)
  getCotizaciones(): Observable<Cotizacion[]> {
    return this.http.get<Cotizacion[]>(this.apiUrl);
  }

  // ── MÉTODO: OBTENER SOLO EL DÓLAR OFICIAL ──
  // Programación reactiva: usamos el operador "map" para transformar
  // el array completo en un único objeto, sin tocar el componente.
  getDolarOficial(): Observable<Cotizacion | undefined> {
    return this.getCotizaciones().pipe(
      map(cotizaciones => cotizaciones.find(c => c.casa === 'oficial'))
    );
  }
}
