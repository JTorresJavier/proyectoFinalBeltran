// ── IMPORTS ──────────────────────────────────
import {
  trigger, transition, style, animate
} from '@angular/animations';

// ── ANIMACIÓN DE FORMULARIO ───────────────────
// Se dispara cuando el elemento con [@formAnimation] entra al DOM
// (cuando el @if pasa de false a true).
export const formAnimation = trigger('formAnimation', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-10px)', height: '0', overflow: 'hidden' }),
    animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)', height: '*' }))
  ]),
  transition(':leave', [
    animate('180ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
  ]),
]);
