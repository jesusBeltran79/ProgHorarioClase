import { Component, input } from '@angular/core';
import { ErrorApi } from '../nucleo/modelos';

/** Muestra un error de la API con su código, mensaje y detalles, igual que la pantalla de carga. */
@Component({
  selector: 'app-error-api',
  standalone: true,
  template: `
    @if (error(); as e) {
      <div class="alerta error"><b>{{ e.codigo }}</b> {{ e.mensaje }}
        @for (d of e.detalles; track $index) { <div>{{ d }}</div> }
      </div>
    }`
})
export class ErrorApiComponent {
  error = input<ErrorApi | null>(null);
}
