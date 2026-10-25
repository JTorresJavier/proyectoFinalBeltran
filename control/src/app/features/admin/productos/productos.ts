// ── IMPORTS ──────────────────────────────────
import { ChangeDetectorRef, Component, OnInit, ViewChild, inject, NgZone } from '@angular/core'; // Component, lifecycle e inject
import { CommonModule } from '@angular/common';             // Directivas ngIf, ngFor
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms'; // Reactive Forms

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
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { ProductoImagenComponent } from '../../../shared/components/producto-imagen/producto-imagen';
import { MatChipsModule } from '@angular/material/chips';

// ── SERVICIOS ─────────────────────────────────
import { ProductosService, Producto } from '../../../core/services/productos.service';
import { formAnimation } from '../../../form-animations';
import { ConfirmacionDialogComponent } from '../../../shared/components/confirmacion-dialog/confirmacion-dialog';
import { CATEGORIAS, iconoDeCategoria } from '../../../core/data/categorias';
import { HttpErrorResponse } from '@angular/common/http';

// Paginador en español
function paginadorEnEspanol(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Productos por página';
  intl.nextPageLabel     = 'Página siguiente';
  intl.previousPageLabel = 'Página anterior';
  intl.firstPageLabel    = 'Primera página';
  intl.lastPageLabel     = 'Última página';
  intl.getRangeLabel = (pagina, tamanio, total) => {
    if (total === 0) return '0 de 0';
    const desde = pagina * tamanio + 1;
    const hasta = Math.min(desde + tamanio - 1, total);
    return `${desde} – ${hasta} de ${total}`;
  };
  return intl;
}

// Validación cruzada: si está en oferta, el descuento va de 1 a 100
function ofertaConDescuento(grupo: AbstractControl): ValidationErrors | null {
  const oferta    = grupo.get('oferta')?.value;
  const descuento = Number(grupo.get('descuento')?.value);
  return oferta && !(descuento >= 1 && descuento <= 100) ? { descuentoInvalido: true } : null;
}

