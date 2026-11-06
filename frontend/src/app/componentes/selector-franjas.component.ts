import { Component, computed, input, model, signal } from '@angular/core';
import { Franja } from '../nucleo/modelos';
import { FranjaDisponible } from '../nucleo/modelos-gestion';

export const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
export const DIAS_CORTOS: Record<string, string> = {
  LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié', JUEVES: 'Jue', VIERNES: 'Vie', SABADO: 'Sáb'
};

/**
 * Grilla semanal para marcar disponibilidad. Se pinta con clic o arrastrando con el
 * botón presionado. Solo las franjas válidas de la grilla vigente se pueden marcar (RD-03).
 */
@Component({
  selector: 'app-selector-franjas',
  standalone: true,
  template: `
    <div class="pintar" [style.grid-template-columns]="'52px repeat(' + dias.length + ', 1fr)'"
         (mouseleave)="pintando.set(null)" (mouseup)="pintando.set(null)">
      <div></div>
      @for (d of dias; track d) { <div class="cab">{{ cortos[d] }}</div> }
      @for (h of horas(); track h) {
        <div class="hora">{{ h }}</div>
        @for (d of dias; track d) {
          @if (valida(d, h)) {
            <div class="casilla" [class.marcada]="marcada(d, h)" [attr.data-franja]="d + ' ' + h"
                 (mousedown)="iniciar($event, d, h)" (mouseenter)="pasar(d, h)"></div>
          } @else { <div class="casilla fuera"></div> }
        }
      }
    </div>
    <div class="acciones">
      <button type="button" class="btn sec" (click)="todas()">Todas</button>
      <button type="button" class="btn sec" (click)="seleccion.set([])">Ninguna</button>
      <span class="meta">{{ seleccion().length }} de {{ franjas().length }} franjas marcadas</span>
    </div>`
})
export class SelectorFranjasComponent {
  franjas = input.required<Franja[]>();
  seleccion = model<FranjaDisponible[]>([]);
  dias = DIAS;
  cortos = DIAS_CORTOS;
  pintando = signal<boolean | null>(null);

  horas = computed(() => [...new Set(this.franjas().map(f => f.horaInicio))].sort());
  private validas = computed(() => new Set(this.franjas().map(f => f.dia + ' ' + f.horaInicio)));
  private marcadas = computed(() => new Set(this.seleccion().map(f => f.dia + ' ' + f.horaInicio.substring(0, 5))));

  valida(d: string, h: string) { return this.validas().has(d + ' ' + h); }
  marcada(d: string, h: string) { return this.marcadas().has(d + ' ' + h); }

  iniciar(e: MouseEvent, d: string, h: string) {
    e.preventDefault();
    const valor = !this.marcada(d, h);
    this.pintando.set(valor);
    this.poner(d, h, valor);
  }

  pasar(d: string, h: string) {
    const v = this.pintando();
    if (v !== null) this.poner(d, h, v);
  }

  todas() { this.seleccion.set(this.franjas().map(f => ({ dia: f.dia, horaInicio: f.horaInicio }))); }

  private poner(d: string, h: string, valor: boolean) {
    if (this.marcada(d, h) === valor) return;
    const resto = this.seleccion().filter(f => !(f.dia === d && f.horaInicio.substring(0, 5) === h));
    this.seleccion.set(valor ? [...resto, { dia: d, horaInicio: h }] : resto);
  }
}
