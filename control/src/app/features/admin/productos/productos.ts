// ── IMPORTS ──────────────────────────────────
import { ChangeDetectorRef, Component, OnInit, inject, NgZone } from '@angular/core'; // Component, lifecycle e inject
import { CommonModule } from '@angular/common';             // Directivas ngIf, ngFor
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms'; // Reactive Forms

// ── ANGULAR MATERIAL ──────────────────────────
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

// ── SERVICIOS ─────────────────────────────────
import { ProductosService, Producto } from '../../../core/services/productos.service';
import { RouterLink } from '@angular/router';
import { formAnimation } from '../../../form-animations';
import { ConfirmacionDialogComponent } from '../../../shared/components/confirmacion-dialog/confirmacion-dialog';

// ── DECORADOR ────────────────────────────────
// Página de gestión de productos del administrador.
// Implementa CRUD completo contra la API REST.
@Component({
  selector: 'app-productos',
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
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
  ],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
  animations: [formAnimation]
})

// ── CLASE ────────────────────────────────────
export class ProductosComponent implements OnInit {

  // ── SERVICIOS INYECTADOS ──────────────────
  private productosService = inject(ProductosService); // CRUD de productos
  private snackBar         = inject(MatSnackBar);      // Notificaciones
  private dialog           = inject(MatDialog);        // Diálogos
  private cdr              = inject(ChangeDetectorRef); // Detección de cambios
  private ngZone           = inject(NgZone);


  // ── ESTADO ────────────────────────────────
  productos: Producto[]      = [];    // Lista de productos de la API
  cargando: boolean          = false; // Spinner de carga
  modoEdicion: boolean       = false; // true = editando | false = creando
  productoEditandoId: string = '';    // ID del producto que se está editando
  mostrarFormulario: boolean = false; // Muestra u oculta el formulario

  // ── COLUMNAS DE LA TABLA ──────────────────
  columnasTabla: string[] = ['nombre', 'categoria', 'precio', 'stock', 'oferta', 'acciones'];

  // ── CATEGORÍAS ────────────────────────────
  categorias: string[] = ['Bebidas', 'Snacks', 'Lácteos', 'Limpieza', 'Golosinas', 'Fiambres'];

  // ── FORMULARIO REACTIVO ───────────────────
  formulario = new FormGroup({
    nombre:      new FormControl('', [Validators.required, Validators.minLength(3)]),
    categoria:   new FormControl('', [Validators.required]),
    precio:      new FormControl(0,  [Validators.required, Validators.min(0)]),
    stock:       new FormControl(0,  [Validators.required, Validators.min(0)]),
    descripcion: new FormControl('', [Validators.required]),
    icono:       new FormControl('shopping_bag'),
    oferta:      new FormControl(false),
    descuento:   new FormControl(0, [Validators.min(0), Validators.max(100)]),
  });

  // ── GETTERS ───────────────────────────────
  get nombre()      { return this.formulario.controls.nombre;      }
  get categoria()   { return this.formulario.controls.categoria;   }
  get precio()      { return this.formulario.controls.precio;      }
  get stock()       { return this.formulario.controls.stock;       }
  get descripcion() { return this.formulario.controls.descripcion; }

  // ── LIFECYCLE HOOK ────────────────────────
  ngOnInit(): void {
    this.cargarProductos();
  }

  // ── MÉTODO: CARGAR PRODUCTOS ──────────────
  // GET — Obtiene todos los productos de la API
  cargarProductos(): void {
    this.cargando = true;
    this.productosService.getAll().subscribe({
      next: (productos) => {
        this.ngZone.run(() => {
          this.productos = productos;  // Guardamos los productos
          this.cargando  = false;      // Ocultamos el spinner
          this.cdr.detectChanges();   // Forzamos detección de cambios
        });
        
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Error cargando productos:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── MÉTODO: NUEVO PRODUCTO ────────────────
  nuevoProducto(): void {
    this.modoEdicion        = false;
    this.productoEditandoId = '';
    this.formulario.reset({
      icono: 'shopping_bag',
      oferta: false,
      descuento: 0,
      precio: 0,
      stock: 0
    });
    this.mostrarFormulario = true;
  }

  // ── MÉTODO: EDITAR PRODUCTO ───────────────
  editarProducto(producto: Producto): void {
    this.modoEdicion        = true;
    this.productoEditandoId = producto._id || producto.id!; // ← CAMBIO
    this.formulario.patchValue(producto);
    this.mostrarFormulario  = true;
  }

  // ── MÉTODO: GUARDAR PRODUCTO ──────────────
  // POST o PUT según modo
  guardarProducto(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const datos = this.formulario.value as Producto;

    if (this.modoEdicion) {
      // PUT — Actualizar producto existente
      this.productosService.update(this.productoEditandoId, datos).subscribe({
        next: () => {
          this.snackBar.open('Producto actualizado ✅', 'Cerrar', { duration: 3000 });
          this.mostrarFormulario = false;
          this.cargarProductos();
        },
        error: (err) => console.error('Error actualizando:', err)
      });
    } else {
      // POST — Crear nuevo producto
      this.productosService.create(datos).subscribe({
        next: () => {
          this.snackBar.open('Producto creado ✅', 'Cerrar', { duration: 3000 });
          this.mostrarFormulario = false;
          this.cargarProductos();
        },
        error: (err) => console.error('Error creando:', err)
      });
    }
  }

  // ── MÉTODO: ELIMINAR PRODUCTO ─────────────
  // DELETE — Elimina un producto de la API
  eliminarProducto(producto: Producto): void {
    this.dialog.open(ConfirmacionDialogComponent, {
      width: 'min(420px, calc(100vw - 32px))',
      data: {
        titulo: 'Eliminar producto',
        mensaje: `¿Querés eliminar “${producto.nombre}”? Esta acción no se puede deshacer.`,
      },
    }).afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.productosService.delete(producto._id || producto.id!).subscribe({
        next: () => {
          this.snackBar.open('Producto eliminado 🗑️', 'Cerrar', { duration: 3000 });
          this.cargarProductos();
        },
        error: (err) => console.error('Error eliminando:', err)
      });
    });
  }

  // ── MÉTODO: CANCELAR ──────────────────────
  cancelar(): void {
    this.mostrarFormulario = false;
    this.formulario.reset();
  }
}
