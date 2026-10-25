// ── IMPORTS ──────────────────────────────────
import { ChangeDetectorRef, Component, OnInit, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

// ── ANGULAR MATERIAL ──────────────────────────
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

// ── SERVICIOS ─────────────────────────────────
import { RecepcionesService, Recepcion } from '../../../core/services/recepciones.service';
import { ProductosService, Producto } from '../../../core/services/productos.service';
import { AuthService } from '../../../core/services/auth.service';
import { formAnimation } from '../../../form-animations';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmacionDialogComponent } from '../../../shared/components/confirmacion-dialog/confirmacion-dialog';

// ── DECORADOR ────────────────────────────────
@Component({
  selector: 'app-recepciones',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatDialogModule,
  ],
  templateUrl: './recepciones.html',
  styleUrl: './recepciones.css',
  animations: [formAnimation]
})

// ── CLASE ────────────────────────────────────
export class RecepcionesComponent implements OnInit {

  private recepcionesService = inject(RecepcionesService);
  private productosService   = inject(ProductosService);
  private authService        = inject(AuthService);
  private snackBar           = inject(MatSnackBar);
  private dialog             = inject(MatDialog);
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
    // El proveedor se valida sin contar espacios: "  " no es un nombre
    proveedor:     new FormControl('', [Validators.required, Validators.pattern(/^\s*\S.*\S\s*$/)]),
    observaciones: new FormControl(''),
  });

  // Buscador del producto (autocompletado). El formulario guarda solo el _id.
  busquedaProducto = new FormControl<string | Producto>('');

  get producto()  { return this.formulario.get('producto');  }
  get cantidad()  { return this.formulario.get('cantidad');  }
  get proveedor() { return this.formulario.get('proveedor'); }

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarRecepciones();

    // Si se vuelve a escribir después de elegir, el producto deja de estar elegido
    this.busquedaProducto.valueChanges.subscribe(valor => {
      if (typeof valor === 'string') this.formulario.controls.producto.setValue('');
    });
  }

  // Hasta 30 coincidencias por nombre o categoría, sin importar tildes
  get productosFiltrados(): Producto[] {
    const valor = this.busquedaProducto.value;
    const texto = this.normalizar(typeof valor === 'string' ? valor : valor?.nombre ?? '');
    return this.productos
      .filter(p => !texto || this.normalizar(`${p.nombre} ${p.categoria}`).includes(texto))
      .slice(0, 30);
  }

  mostrarProducto = (p: Producto | string | null): string => (typeof p === 'string' ? p : p?.nombre ?? '');

  seleccionarProducto(evento: MatAutocompleteSelectedEvent): void {
    const p = evento.option.value as Producto;
    this.formulario.controls.producto.setValue(p._id ?? '');
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
    this.busquedaProducto.reset('');
    this.mostrarFormulario = true;
  }

  guardarRecepcion(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.busquedaProducto.markAsTouched();
      return;
    }

    const idProducto = this.formulario.value.producto!;
    const productoSeleccionado = this.productos.find(p => p._id === idProducto);
    const usuarioActual = this.authService.obtenerUsuario();

    const datos: Recepcion = {
      producto:       idProducto,
      productoNombre: productoSeleccionado?.nombre || '',
      cantidad:       this.formulario.value.cantidad!,
      proveedor:      this.formulario.value.proveedor!.trim(),
      observaciones:  this.formulario.value.observaciones || '',
      usuario:        usuarioActual?.nombre || '',
    };

    this.recepcionesService.create(datos).subscribe({
      next: () => {
        this.snackBar.open('Recepción registrada - Stock actualizado', 'Cerrar', { duration: 3000, panelClass: 'snackbar--success' });
        this.mostrarFormulario = false;
        this.cargarRecepciones();
        this.cargarProductos();
      },
      error: (err) => {
        const motivo = err.status === 0 ? 'sin conexión con el servidor' : (err.error?.error ?? 'error del servidor');
        this.snackBar.open(`No se pudo registrar la recepción: ${motivo}`, 'Cerrar', { duration: 4000, panelClass: 'snackbar--error' });
      }
    });
  }

  eliminarRecepcion(recepcion: Recepcion): void {
    this.dialog.open(ConfirmacionDialogComponent, {
      width: 'min(420px, calc(100vw - 32px))',
      data: {
        titulo: 'Eliminar recepción',
        mensaje: `¿Querés eliminar el registro de “${recepcion.productoNombre}”? Es una corrección del historial: el stock que ya se sumó no se descuenta.`,
      },
    }).afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.recepcionesService.delete(recepcion._id!).subscribe({
        next: () => {
          this.snackBar.open('Registro eliminado', 'Cerrar', { duration: 3000, panelClass: 'snackbar--success' });
          this.cargarRecepciones();
        },
        error: (err) => {
          console.error('Error eliminando recepción:', err);
          this.snackBar.open('Error al eliminar el registro', 'Cerrar', { duration: 3000, panelClass: 'snackbar--error' });
        }
      });
    });
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.formulario.reset();
    this.busquedaProducto.reset('');
  }

  // Búsqueda sin tildes ni mayúsculas
  private normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
}
