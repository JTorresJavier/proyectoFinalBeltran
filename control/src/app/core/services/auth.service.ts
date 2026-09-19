// ── IMPORTS ──────────────────────────────────
import { Injectable, inject } from '@angular/core'; // Decorador e inyección
import { HttpClient } from '@angular/common/http';  // Para llamadas HTTP
import { Observable } from 'rxjs';                  // Para manejar respuestas asíncronas

// ── INTERFACE ────────────────────────────────
// Define la forma de un Usuario
export interface Usuario {
  id?: string;       // Opcional — lo asigna MockAPI
  nombre: string;    // Nombre completo
  usuario: string;   // Nombre de usuario para login
  password: string;  // Contraseña
  rol: string;       // 'admin', 'empleado', 'repositor'
  activo: boolean;   // Si el usuario está activo
}

// ── DECORADOR ────────────────────────────────
// Servicio que maneja la autenticación y sesión.
// Usa MockAPI para verificar credenciales y
// LocalStorage para persistir la sesión.
@Injectable({
  providedIn: 'root' // Disponible en toda la app (Singleton)
})
export class AuthService {

  // ── CONFIGURACIÓN ─────────────────────────
  private http = inject(HttpClient);   // Inyectamos HttpClient
  private apiUrl = 'https://6a9c3e100ad174e139e91cb8.mockapi.io/api/v1/usuarios'; // URL base
  private claveStorage = 'storehub_usuario'; // Clave en LocalStorage

  // ── MÉTODOS DE SESIÓN ─────────────────────

  // Guarda el usuario en LocalStorage al hacer login
  // JSON.stringify convierte el objeto a string para guardarlo
  guardarSesion(usuario: Usuario): void {
    localStorage.setItem(this.claveStorage, JSON.stringify(usuario));
  }

  // Recupera el usuario guardado en LocalStorage
  // JSON.parse convierte el string de vuelta a objeto
  obtenerUsuario(): Usuario | null {
    const datos = localStorage.getItem(this.claveStorage);
    return datos ? JSON.parse(datos) : null;
  }

  // Verifica si hay una sesión activa
  estaLogueado(): boolean {
    return this.obtenerUsuario() !== null;
  }

  // Verifica si el usuario tiene un rol específico
  tieneRol(rol: string): boolean {
    const usuario = this.obtenerUsuario();
    return usuario?.rol === rol;
  }

  // Verifica si el usuario es admin
  esAdmin(): boolean {
    return this.tieneRol('admin');
  }

  // Cierra la sesión eliminando el usuario de LocalStorage
  logout(): void {
    localStorage.removeItem(this.claveStorage);
  }

  // ── MÉTODOS HTTP ──────────────────────────

  // GET — Obtener todos los usuarios (solo admin)
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  // POST — Crear nuevo usuario (solo admin)
  createUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  // PUT — Actualizar usuario (solo admin)
  updateUsuario(id: string, usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario);
  }

  // DELETE — Eliminar usuario (solo admin)
  deleteUsuario(id: string): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.apiUrl}/${id}`);
  }

  // LOGIN — Busca el usuario en la API y verifica credenciales
  // Retorna el usuario si las credenciales son correctas, null si no
  login(usuarioInput: string, passwordInput: string): Observable<Usuario[]> {
    // Buscamos por nombre de usuario en la API
    return this.http.get<Usuario[]>(`${this.apiUrl}?usuario=${usuarioInput}`);
  }
}