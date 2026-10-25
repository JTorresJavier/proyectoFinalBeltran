// ── IMPORTS ──────────────────────────────────
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { slugProducto } from '../../shared/utils/slug';

// ── SERVICIO: FOTOS DE PRODUCTOS ──────────────
// /public/productos/manifest.json lista las fotos disponibles.
// Se carga una sola vez y evita pedir imágenes que no existen
// (cada 404 quedaría como error en la consola del navegador).
@Injectable({
  providedIn: 'root'
})
export class FotosService {

  private http = inject(HttpClient);

  // null mientras carga; después, el conjunto de slugs con foto
  readonly disponibles = signal<Set<string> | null>(null);

  constructor() {
    this.http.get<string[]>('/productos/manifest.json').subscribe({
      next: (slugs) => this.disponibles.set(new Set(slugs)),
      error: () => this.disponibles.set(new Set()), // Sin manifest: todos usan el ícono
    });
  }

  // true / false cuando el manifest ya cargó; null mientras tanto
  tieneFoto(nombre: string): boolean | null {
    const set = this.disponibles();
    return set ? set.has(slugProducto(nombre)) : null;
  }
}
