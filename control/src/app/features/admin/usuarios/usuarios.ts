// ── IMPORTS ──────────────────────────────────
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core'; // Component, lifecycle e inject
import { CommonModule } from '@angular/common';             // Directivas ngIf, ngFor
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms'; // Reactive Forms
import { RouterLink } from '@angular/router';               // Para volver al dashboard

// ── ANGULAR MATERIAL ──────────────────────────
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

// ── SERVICIOS ─────────────────────────────────
import { AuthService, Usuario } from '../../../core/services/auth.service';
import { formAnimation } from '../../../form-animations';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmacionDialogComponent } from '../../../shared/components/confirmacion-dialog/confirmacion-dialog';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle';

// ── DECORADOR ────────────────────────────────
// Página de gestión de usuarios (solo administrador).
// Implementa CRUD completo contra la API REST usando AuthService.
@Component({
  selector: 'app-usuarios',
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
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    ThemeToggleComponent,
    MatTableModule,
    MatChipsModule,
    MatDialogModule,
  ],
    templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
  animations: [formAnimation]
})

// ── CLASE ────────────────────────────────────
export class UsuariosComponent implements OnInit {

  // ── SERVICIOS INYECTADOS ──────────────────
  private authService = inject(AuthService);       // CRUD de usuarios y sesión
  private snackBar    = inject(MatSnackBar);       // Notificaciones
  private dialog      = inject(MatDialog);
  private cdr         = inject(ChangeDetectorRef); // Detección de cambios

  // ── ESTADO ────────────────────────────────
  usuarios: Usuario[]            = [];    // Lista de usuarios de la API
  usuarioLogueado: Usuario | null = null; // Quién está usando el panel
  cargando: boolean              = false; // Spinner de carga
  modoEdicion: boolean           = false; // true = editando | false = creando
  usuarioEditandoId: string      = '';    // ID del usuario que se está editando
  mostrarFormulario: boolean     = false; // Muestra u oculta el formulario
  mostrarPassword: boolean       = false; // Muestra u oculta la contraseña

  // ── COLUMNAS DE LA TABLA ──────────────────
  columnasTabla: string[] = ['nombre', 'usuario', 'rol', 'activo', 'acciones'];

  // ── ROLES DISPONIBLES ─────────────────────
  roles: string[] = ['admin', 'empleado', 'repositor'];

