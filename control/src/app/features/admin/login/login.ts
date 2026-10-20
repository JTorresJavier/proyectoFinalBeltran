// ── IMPORTS ──────────────────────────────────
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

// ── ANGULAR MATERIAL ──────────────────────────
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

// ── SERVICIOS ─────────────────────────────────
import { AuthService } from '../../../core/services/auth.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle';

// ── DECORADOR ────────────────────────────────
// Página de login del administrador.
// Verifica credenciales contra la API y guarda sesión en LocalStorage.
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ThemeToggleComponent,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})

// ── CLASE ────────────────────────────────────
export class LoginComponent {

  // ── SERVICIOS INYECTADOS ──────────────────
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // ── ESTADO ────────────────────────────────
  cargando: boolean = false;
  mostrarPassword: boolean = false;

  // ── FORMULARIO REACTIVO ───────────────────
  formulario = new FormGroup({
    usuario: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(4),
    ]),
  });

  // ── GETTERS ───────────────────────────────
  get usuario() { return this.formulario.get('usuario'); }
  get password() { return this.formulario.get('password'); }

  // ── MÉTODO: TOGGLE PASSWORD ───────────────
  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  // ── MÉTODO: SUBMIT ────────────────────────
  onSubmit(): void {

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando = true;

    const usuarioInput = this.formulario.value.usuario!;
    const passwordInput = this.formulario.value.password!;

    // Llamamos al servicio — el backend ya verificó las credenciales con bcrypt
    this.authService.login(usuarioInput, passwordInput)
      .subscribe({
        next: (usuarios) => {
          this.cargando = false;

          // El backend devuelve el usuario si las credenciales son correctas,
          // o array vacío si no coinciden — solo verificamos activo
          const usuarioEncontrado = usuarios.find(u => u.activo === true);

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