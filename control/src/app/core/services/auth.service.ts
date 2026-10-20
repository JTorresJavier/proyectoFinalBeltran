// ── IMPORTS ──────────────────────────────────
import { Injectable, inject } from '@angular/core'; // Decorador e inyección
import { HttpClient } from '@angular/common/http';  // Para llamadas HTTP
import { Observable, BehaviorSubject } from 'rxjs'; // Para manejar respuestas asíncronas

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

// ── DECORADOR ────────────────────────────────
// Servicio que maneja la autenticación y sesión.
// Usa la API para verificar credenciales con bcrypt y
// LocalStorage para persistir la sesión.
@Injectable({
  providedIn: 'root' // Disponible en toda la app (Singleton)
})
export class AuthService {

  // ── CONFIGURACIÓN ─────────────────────────
  private http = inject(HttpClient);   // Inyectamos HttpClient
  private apiUrl = 'https://storehub-api-t6br.onrender.com/api/usuarios'; // URL base
  private claveStorage = 'storehub_usuario'; // Clave en LocalStorage
  
  // ── ESTADO REACTIVO DE SESIÓN ─────────────
  // BehaviorSubject: guarda el último valor y avisa a quien esté suscripto
  // cuando cambia. Arranca con lo que haya en LocalStorage al cargar la app.
  private usuarioActualSubject = new BehaviorSubject<Usuario | null>(
    this.leerUsuarioDeStorage()
  );

  // Observable público — los componentes se suscriben a esto, nunca al Subject directo
  usuarioActual$ = this.usuarioActualSubject.asObservable();

  // Lee el usuario del LocalStorage (uso interno, para inicializar el Subject)
  private leerUsuarioDeStorage(): Usuario | null {
    const datos = localStorage.getItem(this.claveStorage);
    return datos ? JSON.parse(datos) : null;
  }

  // ── MÉTODOS DE SESIÓN ─────────────────────

  // Guarda el usuario en LocalStorage al hacer login
  guardarSesion(usuario: Usuario): void {
    localStorage.setItem(this.claveStorage, JSON.stringify(usuario));
    this.usuarioActualSubject.next(usuario); // Avisamos del cambio
  }

  // Recupera el usuario guardado en LocalStorage
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
    this.usuarioActualSubject.next(null); // Avisamos del cambio
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

  // LOGIN — Manda usuario y password al backend para verificar con bcrypt
  // El backend compara y devuelve el usuario sin password, o array vacío si falla
  login(usuarioInput: string, passwordInput: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(
      `${this.apiUrl}/login?usuario=${encodeURIComponent(usuarioInput)}&password=${encodeURIComponent(passwordInput)}`
    );
  }
}
