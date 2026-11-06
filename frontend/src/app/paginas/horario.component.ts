import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { GestionService } from '../nucleo/gestion.service';
import { ApiService } from '../nucleo/api.service';
import {
  Alternativa, Asignacion, Catalogo, Conflicto, DIAS, Ejecucion, ErrorApi, Franja, Resultado
} from '../nucleo/modelos';

type Vista = 'todo' | 'docente' | 'aula' | 'grupo';
interface Fila { rango: string; bloqueada: boolean; }
interface Seleccion { idSesion: string; titulo: string; detalle: string; pendiente: boolean; causas: Conflicto['causas']; }

/**
 * Una sesión se mueve arrastrándola a otra celda o eligiendo una alternativa. Las alternativas las filtra
 * el motor y la asignación manual se valida en el servidor, que rechaza cualquier choque con el código
 * de la restricción que se violaría.
 */
@Component({
  selector: 'app-horario',
  standalone: true,
  imports: [FormsModule, CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPlaceholder],
  template: `
  <div class="encabezado">
    <div>
      <div class="paso">Paso 3 de 3</div>
      <h2>Generar y resolver el horario</h2>
      <p class="intro">Genere el horario, resuelva las sesiones que queden sin lugar, publíquelo para los docentes y expórtelo cuando esté completo.</p>
    </div>
    <div class="botones">
      @if (ejecuciones().length) {
        <label class="historial">Horario mostrado
          <select [ngModel]="resultado()?.idEjecucion" (ngModelChange)="abrir($event)">
            @for (e of ejecuciones(); track e.idEjecucion) {
              <option [ngValue]="e.idEjecucion">N.º {{ e.idEjecucion }} · {{ e.estado === 'COMPLETO' ? 'Completo' : 'Parcial' }} · {{ e.fechaHora }}{{ e.publicado ? ' · publicado' : '' }}</option>
            }
          </select>
        </label>
      }
      <button class="btn" [class.sec]="resultado()?.estado === 'COMPLETO'" (click)="generar()" [disabled]="generando()">
        {{ generando() ? 'Generando…' : 'Generar horario' }}</button>
      @if (resultado()?.publicado) { <span class="etiqueta verde publicado">Publicado a los docentes</span> }
      @else if (resultado()?.estado === 'COMPLETO') {
        <button class="btn sec" (click)="publicar()" [disabled]="publicando()" title="Los docentes podrán verlo en Mi horario">
          {{ publicando() ? 'Publicando…' : 'Publicar' }}</button>
      }
      <button class="btn" [class.bloqueado]="resultado()?.estado === 'PARCIAL'" (click)="exportar()" [disabled]="!resultado()"
        [title]="resultado()?.estado === 'PARCIAL' ? 'Primero hay que ubicar las sesiones pendientes' : 'Descargar el horario en CSV'">Exportar CSV</button>
    </div>
  </div>

  @if (aviso()) { <div class="alerta" [class.error]="aviso()!.tipo === 'error'" [class.ok]="aviso()!.tipo === 'ok'">
    <b>{{ aviso()!.titulo }}</b> {{ aviso()!.texto }}
    @for (d of aviso()!.detalles; track $index) { <div class="detalle">{{ d }}</div> }
  </div> }

  @if (resultado(); as r) {
    @if (r.estado === 'COMPLETO') {
      <div class="banda ok">
        <div><svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/></svg><div><b>Horario completo.</b> Se ubicaron las {{ r.metricas.sesionesUbicadas }} sesiones sin violar ninguna restricción dura. Ya se puede publicar y exportar.
          <div class="meta">{{ detalleEjecucion(r) }}</div></div></div>
        <span class="etiqueta ok">COMPLETO</span>
      </div>
    } @else {
      <div class="banda parcial">
        <div><svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9.5v4"/><path d="M12 17h.01"/></svg><div><b>Horario pendiente de resolución.</b> Se ubicaron {{ r.metricas.sesionesUbicadas }} de {{ r.metricas.totalSesiones }} sesiones.
          {{ r.conflictos.length === 1 ? 'Falta 1' : 'Faltan ' + r.conflictos.length }} y la exportación queda bloqueada hasta resolverlas.
          <div class="meta">{{ detalleEjecucion(r) }}</div></div></div>
        <span class="etiqueta parcial">PARCIAL</span>
      </div>
    }

    <div class="horario" cdkDropListGroup [class.arrastrando]="arrastrando()">
      <section class="tarjeta">
        <div class="filtros">
          <label>Ver por
            <select [ngModel]="vista()" (ngModelChange)="cambiarVista($event)">
              <option value="todo">Todo el horario</option>
              <option value="docente">Docente</option>
              <option value="aula">Aula</option>
              <option value="grupo">Grupo</option>
            </select>
          </label>
          @if (vista() !== 'todo') {
            <label>{{ vista() === 'docente' ? 'Docente' : vista() === 'aula' ? 'Aula' : 'Grupo' }}
              <select [ngModel]="valor()" (ngModelChange)="valor.set($event)">
                @for (o of opciones(); track o.id) { <option [value]="o.id">{{ o.nombre }}</option> }
              </select>
            </label>
          }
        </div>
        <div class="grilla" [style.grid-template-columns]="'64px repeat(' + dias().length + ', minmax(0, 1fr))'">
          <div></div>
          @for (d of dias(); track d) { <div class="cab">{{ nombreDia(d) }}</div> }
          @for (f of filas(); track f.rango) {
            <div class="hora">{{ f.rango }}</div>
            @for (d of dias(); track d) {
              @if (f.bloqueada || !franja(d, f.rango)) {
                <div class="celda bloqueada"></div>
              } @else {
                <div class="celda" [class.sugerida]="sugerida(d, f.rango)" cdkDropList [cdkDropListSortingDisabled]="true"
                     [attr.data-celda]="d + ' ' + f.rango" (cdkDropListDropped)="soltar($event, d, f.rango)">
                  @for (a of enCelda(d, f.rango); track a.idSesion) {
                    <button class="sesion" [class.sel]="seleccion()?.idSesion === a.idSesion" (click)="seleccionar(a)"
                      cdkDrag [cdkDragData]="a.idSesion" [cdkDragDisabled]="moviendo()" (cdkDragStarted)="arrastrando.set(true); seleccionar(a)"
                      (cdkDragEnded)="arrastrando.set(false)"
                      [title]="a.curso + ' · grupo ' + a.idGrupo + ' · sesión ' + a.numeroSesion + ' · ' + a.docente + ' · aula ' + a.idAula + '. Arrástrela para moverla'">
                      <b>{{ a.curso }}</b> · {{ a.idGrupo.split('-').pop() }} · S{{ a.numeroSesion }}<br>{{ a.idAula }} · {{ corto(a.docente) }}
                      <div *cdkDragPlaceholder class="sesion hueco"></div>
                    </button>
                  }
                </div>
              }
            }
          }
        </div>
        <div class="leyenda">
          <span><i class="clase"></i><b>G1 · S2</b> = grupo 1, sesión 2 de la semana</span>
          <span><i class="bloqueada"></i>Fuera del horario</span>
          <span><i class="sugerida"></i>Lugar libre para la sesión elegida</span>
        </div>
        <p class="meta" style="margin: 6px 0 0">Para mover una sesión, arrástrela a una celda con borde verde o haga clic en ella y elija una alternativa.</p>
      </section>

      <aside class="panel">
        @if (r.conflictos.length) {
          <section class="tarjeta">
            <h3>Sesiones pendientes ({{ r.conflictos.length }})</h3>
            <p class="meta">No encontraron lugar. Haga clic en una para ver por qué, o arrástrela a una celda de la grilla.</p>
            <div cdkDropList [cdkDropListSortingDisabled]="true">
            @for (c of r.conflictos; track c.idSesion) {
              <button class="pendiente" [class.sel]="seleccion()?.idSesion === c.idSesion" (click)="seleccionarConflicto(c)"
                cdkDrag [cdkDragData]="c.idSesion" [cdkDragDisabled]="moviendo()" (cdkDragStarted)="arrastrando.set(true); seleccionarConflicto(c)"
                (cdkDragEnded)="arrastrando.set(false)">
                <b>{{ c.curso }}</b> · {{ c.idSesion }}<br><span class="meta">{{ c.matriculados }} matriculados</span>
              </button>
            }
            </div>
          </section>
        }
        @if (seleccion(); as s) {
          <section class="tarjeta">
            <h3>{{ s.pendiente ? 'Sesión pendiente' : 'Sesión seleccionada' }}</h3>
            <div class="titulo-sesion">{{ s.titulo }}</div>
            <div class="meta">{{ s.detalle }}</div>
            @if (s.causas.length) {
              <h4>Causas detectadas</h4>
              @for (c of s.causas; track c.codigo) {
                <div class="causa"><span class="codigo">{{ c.codigo }}</span> {{ c.descripcion }}
                  <span class="meta">Descarta {{ c.tuplasBloqueadas }} {{ c.tuplasBloqueadas === 1 ? 'opción' : 'opciones' }}</span></div>
              }
            }
            <h4>Alternativas válidas</h4>
            @if (cargandoAlt()) { <div class="cargando">Buscando alternativas…</div> }
            @for (a of validas(); track $index) {
              <label class="opcion" [class.activa]="elegida() === a">
                <input type="radio" name="alt" [checked]="elegida() === a" (change)="elegida.set(a)">
                <span>{{ nombreDia(a.dia) }} {{ a.horaInicio }}–{{ a.horaFin }} · aula {{ a.idAula }} ({{ a.capacidadAula }} puestos) · {{ a.docente }}</span>
              </label>
            } @empty { @if (!cargandoAlt()) { <div class="vacio">No hay una ubicación libre que cumpla todas las restricciones.</div> } }
            @if (liberando().length) {
              <h4>Requieren liberar otra sesión</h4>
              <p class="meta">Estos lugares solo sirven si antes se mueve la sesión que los ocupa.</p>
              @for (a of liberando(); track $index) {
                <div class="opcion inactiva"><span>{{ nombreDia(a.dia) }} {{ a.horaInicio }} · {{ a.idAula }} · {{ a.docente }}</span>
                  <span class="codigo" title="Regla con la que choca">{{ a.liberar.join(' ') }}</span></div>
              }
            }
            <button class="btn ancho" style="margin-top: 10px" (click)="aplicarElegida()" [disabled]="!elegida() || moviendo()">
              {{ moviendo() ? 'Aplicando…' : 'Aplicar alternativa' }}</button>
            @if (validas().length && !elegida()) { <p class="meta" style="margin: 6px 0 0">Marque una alternativa para aplicarla, o arrastre la sesión a una celda verde.</p> }

            <details class="manual">
              <summary>Asignación manual</summary>
              <p class="meta">Elija franja, aula y docente. El sistema revisa todas las restricciones y rechaza el cambio si alguna se viola.</p>
              <label>Franja
                <select [(ngModel)]="manualFranja">
                  @for (f of franjas(); track f.idFranja) { <option [ngValue]="f.idFranja">{{ nombreDia(f.dia) }} {{ f.horaInicio }}–{{ f.horaFin }}</option> }
                </select>
              </label>
              <label>Aula
                <select [(ngModel)]="manualAula">
                  @for (a of catalogo()?.aulas ?? []; track a.id) { <option [value]="a.id">{{ a.id }} · {{ a.detalle }}</option> }
                </select>
              </label>
              <label>Docente
                <select [(ngModel)]="manualDocente">
                  @for (d of catalogo()?.docentes ?? []; track d.id) { <option [value]="d.id">{{ d.nombre }}</option> }
                </select>
              </label>
              <button class="btn sec ancho" (click)="aplicarManual()" [disabled]="moviendo() || manualFranja === null || !manualAula || !manualDocente">Intentar asignar</button>
            </details>
          </section>
        } @else {
          <section class="tarjeta ayuda-panel">
            <h3>Ajustar una sesión</h3>
            Haga clic en cualquier sesión de la grilla para:
            <ol>
              <li>ver a dónde más se puede mover,</li>
              <li>ver esos lugares resaltados en verde,</li>
              <li>aplicar el cambio, arrastrarla o asignarla a mano.</li>
            </ol>
          </section>
        }
        @if (r.hallazgos.length) {
          <section class="tarjeta">
            <h3>Avisos sobre los grupos</h3>
            @for (h of r.hallazgos; track $index) { <div class="causa ambar"><span class="codigo">{{ h.codigo }}</span> {{ h.idGrupo }} · {{ h.mensaje }}</div> }
          </section>
        }
      </aside>
    </div>
  } @else if (!ejecuciones().length) {
    <section class="tarjeta inicio">
      <h3>Todavía no hay un horario generado</h3>
      <p>Presione <b>Generar horario</b> arriba a la derecha. El motor ubicará cada sesión cargada en una franja, un aula y un docente sin choques. Si alguna no tiene lugar, verá la causa y las opciones para resolverla.</p>
    </section>
  }`
})
export class HorarioComponent implements OnInit {
  private api = inject(ApiService);
  private gestion = inject(GestionService);

