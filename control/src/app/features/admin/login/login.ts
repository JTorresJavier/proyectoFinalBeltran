// ── IMPORTS ──────────────────────────────────
import { Component, inject, OnInit } from '@angular/core';     // Component e inject
import { CommonModule } from '@angular/common';                 // Directivas ngIf, ngFor
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms'; // Reactive Forms
import { Router , RouterLink} from '@angular/router';                     // Para redirigir tras login

// ── ANGULAR MATERIAL ──────────────────────────
import { MatCardModule } from '@angular/material/card';           // Card del formulario
import { MatButtonModule } from '@angular/material/button';       // Botones Material
import { MatIconModule } from '@angular/material/icon';           // Íconos Material
import { MatInputModule } from '@angular/material/input';         // Inputs Material
import { MatFormFieldModule } from '@angular/material/form-field';// Campos de formulario
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Loading
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar'; // Notificaciones

// ── SERVICIOS ─────────────────────────────────
import { AuthService } from '../../../core/services/auth.service'; // Servicio de auth
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle';

// ── DECORADOR ────────────────────────────────
// Página de login del administrador.
// Verifica credenciales contra la API y guarda sesión en LocalStorage.
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,      // Para Reactive Forms
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,        // Para notificaciones
    ThemeToggleComponent,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})

// ── CLASE ────────────────────────────────────
// Lógica del login
export class LoginComponent {

  // ── SERVICIOS INYECTADOS ──────────────────
  private authService = inject(AuthService); // Servicio de autenticación
  private router = inject(Router);           // Para redirigir tras login
  private snackBar = inject(MatSnackBar);    // Para mostrar notificaciones

  // ── ESTADO ────────────────────────────────
  cargando: boolean = false;       // Controla el spinner de carga
  mostrarPassword: boolean = false; // Controla si se muestra la contraseña

  // ── FORMULARIO REACTIVO ───────────────────
  // FormGroup con validaciones para usuario y contraseña
  formulario = new FormGroup({
    usuario: new FormControl('', [
      Validators.required,        // Campo obligatorio
      Validators.minLength(3),    // Mínimo 3 caracteres
    ]),
    password: new FormControl('', [
      Validators.required,        // Campo obligatorio
      Validators.minLength(4),    // Mínimo 4 caracteres
    ]),
  });

  // ── GETTERS ───────────────────────────────
  // Acceso rápido a los controles del formulario
  get usuario() { return this.formulario.get('usuario'); }
  get password() { return this.formulario.get('password'); }

  // ── MÉTODO: TOGGLE PASSWORD ───────────────
  // Muestra u oculta la contraseña
  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  // ── MÉTODO: SUBMIT ────────────────────────
  // Se ejecuta al enviar el formulario
  onSubmit(): void {

    // Si el formulario tiene errores no continuamos
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    // Activamos el spinner de carga
    this.cargando = true;

    const usuarioInput = this.formulario.value.usuario!;
    const passwordInput = this.formulario.value.password!;

    // Llamamos al servicio para verificar credenciales en la API
    this.authService.login(usuarioInput, passwordInput)
      .subscribe({
        next: (usuarios) => {
          this.cargando = false;

          // Buscamos el usuario que coincida con usuario Y password
          const usuarioEncontrado = usuarios.find(
            u => u.usuario === usuarioInput &&
                 u.password === passwordInput &&
                 u.activo === true
          );

          if (usuarioEncontrado) {
            // Guardamos la sesión en LocalStorage
            this.authService.guardarSesion(usuarioEncontrado);

            // Notificación de bienvenida
            this.snackBar.open(
              `¡Bienvenido ${usuarioEncontrado.nombre}! (${usuarioEncontrado.rol})`,
              'Cerrar',
              { duration: 3000, panelClass: 'snackbar--success' }
            );

            // Redirigimos al dashboard
            this.router.navigate(['/admin/dashboard']);

          } else {
            // Credenciales incorrectas o usuario inactivo
            this.snackBar.open(
              'Usuario o contraseña incorrectos',
              'Cerrar',
              { duration: 3000, panelClass: 'snackbar--error' }
            );
          }
        },
        error: (err) => {
          // Error de conexión con la API
          this.cargando = false;
          this.snackBar.open(
            'Error al conectar con el servidor',
            'Cerrar',
            { duration: 3000, panelClass: 'snackbar--error' }
          );
          console.error('Error login:', err);
        }
      });
  }
}
