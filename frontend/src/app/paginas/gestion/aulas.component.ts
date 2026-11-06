import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../nucleo/api.service';
import { GestionService } from '../../nucleo/gestion.service';
import { ErrorApi } from '../../nucleo/modelos';
import { AulaGestion } from '../../nucleo/modelos-gestion';
import { ErrorApiComponent } from '../../componentes/error-api.component';
import { AVISO_CATALOGO } from './aviso';

export const CARACTERISTICAS = [
  { codigo: 'COMPUTADORES', nombre: 'Computadores' },
  { codigo: 'SILLAS_MOVILES', nombre: 'Sillas móviles' }
];

/** RF-10. Gestión de aulas con capacidad y características. */
@Component({
  selector: 'app-gestion-aulas',
  standalone: true,
  imports: [FormsModule, ErrorApiComponent],
  template: `
    <div class="encabezado">
      <div><h2>Aulas</h2><div class="meta">{{ aulas().length }} aulas registradas</div></div>
      <div class="botones"><button class="btn" (click)="nueva()">Nueva aula</button></div>
    </div>
    <app-error-api [error]="error()" />
    @if (aviso()) { <div class="alerta ok">{{ aviso() }}</div> }
    <div class="gestion">
      <div class="tarjeta">
        <table>
          <tr><th>Código</th><th>Capacidad</th><th>Características</th><th></th></tr>
          @for (a of aulas(); track a.id) {
            <tr><td class="codigo">{{ a.id }}</td><td>{{ a.capacidad }}</td>
              <td>@for (c of a.caracteristicas; track c) { <span class="etiqueta">{{ c }}</span> } @empty { <span class="meta">Ninguna</span> }</td>
              <td class="derecha"><button class="enlace azul" (click)="editar(a)">Editar</button>
                <button class="enlace rojo" (click)="borrar(a)">Borrar</button></td></tr>
          } @empty { <tr><td colspan="4" class="meta">No hay aulas registradas</td></tr> }
        </table>
      </div>
      @if (editando(); as e) {
        <form class="tarjeta formulario" (ngSubmit)="guardar()">
          <h3>{{ esNueva() ? 'Nueva aula' : 'Editar ' + e.id }}</h3>
          <label>Código <input name="id" [(ngModel)]="e.id" [disabled]="!esNueva()" required></label>
          <label>Capacidad <input name="capacidad" type="number" min="1" [(ngModel)]="e.capacidad" required></label>
          <h4>Características</h4>
          @for (c of caracteristicas; track c.codigo) {
            <label class="casilla-texto"><input type="checkbox" [checked]="e.caracteristicas.includes(c.codigo)"
              (change)="alternar(e, c.codigo)"> {{ c.nombre }}</label>
          }
          <div class="acciones">
            <button class="btn" type="submit">Guardar</button>
            <button class="btn sec" type="button" (click)="editando.set(null)">Cancelar</button>
          </div>
        </form>
      }
    </div>`
})
export class GestionAulasComponent implements OnInit {
  private gestion = inject(GestionService);
  caracteristicas = CARACTERISTICAS;
  aulas = signal<AulaGestion[]>([]);
  editando = signal<AulaGestion | null>(null);
  esNueva = signal(false);
  error = signal<ErrorApi | null>(null);
  aviso = signal('');

  ngOnInit() { this.cargar(); }
  cargar() { this.gestion.aulas().subscribe(a => this.aulas.set(a)); }
  nueva() { this.esNueva.set(true); this.editando.set({ id: '', capacidad: 30, caracteristicas: [] }); }
  editar(a: AulaGestion) { this.esNueva.set(false); this.editando.set({ ...a, caracteristicas: [...a.caracteristicas] }); }

  alternar(a: AulaGestion, c: string) {
    a.caracteristicas = a.caracteristicas.includes(c) ? a.caracteristicas.filter(x => x !== c) : [...a.caracteristicas, c];
  }

  guardar() {
    const e = this.editando();
    if (!e || !confirm(AVISO_CATALOGO)) return;
    this.error.set(null);
    (this.esNueva() ? this.gestion.crearAula(e) : this.gestion.editarAula(e)).subscribe({
      next: a => { this.aviso.set(`Aula ${a.id} guardada`); this.editando.set(null); this.cargar(); },
      error: x => this.error.set(ApiService.error(x))
    });
  }

  borrar(a: AulaGestion) {
    if (!confirm(`¿Borrar el aula ${a.id}? ${AVISO_CATALOGO}`)) return;
    this.gestion.borrarAula(a.id).subscribe({
      next: () => { this.aviso.set(`Aula ${a.id} borrada`); this.cargar(); },
      error: x => this.error.set(ApiService.error(x))
    });
  }
}