  resultado = signal<Resultado | null>(null);
  ejecuciones = signal<Ejecucion[]>([]);
  franjas = signal<Franja[]>([]);
  catalogo = signal<Catalogo | null>(null);
  vista = signal<Vista>('todo');
  valor = signal<string | null>(null);
  seleccion = signal<Seleccion | null>(null);
  alternativas = signal<Alternativa[]>([]);
  elegida = signal<Alternativa | null>(null);
  cargandoAlt = signal(false);
  generando = signal(false);
  moviendo = signal(false);
  publicando = signal(false);
  arrastrando = signal(false);
  /** Aula y docente actuales de la sesión seleccionada. Al soltar se prefieren para no cambiar más de lo necesario. */
  private actual: { idAula: string; idDocente: string } | null = null;
  aviso = signal<{ tipo: 'ok' | 'error' | 'info'; titulo: string; texto: string; detalles: string[] } | null>(null);
  manualFranja: number | null = null;
  manualAula: string | null = null;
  manualDocente: string | null = null;

  dias = computed(() => Object.keys(DIAS).filter(d => this.franjas().some(f => f.dia === d)));

  filas = computed<Fila[]>(() => {
    const rangos = [...new Map(this.franjas().map(f => [`${f.horaInicio}–${f.horaFin}`, f])).values()]
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    const filas: Fila[] = [];
    rangos.forEach((f, i) => {
      if (i > 0 && rangos[i - 1].horaFin < f.horaInicio) {
        filas.push({ rango: `${rangos[i - 1].horaFin}–${f.horaInicio}`, bloqueada: true });
      }
      filas.push({ rango: `${f.horaInicio}–${f.horaFin}`, bloqueada: false });
    });
    return filas;
  });

