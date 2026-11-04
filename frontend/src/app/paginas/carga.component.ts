import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../nucleo/api.service';
import { ErrorApi, ResumenCarga } from '../nucleo/modelos';

type Clave = 'docentes' | 'aulas' | 'cursos' | 'grupos';

/** Paso 1. Carga de los cuatro inventarios CSV y resultado de la validación previa (RF-01 a RF-05). */
@Component({
  selector: 'app-carga',
  standalone: true,
  template: `
  <div class="encabezado">
    <div>
      <h2>1. Cargar inventarios y validar datos</h2>
      <div class="meta">Los cuatro archivos se leen una sola vez y se revisan antes de asignar (RF-01 a RF-05)</div>
    </div>
    <button class="btn" (click)="ir()" [disabled]="!resumen() || resumen()!.cargados.sesiones === 0">Continuar a parámetros →</button>
  </div>

  <section class="tarjeta">
    <h3>Archivos de entrada</h3>
    <table>
      <thead><tr><th>Inventario</th><th>Archivo seleccionado</th><th>Registros guardados</th><th></th></tr></thead>
      <tbody>
        @for (f of filas; track f.clave) {
          <tr>
            <td>{{ f.titulo }}</td>
            <td>{{ archivos[f.clave]?.name ?? 'Sin seleccionar' }}</td>
            <td>{{ resumen() ? resumen()!.cargados[f.clave] : '—' }}</td>
            <td><label class="btn sec archivo">Elegir {{ f.clave }}.csv
              <input type="file" accept=".csv,text/csv" (change)="elegir(f.clave, $event)" [attr.data-prueba]="f.clave"></label></td>
          </tr>
        }
      </tbody>
    </table>
    <div class="acciones">
      <button class="btn" (click)="cargar()" [disabled]="!completos() || cargando()">{{ cargando() ? 'Cargando…' : 'Cargar y validar' }}</button>
      <span class="meta">Una carga nueva reemplaza los inventarios anteriores y su historial de horarios</span>
    </div>
    @if (error()) {
      <div class="alerta error"><b>{{ error()!.codigo }}</b> {{ error()!.mensaje }}
        @for (d of error()!.detalles; track $index) { <div>{{ d }}</div> }
      </div>
    }
  </section>

  @if (resumen(); as r) {
    <section class="tarjeta">
      <h3>Resultado de la carga</h3>
      <p class="meta">{{ r.cargados.docentes }} docentes · {{ r.cargados.aulas }} aulas · {{ r.cargados.cursos }} cursos ·
        {{ r.cargados.grupos }} grupos · {{ r.cargados.sesiones }} sesiones por asignar</p>
      @if (r.rechazos.length) {
        <h4>Filas rechazadas ({{ r.rechazos.length }})</h4>
        <table class="compacta">
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
      <h4>Validación previa de grupos (RF-05)</h4>
      @if (r.hallazgos.length) {
        <table class="compacta">
          <thead><tr><th>Código</th><th>Grupo</th><th>Hallazgo</th></tr></thead>
          <tbody>
            @for (h of r.hallazgos; track $index) {
              <tr><td><span class="codigo" [class.rojo]="h.codigo === 'RV-01'" [class.ambar]="h.codigo === 'RV-02'">{{ h.codigo }}</span></td>
                <td>{{ h.idGrupo }}</td><td>{{ h.mensaje }}</td></tr>
            }
          </tbody>
        </table>
        <p class="meta">Los hallazgos no detienen la generación. Se informan para que el coordinador decida.</p>
      } @else {
        <div class="alerta ok">Ningún grupo supera el tope ni queda por debajo del mínimo</div>
      }
    </section>
  }`
})
export class CargaComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  filas: { clave: Clave; titulo: string }[] = [
    { clave: 'docentes', titulo: 'Docentes y disponibilidad (RF-01)' },
    { clave: 'aulas', titulo: 'Aulas y características (RF-02)' },
    { clave: 'cursos', titulo: 'Cursos y requisitos (RF-03)' },
    { clave: 'grupos', titulo: 'Grupos y matriculados (RF-04)' }
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
