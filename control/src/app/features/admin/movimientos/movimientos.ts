import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule }             from '@angular/material/card';
import { MatButtonModule }           from '@angular/material/button';
import { MatIconModule }             from '@angular/material/icon';
import { MatInputModule }            from '@angular/material/input';
import { MatFormFieldModule }        from '@angular/material/form-field';
import { MatSelectModule }           from '@angular/material/select';
import { MatProgressSpinnerModule }  from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule }            from '@angular/material/table';
import { MatChipsModule }            from '@angular/material/chips';
import { MatTooltipModule }          from '@angular/material/tooltip';
import { MatDividerModule }          from '@angular/material/divider';

import { NavbarComponent }      from '../../../shared/components/navbar/navbar';
import {
  MovimientosService,
  Movimiento,
  FiltrosMovimientos,
  ETIQUETAS_ACCION,
  COLORES_ACCION
} from '../../../core/services/movimientos.service';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    NavbarComponent,
  ],
  templateUrl: './movimientos.html',
  styleUrl:    './movimientos.css'
})
export class MovimientosComponent implements OnInit {

  private movimientosService = inject(MovimientosService);
  private cdr                = inject(ChangeDetectorRef);
  private ngZone             = inject(NgZone);

  // ── Estado ────────────────────────────────────────────────────────
  movimientos:   Movimiento[] = [];
  usuariosList:  string[]     = [];
  cargando       = false;
  total          = 0;
  totalPaginas   = 0;

  // ── Columnas de la tabla ──────────────────────────────────────────
  columnas = ['fecha', 'usuario', 'rol', 'accion', 'detalle', 'ip'];

  // ── Filtros ───────────────────────────────────────────────────────
  filtros: FiltrosMovimientos = {
    page:  1,
    limit: 50
  };

  // ── Opciones de acciones para el select ──────────────────────────
  accionesOpciones = Object.entries(ETIQUETAS_ACCION).map(([value, label]) => ({ value, label }));
  rolesOpciones    = ['admin','empleado','cajero','repositor','cliente','mayorista','invitado'];

  // ── Helpers de UI ─────────────────────────────────────────────────
  etiquetaAccion  = ETIQUETAS_ACCION;
  colorAccion     = COLORES_ACCION;

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarMovimientos();
  }

  cargarUsuarios(): void {
    this.movimientosService.getUsuarios().subscribe({
      next: (lista) => this.ngZone.run(() => {
        this.usuariosList = lista;
        this.cdr.detectChanges();
      }),
      error: (err) => console.error('Error cargando usuarios:', err)
    });
  }

  cargarMovimientos(): void {
    this.cargando = true;
    this.movimientosService.getAll(this.filtros).subscribe({
      next: (resp) => this.ngZone.run(() => {
        this.movimientos   = resp.movimientos;
        this.total         = resp.total;
        this.totalPaginas  = resp.totalPaginas;
        this.cargando      = false;
        this.cdr.detectChanges();
      }),
      error: (err) => this.ngZone.run(() => {
        console.error('Error cargando movimientos:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      })
    });
  }

  aplicarFiltros(): void {
    this.filtros.page = 1;
    this.cargarMovimientos();
  }

  limpiarFiltros(): void {
    this.filtros = { page: 1, limit: 50 };
    this.cargarMovimientos();
  }

  onPageChange(event: PageEvent): void {
    this.filtros.page  = event.pageIndex + 1;
    this.filtros.limit = event.pageSize;
    this.cargarMovimientos();
  }

  // ── Helpers de display ────────────────────────────────────────────
  colorParaRol(rol: string): string {
    const mapa: Record<string, string> = {
      admin:     '#7b1fa2',
      empleado:  '#1565c0',
      cajero:    '#00695c',
      repositor: '#e65100',
      cliente:   '#2e7d32',
      mayorista: '#f57f17',
      invitado:  '#616161',
    };
    return mapa[rol] || '#9e9e9e';
  }
}