  opciones = computed(() => {
    const r = this.resultado();
    if (!r) return [];
    const mapa = new Map<string, string>();
    for (const a of r.asignaciones) {
      if (this.vista() === 'docente') mapa.set(a.idDocente, a.docente);
      if (this.vista() === 'aula') mapa.set(a.idAula, `${a.idAula} (${a.capacidadAula})`);
      if (this.vista() === 'grupo') mapa.set(a.idGrupo, `${a.idGrupo} · ${a.curso}`);
    }
    return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  validas = computed(() => this.alternativas().filter(a => a.liberar.length === 0));
  liberando = computed(() => this.alternativas().filter(a => a.liberar.length > 0));

  ngOnInit(): void {
    this.api.parametros().subscribe(p => this.franjas.set(p.franjasValidas ?? []));
    this.api.catalogo().subscribe({ next: c => this.catalogo.set(c), error: () => { } });
    this.api.ejecuciones().subscribe(lista => {
      this.ejecuciones.set(lista);
      if (lista.length) this.abrir(lista[0].idEjecucion);
    });
  }

  abrir(id: number): void {
    this.api.horario(id).subscribe({
      next: r => this.mostrar(r),
      error: e => this.error('No se pudo abrir el horario', e)
    });
  }

  generar(): void {
    this.generando.set(true);
    this.aviso.set(null);
    this.api.generar().subscribe({
      next: r => {
        this.generando.set(false);
        this.mostrar(r);
        this.api.ejecuciones().subscribe(l => this.ejecuciones.set(l));
      },
      error: e => { this.generando.set(false); this.error('No se pudo generar', e); }
    });
  }

  private mostrar(r: Resultado): void {
    this.resultado.set(r);
    this.seleccion.set(null);
    this.alternativas.set([]);
    this.elegida.set(null);
    if (r.conflictos.length) this.seleccionarConflicto(r.conflictos[0]);
  }

  detalleEjecucion(r: Resultado): string {
    return `Horario N.º ${r.idEjecucion} · generado por ${r.usuario} el ${r.fechaHora} · ${r.metricas.duracionMs} ms · ` +
      `${r.metricas.nodosExplorados.toLocaleString('es-CO')} combinaciones revisadas`;
  }

  cambiarVista(v: Vista): void {
    this.vista.set(v);
    this.valor.set(this.opciones()[0]?.id ?? null);
  }

  enCelda(dia: string, rango: string): Asignacion[] {
    const r = this.resultado();
    if (!r) return [];
    return r.asignaciones.filter(a => a.dia === dia && `${a.horaInicio}–${a.horaFin}` === rango && this.pasaFiltro(a));
  }

  private pasaFiltro(a: Asignacion): boolean {
    switch (this.vista()) {
      case 'docente': return a.idDocente === this.valor();
      case 'aula': return a.idAula === this.valor();
      case 'grupo': return a.idGrupo === this.valor();
      default: return true;
    }
  }

  franja(dia: string, rango: string): Franja | undefined {
    return this.franjas().find(f => f.dia === dia && `${f.horaInicio}–${f.horaFin}` === rango);
  }

  sugerida(dia: string, rango: string): boolean {
    return this.validas().some(a => a.dia === dia && `${a.horaInicio}–${a.horaFin}` === rango);
  }

  seleccionar(a: Asignacion): void {
    this.seleccion.set({ idSesion: a.idSesion, titulo: `${a.curso} · ${a.idGrupo} · Sesión ${a.numeroSesion}`,
      detalle: `${a.matriculados} matriculados · hoy en ${this.nombreDia(a.dia)} ${a.horaInicio} · ${a.idAula} · ${a.docente}`,
      pendiente: false, causas: [] });
    this.actual = { idAula: a.idAula, idDocente: a.idDocente };
    this.prepararManual(a.idFranja, a.idAula, a.idDocente);
    this.buscarAlternativas(a.idSesion);
  }

  seleccionarConflicto(c: Conflicto): void {
    this.seleccion.set({ idSesion: c.idSesion, titulo: `${c.curso} · ${c.idGrupo}`, detalle: `${c.matriculados} matriculados · sin ubicar`,
      pendiente: true, causas: c.causas });
    this.actual = null;
    const primera = c.alternativas[0];
    this.prepararManual(primera?.idFranja ?? this.franjas()[0]?.idFranja ?? null, primera?.idAula ?? null, primera?.idDocente ?? null);
    this.buscarAlternativas(c.idSesion);
  }

  private prepararManual(f: number | null, a: string | null, d: string | null): void {
    this.manualFranja = f;
    this.manualAula = a ?? this.catalogo()?.aulas[0]?.id ?? null;
    this.manualDocente = d ?? this.catalogo()?.docentes[0]?.id ?? null;
  }

  private buscarAlternativas(idSesion: string): void {
    const r = this.resultado();
    if (!r) return;
    this.cargandoAlt.set(true);
    this.alternativas.set([]);
    this.elegida.set(null);
    this.api.alternativas(r.idEjecucion, idSesion).subscribe({
      next: l => { this.cargandoAlt.set(false); this.alternativas.set(l); },
      error: e => { this.cargandoAlt.set(false); this.error('No se pudieron calcular las alternativas', e); }
    });
  }

  /**
   * Soltar una sesión en una celda. Se piden de nuevo las alternativas y se aplica la de esa franja,
   * prefiriendo la misma aula y el mismo docente. Si no hay ninguna se envía igual al servidor, que bloquea
   * el movimiento con el código de la restricción violada y así el coordinador ve la causa.
   */
  soltar(e: CdkDragDrop<unknown>, dia: string, rango: string): void {
    this.arrastrando.set(false);
    const r = this.resultado();
    const destino = this.franja(dia, rango);
    const idSesion = e.item.data as string;
    if (!r || !destino || e.previousContainer === e.container) return;
    const actual = this.actual;
    this.moviendo.set(true);
    this.api.alternativas(r.idEjecucion, idSesion).subscribe({
      next: lista => {
        this.moviendo.set(false);
        const enFranja = lista.filter(a => a.idFranja === destino.idFranja && a.liberar.length === 0);
        const puntaje = (a: Alternativa) => (a.idAula === actual?.idAula ? 2 : 0) + (a.idDocente === actual?.idDocente ? 1 : 0);
        const mejor = [...enFranja].sort((x, y) => puntaje(y) - puntaje(x))[0];
        if (mejor) {
          this.mover(mejor.idFranja, mejor.idAula, mejor.idDocente);
        } else {
          const aula = actual?.idAula ?? this.manualAula;
          const docente = actual?.idDocente ?? this.manualDocente;
          if (aula && docente) this.mover(destino.idFranja, aula, docente);
        }
      },
      error: x => { this.moviendo.set(false); this.error('No se pudieron calcular las alternativas', x); }
    });
  }

  publicar(): void {
    const r = this.resultado();
    if (!r) return;
    this.publicando.set(true);
    this.gestion.publicar(r.idEjecucion).subscribe({
      next: nuevo => {
        this.publicando.set(false);
        this.resultado.set(nuevo);
        this.api.ejecuciones().subscribe(l => this.ejecuciones.set(l));
        this.aviso.set({ tipo: 'ok', titulo: 'Horario publicado.', texto: `Los docentes ya ven el horario N.º ${nuevo.idEjecucion} en Mi horario.`, detalles: [] });
      },
      error: x => { this.publicando.set(false); this.error('No se pudo publicar', x); }
    });
  }

  aplicarElegida(): void {
    const a = this.elegida();
    if (a) this.mover(a.idFranja, a.idAula, a.idDocente);
  }

  aplicarManual(): void {
    if (this.manualFranja !== null && this.manualAula && this.manualDocente) {
      this.mover(this.manualFranja, this.manualAula, this.manualDocente);
    }
  }

  private mover(idFranja: number, idAula: string, idDocente: string): void {
    const r = this.resultado();
    const s = this.seleccion();
    if (!r || !s) return;
    this.moviendo.set(true);
    this.api.reubicar(r.idEjecucion, s.idSesion, idFranja, idAula, idDocente).subscribe({
      next: nuevo => {
        this.moviendo.set(false);
        this.mostrar(nuevo);
        this.api.ejecuciones().subscribe(l => this.ejecuciones.set(l));
        this.aviso.set({ tipo: 'ok', titulo: 'Sesión reubicada.', texto: `${s.idSesion} quedó asignada. El horario está ${nuevo.estado === 'COMPLETO' ? 'completo' : 'parcial'}.`, detalles: [] });
      },
      error: e => { this.moviendo.set(false); this.error('El sistema bloqueó la operación.', e); }
    });
  }

  exportar(): void {
    const r = this.resultado();
    if (!r) return;
    this.api.exportar(r.idEjecucion).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `horario_${r.idEjecucion}.csv`;
        enlace.click();
        URL.revokeObjectURL(url);
        this.aviso.set({ tipo: 'ok', titulo: 'Horario exportado.', texto: `Se descargó horario_${r.idEjecucion}.csv`, detalles: [] });
      },
      error: async (e: HttpErrorResponse) => {
        let err: ErrorApi = ApiService.error(e);
        if (e.error instanceof Blob) {
          try { err = JSON.parse(await e.error.text()) as ErrorApi; } catch { /* el cuerpo no era JSON, queda el error HTTP */ }
        }
        this.aviso.set({ tipo: 'error', titulo: `${err.codigo}.`, texto: err.mensaje, detalles: err.detalles });
      }
    });
  }

  private error(titulo: string, e: unknown): void {
    const err = ApiService.error(e);
    this.aviso.set({ tipo: 'error', titulo: `${titulo} ${err.codigo}.`, texto: err.mensaje, detalles: err.detalles });
  }

  nombreDia(d: string): string { return DIAS[d] ?? d; }

  corto(nombre: string): string {
    const p = nombre.split(' ');
    return p.length > 1 ? `${p[0]} ${p[1][0]}.` : nombre;
  }
}
