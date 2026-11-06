import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from '../../nucleo/api.service';
import { PortalService } from '../../nucleo/portal.service';
import { ErrorApi, Franja } from '../../nucleo/modelos';
import { FranjaDisponible } from '../../nucleo/modelos-gestion';
import { SelectorFranjasComponent } from '../../componentes/selector-franjas.component';
import { ErrorApiComponent } from '../../componentes/error-api.component';

/** RF-14. El docente pinta las franjas en que puede dictar clase. Se usa en la próxima generación. */
@Component({
  selector: 'app-mi-disponibilidad',
  standalone: true,
  imports: [SelectorFranjasComponent, ErrorApiComponent],
  template: `
    <div class="encabezado">
      <div><h2>Mi disponibilidad</h2>
        <div class="meta">Haga clic o arrastre con el botón presionado para marcar o desmarcar franjas</div></div>
      <div class="botones">
        @if (cambios()) { <span class="meta">Cambios sin guardar</span> }
        <button class="btn" (click)="guardar()" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar' }}</button>
      </div>
    </div>
    <app-error-api [error]="error()" />
    @if (aviso()) { <div class="alerta ok">{{ aviso() }}</div> }
    <div class="tarjeta disponibilidad">
      <app-selector-franjas [franjas]="franjas()" [seleccion]="seleccion()" (seleccionChange)="cambiar($event)" />
    </div>
    <p class="meta">El horario publicado no cambia al guardar. La coordinación usará su nueva disponibilidad en la próxima generación.</p>`
})
export class MiDisponibilidadComponent implements OnInit {
  private portal = inject(PortalService);
  franjas = signal<Franja[]>([]);
  seleccion = signal<FranjaDisponible[]>([]);
  cambios = signal(false);
  guardando = signal(false);
  error = signal<ErrorApi | null>(null);
  aviso = signal('');

  ngOnInit() {
    this.portal.disponibilidad().subscribe({
      next: d => this.mostrar(d.franjasValidas, d.disponibles),
      error: e => this.error.set(ApiService.error(e))
    });
  }

  cambiar(s: FranjaDisponible[]) { this.seleccion.set(s); this.cambios.set(true); this.aviso.set(''); }

  guardar() {
    this.guardando.set(true);
    this.error.set(null);
    this.portal.guardarDisponibilidad(this.seleccion()).subscribe({
      next: d => { this.guardando.set(false); this.mostrar(d.franjasValidas, d.disponibles); this.aviso.set(`Disponibilidad guardada con ${d.disponibles.length} franjas`); },
      error: e => { this.guardando.set(false); this.error.set(ApiService.error(e)); }
    });
  }

  private mostrar(f: Franja[], d: FranjaDisponible[]) {
    this.franjas.set(f);
    this.seleccion.set(d.map(x => ({ dia: x.dia, horaInicio: x.horaInicio.substring(0, 5) })));
    this.cambios.set(false);
  }
}
