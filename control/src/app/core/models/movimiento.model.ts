// ── MODELO ───────────────────────────────────
// Registro de auditoría de la API.

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
