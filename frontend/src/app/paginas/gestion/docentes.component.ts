import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../nucleo/api.service';
import { GestionService } from '../../nucleo/gestion.service';
import { ErrorApi, Franja } from '../../nucleo/modelos';
import { DocenteGestion } from '../../nucleo/modelos-gestion';
import { SelectorFranjasComponent } from '../../componentes/selector-franjas.component';
import { ErrorApiComponent } from '../../componentes/error-api.component';
import { AVISO_CATALOGO } from './aviso';

/** Gestión de docentes con su disponibilidad marcada en la grilla semanal. */
@Component({
  selector: 'app-gestion-docentes',
  standalone: true,
  imports: [FormsModule, SelectorFranjasComponent, ErrorApiComponent],
  template: `
    <div class="encabezado">
      <div>
        <div class="paso">Datos del semestre</div>
        <h2>Docentes</h2>
        <p class="intro">{{ docentes().length }} docentes registrados. Edite uno para cambiar sus datos o pintar las franjas en que puede dictar clase.</p>
      </div>
      <div class="botones"><button class="btn" (click)="nuevo()">Nuevo docente</button></div>
    </div>
    <app-error-api [error]="error()" />
    @if (aviso()) { <div class="alerta ok">{{ aviso() }}</div> }
    <div class="gestion">
      <div class="tarjeta">
        <input class="buscar" placeholder="Buscar por código o nombre" [ngModel]="filtro()" (ngModelChange)="filtro.set($event)">
        <table>
          <tr><th>Código</th><th>Nombre</th><th>Dedicación</th><th>Franjas</th><th></th></tr>
          @for (d of visibles(); track d.id) {
            <tr [class.fila-sel]="editando()?.id === d.id && !esNuevo()">
              <td class="codigo">{{ d.id }}</td><td>{{ d.nombre }}</td><td>{{ nombreDedicacion(d.dedicacion) }}</td>
              <td>{{ d.disponibilidad.length }}</td>
              <td class="derecha"><button class="enlace azul" (click)="editar(d)">Editar</button>
                <button class="enlace rojo" (click)="borrar(d)">Borrar</button></td>
            </tr>
          } @empty { <tr><td colspan="5" class="meta">No hay docentes. Créelos con Nuevo docente o impórtelos en el paso 1</td></tr> }
        </table>
      </div>
      @if (editando(); as e) {
        <form class="tarjeta formulario" (ngSubmit)="guardar()">
          <h3>{{ esNuevo() ? 'Nuevo docente' : 'Editar ' + e.id }}</h3>
          <div class="dos-columnas">
            <label>Código <input name="id" [(ngModel)]="e.id" [disabled]="!esNuevo()" required></label>
            <label>Nombre <input name="nombre" [(ngModel)]="e.nombre" required></label>
            <label>Dedicación
              <select name="dedicacion" [(ngModel)]="e.dedicacion">
                <option [value]="''">Sin dato</option><option value="COMPLETO">Tiempo completo</option>
                <option value="MEDIO">Medio tiempo</option><option value="CATEDRA">Cátedra</option>
              </select></label>
            <label>Escalafón <input name="escalafon" [(ngModel)]="e.escalafon"></label>
          </div>
          <h4>Disponibilidad semanal</h4>
          <p class="meta">Haga clic en una franja o arrastre sobre varias para marcarlas.</p>
          <app-selector-franjas [franjas]="franjas()" [(seleccion)]="e.disponibilidad" />
          <div class="acciones">
            <button class="btn" type="submit">Guardar</button>
            <button class="btn sec" type="button" (click)="editando.set(null)">Cancelar</button>
          </div>
        </form>
      } @else {
        <div class="tarjeta ayuda-panel">
          <h3>Editar un docente</h3>
          Presione <b>Editar</b> en la lista o <b>Nuevo docente</b> para abrir el formulario aquí.
        </div>
      }
    </div>`
})
export class GestionDocentesComponent implements OnInit {
  private api = inject(ApiService);
  private gestion = inject(GestionService);
  docentes = signal<DocenteGestion[]>([]);
  franjas = signal<Franja[]>([]);
  filtro = signal('');
  editando = signal<DocenteGestion | null>(null);
  esNuevo = signal(false);
  error = signal<ErrorApi | null>(null);
  aviso = signal('');

  visibles = computed(() => {
    const f = this.filtro().toLowerCase();
    return this.docentes().filter(d => !f || d.id.toLowerCase().includes(f) || d.nombre.toLowerCase().includes(f));
  });

  ngOnInit() {
    this.api.parametros().subscribe(p => this.franjas.set(p.franjasValidas ?? []));
    this.cargar();
  }

  cargar() { this.gestion.docentes().subscribe(d => this.docentes.set(d)); }

  nombreDedicacion(d: string) {
    return ({ COMPLETO: 'Tiempo completo', MEDIO: 'Medio tiempo', CATEDRA: 'Cátedra' } as Record<string, string>)[d] ?? (d || '—');
  }

  nuevo() {
    this.esNuevo.set(true);
    this.editando.set({ id: '', nombre: '', dedicacion: '', escalafon: '', disponibilidad: [] });
  }

  editar(d: DocenteGestion) {
    this.esNuevo.set(false);
    this.editando.set({ ...d, disponibilidad: d.disponibilidad.map(x => ({ dia: x.dia, horaInicio: x.horaInicio.substring(0, 5) })) });
  }

  guardar() {
    const e = this.editando();
    if (!e || !confirm(AVISO_CATALOGO)) return;
    this.error.set(null);
    (this.esNuevo() ? this.gestion.crearDocente(e) : this.gestion.editarDocente(e)).subscribe({
      next: d => { this.aviso.set(`Docente ${d.id} guardado`); this.editando.set(null); this.cargar(); },
      error: x => this.error.set(ApiService.error(x))
    });
  }

  borrar(d: DocenteGestion) {
    if (!confirm(`¿Borrar a ${d.nombre}? También se borra su cuenta de usuario. ${AVISO_CATALOGO}`)) return;
    this.gestion.borrarDocente(d.id).subscribe({
      next: () => { this.aviso.set(`Docente ${d.id} borrado`); this.editando.set(null); this.cargar(); },
      error: x => this.error.set(ApiService.error(x))
    });
  }
}
