import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmacionDialogData {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  icono?: string;
}

@Component({
  selector: 'app-confirmacion-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirmacion-icono" aria-hidden="true">
      <mat-icon>{{ data.icono || 'warning_amber' }}</mat-icon>
    </div>
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    <mat-dialog-content>{{ data.mensaje }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">
        {{ data.textoCancelar || 'Cancelar' }}
      </button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">
        {{ data.textoConfirmar || 'Eliminar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; padding: 8px 8px 0; }
    .confirmacion-icono {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      margin: 4px 0 12px;
      border-radius: 50%;
      color: #b3261e;
      background: #fce8e6;
    }
    .confirmacion-icono mat-icon { width: 26px; height: 26px; font-size: 26px; }
    [mat-dialog-title] { margin-bottom: 8px; }
    mat-dialog-content { color: #49454f; line-height: 1.5; }
    mat-dialog-actions { gap: 8px; padding: 20px 0 8px; }
  `],
})
export class ConfirmacionDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) readonly data: ConfirmacionDialogData,
  ) {}
}
