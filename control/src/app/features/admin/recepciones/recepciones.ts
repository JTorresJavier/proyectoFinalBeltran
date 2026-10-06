// ── IMPORTS ──────────────────────────────────
import { ChangeDetectorRef, Component, OnInit, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

// ── ANGULAR MATERIAL ──────────────────────────
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

// ── SERVICIOS ─────────────────────────────────
import { RecepcionesService, Recepcion } from '../../../core/services/recepciones.service';
import { ProductosService, Producto } from '../../../core/services/productos.service';
import { AuthService } from '../../../core/services/auth.service';

// ── DECORADOR ────────────────────────────────
@Component({
  selector: 'app-recepciones',
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
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './recepciones.html',
  styleUrl: './recepciones.css'
})

// ── CLASE ────────────────────────────────────
export class RecepcionesComponent implements OnInit {

  private recepcionesService = inject(RecepcionesService);
  private productosService   = inject(ProductosService);
  private authService        = inject(AuthService);
  private snackBar           = inject(MatSnackBar);
  private cdr                = inject(ChangeDetectorRef);
  private ngZone              = inject(NgZone);

  recepciones: Recepcion[] = [];
  productos: Producto[]    = [];
  cargando: boolean        = false;
  mostrarFormulario: boolean = false;

  columnasTabla: string[] = ['fecha', 'producto', 'cantidad', 'proveedor', 'usuario', 'acciones'];

  formulario = new FormGroup({
    producto:      new FormControl('', [Validators.required]),
    cantidad:      new FormControl(1,  [Validators.required, Validators.min(1)]),
    proveedor:     new FormControl('', [Validators.required, Validators.minLength(2)]),
    observaciones: new FormControl(''),
  });

  get producto()  { return this.formulario.get('producto');  }
  get cantidad()  { return this.formulario.get('cantidad');  }
  get proveedor() { return this.formulario.get('proveedor'); }

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarRecepciones();
  }

  cargarProductos(): void {
    this.productosService.getAll().subscribe({
      next: (productos) => {
        this.ngZone.run(() => {
          this.productos = productos;
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('Error cargando productos:', err)
    });
  }

  cargarRecepciones(): void {
    this.cargando = true;
    this.recepcionesService.getAll().subscribe({
      next: (recepciones) => {
        this.ngZone.run(() => {
          this.recepciones = recepciones;
          this.cargando = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Error cargando recepciones:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  nuevaRecepcion(): void {
    this.formulario.reset({ cantidad: 1 });
    this.mostrarFormulario = true;
  }

  guardarRecepcion(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const idProducto = this.formulario.value.producto!;
    const productoSeleccionado = this.productos.find(p => p._id === idProducto);
    const usuarioActual = this.authService.obtenerUsuario();

    const datos: Recepcion = {
      producto:       idProducto,
      productoNombre: productoSeleccionado?.nombre || '',
      cantidad:       this.formulario.value.cantidad!,
      proveedor:      this.formulario.value.proveedor!,
      observaciones:  this.formulario.value.observaciones || '',
      usuario:        usuarioActual?.nombre || '',
    };

    this.recepcionesService.create(datos).subscribe({
      next: () => {
        this.snackBar.open('Recepción registrada - Stock actualizado', 'Cerrar', { duration: 3000 });
        this.mostrarFormulario = false;
        this.cargarRecepciones();
        this.cargarProductos();
      },
      error: (err) => {
        console.error('Error registrando recepción:', err);
        this.snackBar.open('Error al registrar la recepción', 'Cerrar', { duration: 3000 });
      }
    });
  }

  eliminarRecepcion(recepcion: Recepcion): void {
    if (!confirm('¿Eliminar el registro de recepcion de "' + recepcion.productoNombre + '"?')) return;

    this.recepcionesService.delete(recepcion._id!).subscribe({
      next: () => {
        this.snackBar.open('Registro eliminado', 'Cerrar', { duration: 3000 });
        this.cargarRecepciones();
      },
      error: (err) => {
        console.error('Error eliminando recepción:', err);
        this.snackBar.open('Error al eliminar el registro', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.formulario.reset();
  }
}