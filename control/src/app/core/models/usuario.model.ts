// ── MODELO ───────────────────────────────────
// Usuario del sistema (personal del supermercado).

// ── INTERFACE ────────────────────────────────
// Define la forma de un Usuario
export interface Usuario {
  _id?: string;       // ← MongoDB usa _id
  id?: string;         // ← compatibilidad
  nombre: string;    // Nombre completo
  usuario: string;   // Nombre de usuario para login
  password: string;  // Contraseña
  rol: string;       // 'admin', 'empleado', 'cajero', 'repositor'
  activo: boolean;   // Si el usuario está activo
}