  // ── FORMULARIO REACTIVO ───────────────────
  formulario = new FormGroup({
    nombre:   new FormControl('', [Validators.required, Validators.minLength(3)]),
    usuario:  new FormControl('', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('', [Validators.required, Validators.minLength(4)]),
    rol:      new FormControl('', [Validators.required]),
    activo:   new FormControl(true),
  });

  // ── GETTERS ───────────────────────────────
  get nombre()   { return this.formulario.get('nombre');   }
  get usuario()  { return this.formulario.get('usuario');  }
  get password() { return this.formulario.get('password'); }
  get rol()      { return this.formulario.get('rol');      }

  // ── LIFECYCLE HOOK ────────────────────────
  ngOnInit(): void {
    this.usuarioLogueado = this.authService.obtenerUsuario();
    this.cargarUsuarios();
  }

  // ── MÉTODO: CARGAR USUARIOS ───────────────
  // GET — Obtiene todos los usuarios de la API
  cargarUsuarios(): void {
    this.cargando = true;
    this.authService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
        this.cargando = false;
        this.snackBar.open('Error al cargar los usuarios', 'Cerrar', { duration: 3000, panelClass: 'snackbar--error' });
        this.cdr.detectChanges();
      }
    });
  }

  // ── MÉTODO: NUEVO USUARIO ─────────────────
  nuevoUsuario(): void {
    this.modoEdicion       = false;
    this.usuarioEditandoId = '';
    this.mostrarPassword   = false;
    this.formulario.reset({ activo: true });
    this.mostrarFormulario = true;
  }

  // ── MÉTODO: EDITAR USUARIO ────────────────
    editarUsuario(usuario: Usuario): void {
    this.modoEdicion       = true;
    this.usuarioEditandoId = usuario._id || usuario.id!;
    this.mostrarPassword   = false;
    this.formulario.patchValue(usuario);
    this.mostrarFormulario = true;
  }

  // ── MÉTODO: GUARDAR USUARIO ───────────────
  // POST o PUT según el modo
  guardarUsuario(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const datos = this.formulario.getRawValue() as Usuario;

    // Evitamos dos usuarios con el mismo nombre de usuario
    const duplicado = this.usuarios.some(u =>
      u.usuario.toLowerCase() === datos.usuario.toLowerCase() &&
      u.id !== this.usuarioEditandoId
    );
    if (duplicado) {
      this.snackBar.open('⚠️ Ese nombre de usuario ya existe', 'Cerrar', { duration: 3000, panelClass: 'snackbar--warning' });
      return;
    }

    if (this.modoEdicion) {
      // PUT — Actualizar usuario existente
      this.authService.updateUsuario(this.usuarioEditandoId, datos).subscribe({
        next: (actualizado) => {
          // Si me edité a mí mismo, actualizo la sesión guardada
          if (this.usuarioLogueado?.id === this.usuarioEditandoId) {
            this.authService.guardarSesion(actualizado);
            this.usuarioLogueado = actualizado;
          }
          this.snackBar.open('Usuario actualizado ✅', 'Cerrar', { duration: 3000, panelClass: 'snackbar--success' });
          this.mostrarFormulario = false;
          this.cargarUsuarios();
        },
        error: (err) => {
          console.error('Error actualizando:', err);
          this.snackBar.open('Error al actualizar el usuario', 'Cerrar', { duration: 3000, panelClass: 'snackbar--error' });
        }
      });
    } else {
      // POST — Crear nuevo usuario
      this.authService.createUsuario(datos).subscribe({
        next: () => {
          this.snackBar.open('Usuario creado ✅', 'Cerrar', { duration: 3000, panelClass: 'snackbar--success' });
          this.mostrarFormulario = false;
          this.cargarUsuarios();
        },
        error: (err) => {
          console.error('Error creando:', err);
          this.snackBar.open('Error al crear el usuario', 'Cerrar', { duration: 3000, panelClass: 'snackbar--error' });
        }
      });
    }
  }

  // ── MÉTODO: ELIMINAR USUARIO ──────────────
  // DELETE — Elimina un usuario de la API
  eliminarUsuario(usuario: Usuario): void {
    if (this.esUsuarioActual(usuario)) {
      this.snackBar.open('⚠️ No podés eliminar tu propio usuario', 'Cerrar', { duration: 3000, panelClass: 'snackbar--warning' });
      return;
    }
    this.dialog.open(ConfirmacionDialogComponent, {
      width: 'min(420px, calc(100vw - 32px))',
      data: {
        titulo: 'Eliminar usuario',
        mensaje: `¿Querés eliminar al usuario “${usuario.usuario}”? Esta acción no se puede deshacer.`,
      },
    }).afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.authService.deleteUsuario(usuario._id || usuario.id!).subscribe({
        next: () => {
          this.snackBar.open('Usuario eliminado 🗑️', 'Cerrar', { duration: 3000, panelClass: 'snackbar--success' });
          this.cargarUsuarios();
        },
        error: (err) => {
          console.error('Error eliminando:', err);
          this.snackBar.open('Error al eliminar el usuario', 'Cerrar', { duration: 3000, panelClass: 'snackbar--error' });
        }
      });
    });
  }

  // ── MÉTODO: CANCELAR ──────────────────────
  cancelar(): void {
    this.mostrarFormulario = false;
    this.formulario.reset();
  }

  // ── MÉTODO: TOGGLE PASSWORD ───────────────
  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  // ── MÉTODO: ES EL USUARIO ACTUAL ──────────
  // Lo usa el template para deshabilitar el botón de eliminar
  esUsuarioActual(usuario: Usuario): boolean {
    const idUsuario = usuario._id || usuario.id;
    const idLogueado = this.usuarioLogueado?._id || this.usuarioLogueado?.id;
    return idUsuario === idLogueado;
  }
}
