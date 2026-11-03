import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../nucleo/api.service';
import {
  Alternativa, Asignacion, Catalogo, Conflicto, DIAS, Ejecucion, ErrorApi, Franja, Resultado
} from '../nucleo/modelos';

type Vista = 'todo' | 'docente' | 'aula' | 'grupo';
interface Fila { rango: string; bloqueada: boolean; }
interface Seleccion { idSesion: string; titulo: string; detalle: string; pendiente: boolean; causas: Conflicto['causas']; }

/**
 * Paso 3. Generación, consulta del horario y resolución de conflictos (RF-06, RF-07, RF-09).
 * La edición se hace con selección asistida. Las alternativas las filtra el motor y la asignación
 * manual se valida en el servidor, que bloquea cualquier choque con el código de la restricción.
 */
@Component({
  selector: 'app-horario',
  standalone: true,
  imports: [FormsModule],
  template: `
  <div class="encabezado">
    <div>
      <h2>3. Horario generado</h2>
      <div class="meta">
        @if (resultado(); as r) { Ejecución {{ r.idEjecucion }} · {{ r.fechaHora }} · {{ r.usuario }} ·
          {{ r.metricas.duracionMs }} ms · {{ r.metricas.nodosExplorados }} nodos } @else { Todavía no hay un horario generado }
      </div>
    </div>
    <div class="botones">
      @if (ejecuciones().length) {
        <select [ngModel]="resultado()?.idEjecucion" (ngModelChange)="abrir($event)" aria-label="Historial">
          @for (e of ejecuciones(); track e.idEjecucion) { <option [ngValue]="e.idEjecucion">#{{ e.idEjecucion }} {{ e.estado }} {{ e.fechaHora }}</option> }
        </select>
      }
      <button class="btn sec" (click)="generar()" [disabled]="generando()">{{ generando() ? 'Generando…' : 'Generar horario' }}</button>
      <button class="btn" [class.peligro]="resultado()?.estado === 'PARCIAL'" (click)="exportar()" [disabled]="!resultado()">Exportar CSV (RF-09)</button>
    </div>
  </div>

  @if (aviso()) { <div class="alerta" [class.error]="aviso()!.tipo === 'error'" [class.ok]="aviso()!.tipo === 'ok'">
    <b>{{ aviso()!.titulo }}</b> {{ aviso()!.texto }}
    @for (d of aviso()!.detalles; track $index) { <div>{{ d }}</div> }
  </div> }

  @if (resultado(); as r) {
    @if (r.estado === 'COMPLETO') {
      <div class="banda ok"><span><b>Horario completo.</b> Se ubicaron las {{ r.metricas.sesionesUbicadas }} sesiones sin violar ninguna restricción dura.</span><span class="etiqueta">COMPLETO</span></div>
    } @else {
      <div class="banda parcial"><span><b>Horario pendiente de resolución.</b> Se ubicaron {{ r.metricas.sesionesUbicadas }} de {{ r.metricas.totalSesiones }} sesiones.
        Faltan {{ r.conflictos.length }} y la exportación queda bloqueada hasta resolverlas (RD-08).</span><span class="etiqueta">PARCIAL</span></div>
    }

    <div class="horario">
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
                <div class="celda" [class.sugerida]="sugerida(d, f.rango)">
                  @for (a of enCelda(d, f.rango); track a.idSesion) {
                    <button class="sesion" [class.sel]="seleccion()?.idSesion === a.idSesion" (click)="seleccionar(a)"
                      [title]="a.curso + ' · ' + a.docente + ' · ' + a.idAula">
                      <b>{{ a.curso }}</b> · {{ a.idGrupo.split('-').pop() }} · S{{ a.numeroSesion }}<br>{{ a.idAula }} · {{ corto(a.docente) }}
                    </button>
                  }
                </div>
              }
            }
          }
        </div>
        <p class="meta">Las celdas grises no son franjas válidas. Seleccione una sesión para ver sus alternativas o moverla.</p>
      </section>

      <aside class="panel">
        @if (r.conflictos.length) {
          <section class="tarjeta">
            <h3>Sesiones pendientes ({{ r.conflictos.length }})</h3>
            @for (c of r.conflictos; track c.idSesion) {
              <button class="pendiente" [class.sel]="seleccion()?.idSesion === c.idSesion" (click)="seleccionarConflicto(c)">
                <b>{{ c.curso }}</b> · {{ c.idSesion }}<br><span class="meta">{{ c.matriculados }} matriculados</span>
              </button>
            }
          </section>
        }
        @if (seleccion(); as s) {
          <section class="tarjeta">
            <h3>{{ s.pendiente ? 'Sesión pendiente' : 'Sesión seleccionada' }}</h3>
            <div class="titulo-sesion">{{ s.titulo }}</div>
            <div class="meta">{{ s.detalle }}</div>
            @if (s.causas.length) {
              <h4>Causas detectadas (RNF-04)</h4>
              @for (c of s.causas; track c.codigo) {
                <div class="causa"><span class="codigo">{{ c.codigo }}</span> {{ c.descripcion }} <span class="meta">· bloquea {{ c.tuplasBloqueadas }} opciones</span></div>
              }
            }
            <h4>Alternativas válidas</h4>
            @if (cargandoAlt()) { <div class="meta">Buscando alternativas…</div> }
            @for (a of validas(); track $index) {
              <label class="opcion" [class.activa]="elegida() === a">
                <input type="radio" name="alt" [checked]="elegida() === a" (change)="elegida.set(a)">
                <span>{{ nombreDia(a.dia) }} {{ a.horaInicio }}–{{ a.horaFin }} · {{ a.idAula }} ({{ a.capacidadAula }}) · {{ a.docente }}</span>
              </label>
            } @empty { @if (!cargandoAlt()) { <div class="meta">No hay una ubicación libre que cumpla todas las restricciones</div> } }
            @if (liberando().length) {
              <h4>Requieren liberar otra sesión</h4>
              @for (a of liberando(); track $index) {
                <div class="opcion inactiva">{{ nombreDia(a.dia) }} {{ a.horaInicio }} · {{ a.idAula }} · {{ a.docente }} <span class="codigo">{{ a.liberar.join(' ') }}</span></div>
              }
            }
            <button class="btn ancho" (click)="aplicarElegida()" [disabled]="!elegida() || moviendo()">Aplicar alternativa</button>

            <details class="manual">
              <summary>Asignación manual</summary>
              <p class="meta">El servidor revisa todas las restricciones duras y bloquea la operación si alguna se viola.</p>
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
        }
        @if (r.hallazgos.length) {
          <section class="tarjeta">
            <h3>Hallazgos de validación</h3>
            @for (h of r.hallazgos; track $index) { <div class="causa ambar"><span class="codigo">{{ h.codigo }}</span> {{ h.idGrupo }} · {{ h.mensaje }}</div> }
          </section>
        }
      </aside>
    </div>
  }`
})
export class HorarioComponent implements OnInit {
  private api = inject(ApiService);

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
        this.aviso.set({ tipo: r.estado === 'COMPLETO' ? 'ok' : 'info', titulo: `Generación ${r.estado}.`,
          texto: `${r.metricas.sesionesUbicadas} de ${r.metricas.totalSesiones} sesiones en ${r.metricas.duracionMs} ms`, detalles: [] });
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
    this.prepararManual(a.idFranja, a.idAula, a.idDocente);
    this.buscarAlternativas(a.idSesion);
  }

  seleccionarConflicto(c: Conflicto): void {
    this.seleccion.set({ idSesion: c.idSesion, titulo: `${c.curso} · ${c.idGrupo}`, detalle: `${c.matriculados} matriculados · sin ubicar`,
      pendiente: true, causas: c.causas });
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
        this.aviso.set({ tipo: 'ok', titulo: 'Sesión reubicada.', texto: `${s.idSesion} quedó asignada. Estado ${nuevo.estado}`, detalles: [] });
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
          try { err = JSON.parse(await e.error.text()) as ErrorApi; } catch { /* se deja el error genérico */ }
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
