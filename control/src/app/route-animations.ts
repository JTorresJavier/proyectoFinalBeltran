// ── IMPORTS ──────────────────────────────────
import {
  trigger, transition, style, query, group, animate
} from '@angular/animations';

// ── ANIMACIÓN DE TRANSICIÓN ENTRE RUTAS ───────
// Al cambiar de página: la que sale se desvanece,
// la que entra aparece con un leve desplazamiento hacia arriba.
export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    // Posiciona ambas páginas superpuestas durante la transición
    query(':enter, :leave', [
      style({ position: 'absolute', top: 0, left: 0, width: '100%' })
    ], { optional: true }),

    // La página que entra arranca invisible y un poco más abajo
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(12px)' })
    ], { optional: true }),

    // Ambas animaciones corren en simultáneo
    group([
      query(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ], { optional: true }),
      query(':enter', [
        animate('250ms 100ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ], { optional: true }),
    ]),
  ]),
]);