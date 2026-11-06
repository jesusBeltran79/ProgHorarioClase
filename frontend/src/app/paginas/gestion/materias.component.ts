import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup, transferArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../nucleo/api.service';
import { GestionService } from '../../nucleo/gestion.service';
import { ErrorApi } from '../../nucleo/modelos';
import { DocenteGestion, GrupoGestion, MateriaGestion } from '../../nucleo/modelos-gestion';
import { ErrorApiComponent } from '../../componentes/error-api.component';
import { CARACTERISTICAS } from './aulas.component';
import { AVISO_CATALOGO } from './aviso';

/**
 * RF-10. Materias y grupos. Los docentes habilitados se asignan arrastrando entre la lista del catálogo y
 * la lista de habilitados (Angular CDK). Cada grupo genera sus sesiones según las sesiones de la materia.
 */
@Component({
  selector: 'app-gestion-materias',
  standalone: true,
  imports: [FormsModule, CdkDropListGroup, CdkDropList, CdkDrag, ErrorApiComponent],
  template: `
    <div class="encabezado">
      <div><h2>Materias y grupos</h2><div class="meta">{{ materias().length }} materias y {{ grupos().length }} grupos</div></div>
      <div class="botones"><button class="btn" (click)="nueva()">Nueva materia</button></div>
    </div>
    <app-error-api [error]="error()" />
    @if (aviso()) { <div class="alerta ok">{{ aviso() }}</div> }
    <div class="materias">
      <div class="tarjeta lista-materias">
        <input class="buscar" placeholder="Buscar materia" [ngModel]="filtro()" (ngModelChange)="filtro.set($event)">
        @for (m of visibles(); track m.id) {
          <button class="item-materia" [class.sel]="editando()?.id === m.id && !esNueva()" (click)="elegir(m)">
            <b>{{ m.nombre }}</b><span class="meta">{{ m.id }} · {{ m.numSesiones }} sesiones · {{ gruposDe(m.id).length }} grupos · {{ m.docentesHabilitados.length }} docentes</span>
          </button>
        } @empty { <div class="meta">No hay materias</div> }
      </div>

      @if (editando(); as e) {
        <div>
          <form class="tarjeta" (ngSubmit)="guardar()">
            <h3>{{ esNueva() ? 'Nueva materia' : e.nombre }}</h3>
            <div class="tres-columnas">
              <label>Código <input name="id" [(ngModel)]="e.id" [disabled]="!esNueva()" required></label>
              <label>Nombre <input name="nombre" [(ngModel)]="e.nombre" required></label>
              <label>Sesiones por semana <input name="ns" type="number" min="1" [max]="maxSesiones()" [(ngModel)]="e.numSesiones"></label>
            </div>
            <h4>Requisitos de aula</h4>
            <div class="botones">
              @for (c of caracteristicas; track c.codigo) {
                <label class="casilla-texto"><input type="checkbox" [checked]="e.requisitos.includes(c.codigo)" (change)="alternar(e, c.codigo)"> {{ c.nombre }}</label>
              }
            </div>
            <h4>Docentes habilitados · arrastre entre las listas</h4>
            <div class="arrastre" cdkDropListGroup>
              <div class="columna-arrastre">
                <div class="titulo-arrastre">Docentes del catálogo <input class="buscar mini" placeholder="Filtrar" [ngModel]="filtroDocente()" (ngModelChange)="filtroDocente.set($event)" name="fd"></div>
                <div class="zona" cdkDropList id="catalogo" [cdkDropListData]="libres()" (cdkDropListDropped)="soltar($event)">
                  @for (d of libres(); track d.id) {
                    <div class="ficha" cdkDrag [cdkDragData]="d" [class.oculta]="!coincide(d)">
                      <b>{{ d.id }}</b> {{ d.nombre }}<div *cdkDragPlaceholder class="ficha hueco"></div>
                    </div>
                  } @empty { <div class="meta vacio">Todos los docentes están habilitados</div> }
                </div>
              </div>
              <div class="columna-arrastre">
                <div class="titulo-arrastre">Habilitados para esta materia ({{ habilitados().length }})</div>
                <div class="zona destino" cdkDropList id="habilitados" [cdkDropListData]="habilitados()" (cdkDropListDropped)="soltar($event)">
                  @for (d of habilitados(); track d.id) {
                    <div class="ficha habilitada" cdkDrag [cdkDragData]="d"><b>{{ d.id }}</b> {{ d.nombre }}</div>
                  } @empty { <div class="meta vacio">Arrastre aquí los docentes que pueden dictar la materia</div> }
                </div>
              </div>
            </div>
            <div class="acciones">
              <button class="btn" type="submit">Guardar materia</button>
              <button class="btn sec" type="button" (click)="editando.set(null)">Cancelar</button>
              @if (!esNueva()) { <button class="btn peligro" type="button" (click)="borrar(e)">Borrar materia</button> }
            </div>
          </form>

          @if (!esNueva()) {
            <div class="tarjeta">
              <h3>Grupos de {{ e.id }}</h3>
              <table class="compacta">
                <tr><th>Grupo</th><th>Matriculados</th><th>Sesiones</th><th></th></tr>
                @for (g of gruposDe(e.id); track g.id) {
                  <tr><td class="codigo">{{ g.id }}</td>
                    <td><input class="mini" type="number" min="0" [(ngModel)]="g.matriculados" [name]="'m' + g.id"></td>
                    <td>{{ e.numSesiones }}</td>
                    <td class="derecha"><button class="enlace azul" (click)="guardarGrupo(g)">Guardar</button>
                      <button class="enlace rojo" (click)="borrarGrupo(g)">Borrar</button></td></tr>
                }
                <tr><td><input class="mini" placeholder="Nuevo grupo" [(ngModel)]="grupoNuevo.id" name="gn"></td>
                  <td><input class="mini" type="number" min="0" [(ngModel)]="grupoNuevo.matriculados" name="gm"></td>
                  <td></td><td class="derecha"><button class="enlace azul" (click)="crearGrupo(e.id)">Agregar</button></td></tr>
              </table>
            </div>
          }
        </div>
      } @else {
        <div class="tarjeta meta">Elija una materia de la lista o cree una nueva</div>
      }
    </div>`
})
export class GestionMateriasComponent implements OnInit {
  private api = inject(ApiService);
  private gestion = inject(GestionService);
  caracteristicas = CARACTERISTICAS;
  materias = signal<MateriaGestion[]>([]);
  grupos = signal<GrupoGestion[]>([]);
  docentes = signal<DocenteGestion[]>([]);
  maxSesiones = signal(4);
  filtro = signal('');
  filtroDocente = signal('');
  editando = signal<MateriaGestion | null>(null);
  esNueva = signal(false);
  habilitados = signal<DocenteGestion[]>([]);
  error = signal<ErrorApi | null>(null);
  aviso = signal('');
  grupoNuevo: GrupoGestion = { id: '', idCurso: '', matriculados: 30 };

