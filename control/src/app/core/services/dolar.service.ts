// ── IMPORTS ──────────────────────────────────
import { Injectable, inject } from '@angular/core'; // Decorador e inyección
import { HttpClient } from '@angular/common/http';  // Para llamadas HTTP
import { Observable, map } from 'rxjs';             // Observable y operador map

// ── INTERFACE ────────────────────────────────
// Define la forma de una cotización según DolarAPI
export interface Cotizacion {
  compra: number;              // Precio de compra
  venta: number;                // Precio de venta
  casa: string;                  // Identificador ('oficial', 'blue', etc.)
  nombre: string;                // Nombre legible ('Oficial', 'Blue', etc.)
  moneda: string;                // Moneda de referencia ('USD')
  fechaActualizacion: string;    // Última actualización
}

// ── DECORADOR ────────────────────────────────
// Servicio que consulta la cotización del dólar en Argentina
// usando la API pública y gratuita DolarAPI (sin necesidad de API key).
@Injectable({
  providedIn: 'root' // Disponible en toda la app (Singleton)
})
export class DolarService {

  // ── CONFIGURACIÓN ─────────────────────────
  private http = inject(HttpClient);                    // Inyectamos HttpClient
  private apiUrl = 'https://dolarapi.com/v1/dolares';    // Endpoint público

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