import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// ── INTERFACES ────────────────────────────────────────────────────────
export interface Movimiento {
  _id:        string;
  usuario:    string;
  usuarioId:  string | null;
  rol:        string;
  accion:     string;
  detalle:    string;
  entidad:    string;
  entidadId:  string;
  ip:         string;
  metodo:     string;
  endpoint:   string;
  fecha:      string;
}

export interface RespuestaMovimientos {
  movimientos:   Movimiento[];
  total:         number;
  pagina:        number;
  totalPaginas:  number;
  porPagina:     number;
}

export interface FiltrosMovimientos {
  usuario?:    string;
  rol?:        string;
  accion?:     string;
  fechaDesde?: string;   // ISO string: '2026-10-01'
  fechaHasta?: string;   // ISO string: '2026-10-31'
  page?:       number;
  limit?:      number;
}

// ── ETIQUETAS LEGIBLES PARA ACCIONES ─────────────────────────────────
export const ETIQUETAS_ACCION: Record<string, string> = {
  LOGIN:                'Inicio de sesión',
  LOGOUT:               'Cierre de sesión',
  CREAR_PRODUCTO:       'Creó producto',
  EDITAR_PRODUCTO:      'Editó producto',
  ELIMINAR_PRODUCTO:    'Eliminó producto',
  CREAR_USUARIO:        'Creó usuario',
  EDITAR_USUARIO:       'Editó usuario',
  ELIMINAR_USUARIO:     'Eliminó usuario',
  VENTA:                'Registró venta',
  ANULAR_VENTA:         'Anuló venta',
  RECEPCION_MERCADERIA: 'Recepción de mercadería',
  AJUSTE_STOCK:         'Ajuste de stock',
  PEDIDO_CREADO:        'Pedido creado',
  ERROR:                'Error',
  OTRO:                 'Otro',
};

// ── COLORES POR ACCIÓN (para chips/badges en la tabla) ────────────────
export const COLORES_ACCION: Record<string, string> = {
  LOGIN:                '#4caf50',
  LOGOUT:               '#9e9e9e',
  CREAR_PRODUCTO:       '#2196f3',
  EDITAR_PRODUCTO:      '#ff9800',
  ELIMINAR_PRODUCTO:    '#f44336',
  CREAR_USUARIO:        '#2196f3',
  EDITAR_USUARIO:       '#ff9800',
  ELIMINAR_USUARIO:     '#f44336',
  VENTA:                '#4caf50',
  ANULAR_VENTA:         '#f44336',
  RECEPCION_MERCADERIA: '#9c27b0',
  AJUSTE_STOCK:         '#ff9800',
  PEDIDO_CREADO:        '#00bcd4',
  ERROR:                '#f44336',
  OTRO:                 '#9e9e9e',
};

// ── SERVICIO ──────────────────────────────────────────────────────────
@Injectable({
  providedIn: 'root'
})
export class MovimientosService {

  private http    = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/api/movimientos';

  // ── GET con filtros y paginación ──────────────────────────────────
  getAll(filtros: FiltrosMovimientos = {}): Observable<RespuestaMovimientos> {
    let params = new HttpParams();

    if (filtros.usuario)    params = params.set('usuario',    filtros.usuario);
    if (filtros.rol)        params = params.set('rol',        filtros.rol);
    if (filtros.accion)     params = params.set('accion',     filtros.accion);
    if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);
    if (filtros.page)       params = params.set('page',       filtros.page.toString());
    if (filtros.limit)      params = params.set('limit',      filtros.limit.toString());

    return this.http.get<RespuestaMovimientos>(this.baseUrl, { params });
  }

  // ── Lista de usuarios únicos (para el selector de filtro) ─────────
  getUsuarios(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/usuarios`);
  }

  // ── Resumen por acción (para dashboard) ───────────────────────────
  getResumen(): Observable<{ _id: string; total: number; ultimo: string }[]> {
    return this.http.get<any[]>(`${this.baseUrl}/resumen`);
  }
}