  visibles = computed(() => {
    const f = this.filtro().toLowerCase();
    return this.materias().filter(m => !f || m.id.toLowerCase().includes(f) || m.nombre.toLowerCase().includes(f));
  });
  libres = computed(() => {
    const h = new Set(this.habilitados().map(d => d.id));
    return this.docentes().filter(d => !h.has(d.id));
  });

  ngOnInit() {
    this.api.parametros().subscribe(p => this.maxSesiones.set(p.maxSesiones));
    this.cargar();
  }

  cargar(seleccion?: string) {
    forkJoin([this.gestion.materias(), this.gestion.grupos(), this.gestion.docentes()]).subscribe(([m, g, d]) => {
      this.materias.set(m); this.grupos.set(g); this.docentes.set(d);
      const s = m.find(x => x.id === seleccion);
      if (s) this.elegir(s);
    });
  }

  gruposDe(id: string) { return this.grupos().filter(g => g.idCurso === id); }
  coincide(d: DocenteGestion) {
    const f = this.filtroDocente().toLowerCase();
    return !f || d.id.toLowerCase().includes(f) || d.nombre.toLowerCase().includes(f);
  }

  elegir(m: MateriaGestion) {
    this.esNueva.set(false);
    this.error.set(null);
    this.editando.set({ ...m, requisitos: [...m.requisitos], docentesHabilitados: [...m.docentesHabilitados] });
    this.habilitados.set(m.docentesHabilitados.map(id => this.docentes().find(d => d.id === id)).filter((d): d is DocenteGestion => !!d));
    this.grupoNuevo = { id: '', idCurso: m.id, matriculados: 30 };
  }

