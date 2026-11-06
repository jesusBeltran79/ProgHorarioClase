import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../nucleo/api.service';
import { ErrorApi, ResumenCarga } from '../nucleo/modelos';

type Clave = 'docentes' | 'aulas' | 'cursos' | 'grupos';

@Component({
  selector: 'app-carga',
  standalone: true,
  template: `
  <div class="encabezado">
    <div>
      <div class="paso">Paso 1 de 3</div>
      <h2>Importar inventarios desde CSV y validar</h2>
      <p class="intro">Elija los cuatro archivos CSV y presione Cargar y validar. El sistema revisa cada fila antes de guardarla y le muestra qué rechazó y por qué.</p>
    </div>
  </div>

  <section class="tarjeta">
    <h3>Archivos de entrada <span class="meta">· {{ elegidos() }} de 4 elegidos</span></h3>
    <div class="archivos">
      @for (f of filas; track f.clave) {
        <div class="archivo" [class.listo]="archivos[f.clave]">
          <div class="titulo">{{ f.titulo }}</div>
          <div class="meta">{{ f.contenido }}</div>
          <div class="estado">{{ archivos[f.clave] ? '✓ ' + archivos[f.clave]!.name : 'Ningún archivo elegido' }}</div>
          @if (resumen()) { <div class="meta">Registros guardados: {{ resumen()!.cargados[f.clave] }}</div> }
          <label class="btn sec">{{ archivos[f.clave] ? 'Cambiar archivo' : 'Elegir ' + f.clave + '.csv' }}
            <input type="file" accept=".csv,text/csv" (change)="elegir(f.clave, $event)" [attr.data-prueba]="f.clave"></label>
        </div>
      }
    </div>
    <div class="alerta aviso">Una carga nueva reemplaza los inventarios actuales y borra el historial de horarios generados.</div>
    <div class="acciones">
      <button class="btn" (click)="cargar()" [disabled]="!completos() || cargando()">{{ cargando() ? 'Cargando…' : 'Cargar y validar' }}</button>
      @if (!completos()) { <span class="meta">Falta elegir {{ 4 - elegidos() }} {{ 4 - elegidos() === 1 ? 'archivo' : 'archivos' }}</span> }
    </div>
    @if (error()) {
      <div class="alerta error"><b>No se pudo cargar ({{ error()!.codigo }}).</b> {{ error()!.mensaje }}
        @for (d of error()!.detalles; track $index) { <div class="detalle">{{ d }}</div> }
      </div>
    }
  </section>

  @if (resumen(); as r) {
    <section class="tarjeta">
      <h3>Resultado de la carga</h3>
      <div class="cifras">
        <div class="cifra"><b>{{ r.cargados.docentes }}</b><span>docentes</span></div>
        <div class="cifra"><b>{{ r.cargados.aulas }}</b><span>aulas</span></div>
        <div class="cifra"><b>{{ r.cargados.cursos }}</b><span>cursos</span></div>
        <div class="cifra"><b>{{ r.cargados.grupos }}</b><span>grupos</span></div>
        <div class="cifra"><b>{{ r.cargados.sesiones }}</b><span>sesiones por asignar</span></div>
      </div>

      <h4>Filas rechazadas</h4>
      @if (r.rechazos.length) {
        <div class="alerta error">Se rechazaron {{ r.rechazos.length }} {{ r.rechazos.length === 1 ? 'fila' : 'filas' }}. Corrija el archivo indicado y vuelva a cargar los cuatro.</div>
        <table>
          <thead><tr><th>Archivo</th><th>Fila</th><th>Código</th><th>Motivo</th></tr></thead>
          <tbody>
            @for (x of r.rechazos; track $index) {
              <tr><td>{{ x.archivo }}</td><td>{{ x.fila }}</td><td><span class="codigo rojo">{{ x.codigo }}</span></td><td>{{ x.motivo }}</td></tr>
            }
          </tbody>
        </table>
      } @else {
        <div class="alerta ok">Todas las filas de los cuatro archivos se aceptaron</div>
      }

      <h4>Revisión de grupos</h4>
      @if (r.hallazgos.length) {
        <table>
          <thead><tr><th>Código</th><th>Grupo</th><th>Qué se encontró</th></tr></thead>
          <tbody>
            @for (h of r.hallazgos; track $index) {
              <tr><td><span class="codigo" [class.rojo]="h.codigo === 'RV-01'" [class.ambar]="h.codigo === 'RV-02'">{{ h.codigo }}</span></td>
                <td>{{ h.idGrupo }}</td><td>{{ h.mensaje }}</td></tr>
            }
          </tbody>
        </table>
        <p class="meta" style="margin-top: 8px">Estos avisos no impiden generar el horario. Quedan a decisión del coordinador.</p>
      } @else {
        <div class="alerta ok">Ningún grupo supera el tope ni queda por debajo del mínimo</div>
      }

      <div class="pie">
        <span class="meta">{{ r.cargados.sesiones ? 'Los datos quedaron guardados. El siguiente paso es revisar los parámetros del semestre.' : 'No quedaron sesiones por asignar. Revise los archivos antes de continuar.' }}</span>
        <button class="btn" (click)="ir()" [disabled]="r.cargados.sesiones === 0">Continuar a parámetros →</button>
      </div>
    </section>
  }`
})
export class CargaComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  filas: { clave: Clave; titulo: string; contenido: string }[] = [
    { clave: 'docentes', titulo: 'Docentes', contenido: 'Cursos que puede dictar y franjas en que está disponible' },
    { clave: 'aulas', titulo: 'Aulas', contenido: 'Capacidad y características de cada salón' },
    { clave: 'cursos', titulo: 'Cursos', contenido: 'Sesiones por semana y tipo de aula que exige' },
    { clave: 'grupos', titulo: 'Grupos', contenido: 'Cada grupo con su curso y sus matriculados' }
  ];
  archivos: Partial<Record<Clave, File>> = {};
  resumen = signal<ResumenCarga | null>(null);
  error = signal<ErrorApi | null>(null);
  cargando = signal(false);

  ngOnInit(): void {
    this.api.resumen().subscribe({ next: r => this.resumen.set(r), error: () => { } });
  }

  elegir(clave: Clave, evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    if (entrada.files?.length) this.archivos[clave] = entrada.files[0];
  }

  elegidos(): number {
    return this.filas.filter(f => !!this.archivos[f.clave]).length;
  }

  completos(): boolean {
    return this.filas.every(f => !!this.archivos[f.clave]);
  }

  cargar(): void {
    this.error.set(null);
    this.cargando.set(true);
    this.api.cargarInventarios(this.archivos as Record<Clave, File>).subscribe({
      next: r => { this.cargando.set(false); this.resumen.set(r); },
      error: e => { this.cargando.set(false); this.error.set(ApiService.error(e)); }
    });
  }

  ir(): void { this.router.navigate(['/parametros']); }
}
