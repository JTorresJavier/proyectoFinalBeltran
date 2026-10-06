import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TimeoutError, timeout } from 'rxjs';
import { ProductosService, Producto } from '../../../core/services/productos.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle';

interface CategoriaStock {
  nombre: string;
  cantidad: number;
  porcentaje: number;
  ofertas: number;
  porcentajeOfertas: number;
}

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, ThemeToggleComponent],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css',
})
export class EstadisticasComponent {
  private readonly productosService = inject(ProductosService);
  private readonly cdr = inject(ChangeDetectorRef);

  productos: Producto[] = [];
  categoriasStock: CategoriaStock[] = [];
  cargando = true;
  error = false;
  mensajeError = 'No pudimos conectar con el backend. Verificá que esté activo e intentá nuevamente.';
  cantidadEnOferta = 0;
  cantidadSinOferta = 0;
  totalUnidades = 0;
  valorInventario = 0;

  get productosConStockSaludable(): number {
    return this.productos.filter(producto => producto.stock >= 5).length;
  }

  get productosConStockBajo(): number {
    return this.productos.filter(producto => producto.stock > 0 && producto.stock < 5).length;
  }

  get productosSinStock(): number {
    return this.productos.filter(producto => producto.stock <= 0).length;
  }

  get graficoEstadoStock(): string {
    const total = this.productos.length || 1;
    const saludable = (this.productosConStockSaludable / total) * 100;
    const bajo = (this.productosConStockBajo / total) * 100;
    const agotado = saludable + bajo;
    return `conic-gradient(#2e8b68 0 ${saludable}%, #efa83b ${saludable}% ${agotado}%, #d96c6c ${agotado}% 100%)`;
  }

  get porcentajeOferta(): number {
    return this.productos.length === 0 ? 0 : Math.round((this.cantidadEnOferta / this.productos.length) * 100);
  }

  get valorInventarioFormateado(): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(this.valorInventario);
  }

  get graficoOferta(): string {
    const porcentaje = this.porcentajeOferta;
    return `conic-gradient(#1976d2 0 ${porcentaje}%, #dce8f4 ${porcentaje}% 100%)`;
  }

  constructor() {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = false;
    this.mensajeError = 'No pudimos conectar con el backend. Verificá que esté activo e intentá nuevamente.';

    this.productosService.getAll().pipe(timeout({ first: 10000 })).subscribe({
      next: (productos) => {
        this.productos = productos;
        this.cantidadEnOferta = productos.filter(producto => producto.oferta).length;
        this.cantidadSinOferta = productos.length - this.cantidadEnOferta;
        this.totalUnidades = productos.reduce((total, producto) => total + (Number(producto.stock) || 0), 0);
        this.valorInventario = productos.reduce(
          (total, producto) => total + (Number(producto.precio) || 0) * (Number(producto.stock) || 0),
          0,
        );
        this.agruparStockPorCategoria(productos);
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando estadísticas de productos:', err);
        this.error = true;
        this.cargando = false;
        if (err instanceof TimeoutError) {
          this.mensajeError = 'La consulta tardó más de 10 segundos. Revisá la conexión con el backend e intentá nuevamente.';
        }
        this.cdr.markForCheck();
      },
    });
  }

  private agruparStockPorCategoria(productos: Producto[]): void {
    const cantidades = new Map<string, number>();
    const ofertas = new Map<string, number>();

    for (const producto of productos) {
      const categoria = String(producto.categoria ?? '').trim() || 'Sin categoría';
      cantidades.set(categoria, (cantidades.get(categoria) ?? 0) + (Number(producto.stock) || 0));
      if (producto.oferta) {
        ofertas.set(categoria, (ofertas.get(categoria) ?? 0) + 1);
      }
    }

    const maximo = Math.max(0, ...cantidades.values());
    const maximoOfertas = Math.max(0, ...ofertas.values());
    this.categoriasStock = [...cantidades.entries()]
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        porcentaje: maximo === 0 || cantidad === 0 ? 0 : Math.max(5, Math.round((cantidad / maximo) * 100)),
        ofertas: ofertas.get(nombre) ?? 0,
        porcentajeOfertas: maximoOfertas === 0 || (ofertas.get(nombre) ?? 0) === 0
          ? 0
          : Math.max(5, Math.round(((ofertas.get(nombre) ?? 0) / maximoOfertas) * 100)),
      }))
      .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre));
  }
}