// ── DECORADOR ────────────────────────────────
// Página de gestión de productos del administrador.
// Implementa CRUD completo contra la API REST.
@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
    MatPaginatorModule,
    ProductoImagenComponent,
    MatChipsModule,
  ],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
  animations: [formAnimation],
  providers: [{ provide: MatPaginatorIntl, useFactory: paginadorEnEspanol }]
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
  guardando: boolean         = false; // Evita doble envío mientras responde la API
  busqueda: string           = '';    // Texto del buscador de la tabla

  // Tabla con búsqueda y paginación de Angular Material
  dataSource = new MatTableDataSource<Producto>([]);

  // El paginador está dentro de un @if: se conecta cuando aparece
  @ViewChild(MatPaginator) set paginador(p: MatPaginator | undefined) {
    if (p) this.dataSource.paginator = p;
  }

  // ── COLUMNAS DE LA TABLA ──────────────────
  columnasTabla: string[] = ['nombre', 'categoria', 'precio', 'stock', 'oferta', 'acciones'];

  // ── CATEGORÍAS ────────────────────────────
  // Mismas categorías que la consulta de precios (core/data/categorias.ts)
  categorias: string[] = CATEGORIAS.map(c => c.nombre);

  // ── FORMULARIO REACTIVO ───────────────────
  formulario = new FormGroup({
    nombre:      new FormControl('', [Validators.required, Validators.minLength(3)]),
    categoria:   new FormControl('', [Validators.required]),
    precio:      new FormControl(0,  [Validators.required, Validators.min(1)]),
    stock:       new FormControl(0,  [Validators.required, Validators.min(0)]),
    descripcion: new FormControl('', [Validators.required]),
    icono:       new FormControl('shopping_bag'),
    oferta:      new FormControl(false),
    descuento:   new FormControl({ value: 0, disabled: true }),
  }, { validators: ofertaConDescuento });

  // ── GETTERS ───────────────────────────────
  get nombre()      { return this.formulario.controls.nombre;      }
  get categoria()   { return this.formulario.controls.categoria;   }
  get precio()      { return this.formulario.controls.precio;      }
  get stock()       { return this.formulario.controls.stock;       }
  get descripcion() { return this.formulario.controls.descripcion; }
  get descuento()   { return this.formulario.controls.descuento;   }

  constructor() {
    // Busca por nombre o categoría, sin importar tildes ni mayúsculas
    this.dataSource.filterPredicate = (p, filtro) =>
      this.normalizar(`${p.nombre} ${p.categoria}`).includes(filtro);

    // El descuento solo se edita si el producto está en oferta
    this.formulario.controls.oferta.valueChanges.subscribe(oferta => {
      const control = this.formulario.controls.descuento;
      if (oferta) {
        control.enable({ emitEvent: false });
      } else {
        control.setValue(0, { emitEvent: false });
        control.disable({ emitEvent: false });
      }
    });
  }

  // ── LIFECYCLE HOOK ────────────────────────
  ngOnInit(): void {
    this.cargarProductos();
  }

  // ── MÉTODO: CARGAR PRODUCTOS ──────────────
  // GET — Obtiene todos los productos de la API.
  // El spinner solo aparece en la primera carga; después se actualiza
  // la tabla sin perder la página ni el texto buscado.
  cargarProductos(): void {
    this.cargando = this.productos.length === 0;
    this.productosService.getAll().subscribe({
      next: (productos) => {
        this.ngZone.run(() => {
          this.productos       = productos;  // Guardamos los productos
          this.dataSource.data = productos;  // Alimenta la tabla paginada
          this.cargando        = false;      // Ocultamos el spinner
          this.cdr.detectChanges();          // Forzamos detección de cambios
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.cargando = false;
          this.avisarError('No se pudieron cargar los productos', err);
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── MÉTODO: BUSCAR ────────────────────────
  // Filtra la tabla por nombre o categoría y vuelve a la primera página
  buscar(texto: string): void {
    this.busqueda = texto;
    this.dataSource.filter = this.normalizar(texto);
    this.dataSource.paginator?.firstPage();
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
    this.irAlFormulario();
  }

  // ── MÉTODO: EDITAR PRODUCTO ───────────────
  editarProducto(producto: Producto): void {
    this.modoEdicion        = true;
    this.productoEditandoId = producto._id || producto.id!;
    this.formulario.patchValue(producto);
    // patchValue no dispara valueChanges con el mismo valor: sincronizamos el descuento
    if (producto.oferta) {
      this.formulario.controls.descuento.enable({ emitEvent: false });
    } else {
      this.formulario.controls.descuento.disable({ emitEvent: false });
    }
    this.mostrarFormulario  = true;
    this.irAlFormulario();
  }

  // ── MÉTODO: GUARDAR PRODUCTO ──────────────
  // POST o PUT según modo
  guardarProducto(): void {
    if (this.formulario.invalid || this.guardando) {
      this.formulario.markAllAsTouched();
      return;
    }

    // getRawValue incluye el descuento aunque esté deshabilitado (queda en 0)
    const datos = this.formulario.getRawValue() as Producto;
    datos.nombre      = datos.nombre.trim();
    datos.descripcion = datos.descripcion.trim();
    if (!this.modoEdicion) {
      datos.icono = iconoDeCategoria(datos.categoria); // Ícono según la categoría
    }

    this.guardando = true;
    const peticion = this.modoEdicion
      ? this.productosService.update(this.productoEditandoId, datos) // PUT
      : this.productosService.create(datos);                         // POST

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.snackBar.open(
          this.modoEdicion ? 'Producto actualizado' : 'Producto creado',
          'Cerrar', { duration: 3000, panelClass: 'snackbar--success' });
        this.mostrarFormulario = false;
        this.cargarProductos();
      },
      error: (err) => {
        this.guardando = false;
        this.avisarError(this.modoEdicion ? 'No se pudo actualizar el producto' : 'No se pudo crear el producto', err);
      }
    });
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
          this.snackBar.open('Producto eliminado', 'Cerrar', { duration: 3000, panelClass: 'snackbar--success' });
          this.cargarProductos();
        },
        error: (err) => this.avisarError('No se pudo eliminar el producto', err)
      });
    });
  }

  // ── MÉTODO: CANCELAR ──────────────────────
  cancelar(): void {
    this.mostrarFormulario = false;
    this.formulario.reset();
  }

  // Lleva la vista al formulario (al editar desde una fila de abajo)
  private irAlFormulario(): void {
    setTimeout(() => document.querySelector('.formulario-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  // Muestra el error de la API al usuario (no solo en consola)
  private avisarError(mensaje: string, err: HttpErrorResponse): void {
    const motivo = err.status === 0 ? 'sin conexión con el servidor' : (err.error?.error ?? 'error del servidor');
    this.snackBar.open(`${mensaje}: ${motivo}`, 'Cerrar', { duration: 4000, panelClass: 'snackbar--error' });
  }

  // Búsqueda sin tildes ni mayúsculas
  private normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
}