  nueva() {
    this.esNueva.set(true);
    this.editando.set({ id: '', nombre: '', numSesiones: 2, requisitos: [], docentesHabilitados: [] });
    this.habilitados.set([]);
  }

  alternar(m: MateriaGestion, c: string) {
    m.requisitos = m.requisitos.includes(c) ? m.requisitos.filter(x => x !== c) : [...m.requisitos, c];
  }

  /** Mueve un docente entre "Docentes del catálogo" y "Habilitados". */
  soltar(e: CdkDragDrop<DocenteGestion[]>) {
    const d = e.item.data as DocenteGestion;
    if (e.previousContainer === e.container) {
      if (e.container.id === 'habilitados') {
        const lista = [...this.habilitados()];
        moveItemInArray(lista, e.previousIndex, e.currentIndex);
        this.habilitados.set(lista);
      }
      return;
    }
    if (e.container.id === 'habilitados') {
      const lista = [...this.habilitados()];
      transferArrayItem([d], lista, 0, e.currentIndex);
      this.habilitados.set(lista);
    } else {
      this.habilitados.set(this.habilitados().filter(x => x.id !== d.id));
    }
  }

  guardar() {
    const e = this.editando();
    if (!e || !confirm(AVISO_CATALOGO)) return;
    const m: MateriaGestion = { ...e, docentesHabilitados: this.habilitados().map(d => d.id) };
    this.error.set(null);
    (this.esNueva() ? this.gestion.crearMateria(m) : this.gestion.editarMateria(m)).subscribe({
      next: r => { this.aviso.set(`Materia ${r.id} guardada con ${r.docentesHabilitados.length} docentes habilitados`); this.cargar(r.id); },
      error: x => this.error.set(ApiService.error(x))
    });
  }

  borrar(m: MateriaGestion) {
    if (!confirm(`¿Borrar ${m.nombre} y sus grupos? ${AVISO_CATALOGO}`)) return;
    this.gestion.borrarMateria(m.id).subscribe({
      next: () => { this.aviso.set(`Materia ${m.id} borrada`); this.editando.set(null); this.cargar(); },
      error: x => this.error.set(ApiService.error(x))
    });
  }

  crearGrupo(idCurso: string) {
    if (!confirm(AVISO_CATALOGO)) return;
    this.gestion.crearGrupo({ ...this.grupoNuevo, idCurso }).subscribe({
      next: g => { this.aviso.set(`Grupo ${g.id} creado`); this.cargar(idCurso); },
      error: x => this.error.set(ApiService.error(x))
    });
  }

  guardarGrupo(g: GrupoGestion) {
    if (!confirm(AVISO_CATALOGO)) return;
    this.gestion.editarGrupo(g).subscribe({
      next: r => { this.aviso.set(`Grupo ${r.id} guardado`); this.cargar(r.idCurso); },
      error: x => this.error.set(ApiService.error(x))
    });
  }

  borrarGrupo(g: GrupoGestion) {
    if (!confirm(`¿Borrar el grupo ${g.id}? ${AVISO_CATALOGO}`)) return;
    this.gestion.borrarGrupo(g.id).subscribe({
      next: () => { this.aviso.set(`Grupo ${g.id} borrado`); this.cargar(g.idCurso); },
      error: x => this.error.set(ApiService.error(x))
    });
  }
}
