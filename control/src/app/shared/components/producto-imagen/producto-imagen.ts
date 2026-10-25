// ── IMPORTS ──────────────────────────────────
import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { imagenProducto } from '../../utils/slug';
import { iconoProducto } from '../../utils/icono-producto';
import { FotosService } from '../../../core/services/fotos.service';

// ── COMPONENTE: FOTO DE PRODUCTO ──────────────
// Muestra la foto del producto desde /public/productos.
// Si el producto no tiene foto, muestra un ícono que lo representa
// (ver utils/icono-producto.ts) con los colores de la marca.
@Component({
  selector: 'app-producto-imagen',
  standalone: true,
  imports: [MatIconModule],
  template: `
    @switch (estado()) {
      @case ('foto') {
        <img [src]="src()" [alt]="nombre()" loading="lazy" decoding="async"
             [class.cargada]="cargada()" (load)="cargada.set(true)" (error)="fallo.set(true)" />
      }
      @case ('icono') {
        <span class="sin-foto" role="img" [attr.aria-label]="nombre()">
          <span class="circulo"><mat-icon>{{ iconoFinal() }}</mat-icon></span>
        </span>
      }
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: #fff;
      border-radius: inherit;
      overflow: hidden;
      container-type: size;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      opacity: 0;
      transform: scale(0.97);
      transition: opacity 320ms ease, transform 320ms ease;
    }
    img.cargada {
      opacity: 1;
      transform: none;
    }
    .sin-foto {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 50% 40%, #FBF7FD 0%, #F3EAF8 55%, #E9DCF1 100%);
    }
    .circulo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56cqmin;
      height: 56cqmin;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 4px 14px rgba(107, 45, 140, 0.16);
    }
    .circulo mat-icon {
      width: auto;
      height: auto;
      font-size: 30cqmin;
      line-height: 1;
      color: #6B2D8C;
    }
    :host-context(html.theme-dark) .sin-foto {
      background: radial-gradient(circle at 50% 40%, #33214A 0%, #281B35 60%, #1E1428 100%);
    }
    :host-context(html.theme-dark) .circulo {
      background: #3A2A4A;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
    }
    :host-context(html.theme-dark) .circulo mat-icon {
      color: #D3B4EE !important;
    }
    @media (prefers-reduced-motion: reduce) {
      img { transition: none; }
    }
  `,
})
export class ProductoImagenComponent {
  private fotos = inject(FotosService);

  // ── INPUTS ────────────────────────────────
  nombre = input.required<string>(); // Nombre del producto (define el archivo)
  icono  = input<string>('');        // Ícono de la API, último respaldo

  // ── ESTADO ────────────────────────────────
  // fallo: la imagen no cargó. cargada: ya se puede mostrar con fundido.
  // Ambos vuelven a false cuando cambia el producto.
  fallo   = linkedSignal(() => (this.nombre(), false));
  cargada = linkedSignal(() => (this.nombre(), false));

  src        = computed(() => imagenProducto(this.nombre()));
  iconoFinal = computed(() => iconoProducto(this.nombre(), this.icono()));

  // 'cargando' hasta tener el manifest; después foto o ícono
  estado = computed<'cargando' | 'foto' | 'icono'>(() => {
    const tiene = this.fotos.tieneFoto(this.nombre());
    if (tiene === null) return 'cargando';
    return tiene && !this.fallo() ? 'foto' : 'icono';
  });
}
