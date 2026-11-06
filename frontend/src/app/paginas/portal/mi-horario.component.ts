import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../nucleo/api.service';
import { PortalService } from '../../nucleo/portal.service';
import { Asignacion, DIAS, ErrorApi, Franja } from '../../nucleo/modelos';
import { MiHorario } from '../../nucleo/modelos-portal';

/** RF-12. El docente ve solo sus sesiones del horario que publicó la coordinación. */
@Component({
  selector: 'app-mi-horario',
  standalone: true,
  template: `
    <div class="encabezado">
      <div><h2>Mi horario</h2>
        <div class="meta">@if (horario(); as h) { {{ h.docente }} · horario publicado #{{ h.idEjecucion }} del {{ h.fechaPublicacion }} · {{ h.asignaciones.length }} sesiones }</div>
      </div>
    </div>
    @if (sinPublicar()) {
      <div class="alerta">Todavía no hay un horario publicado. Cuando la coordinación lo publique aparecerá aquí. Mientras tanto puede revisar su disponibilidad.</div>
    }
    @if (error(); as e) { <div class="alerta error"><b>{{ e.codigo }}</b> {{ e.mensaje }}</div> }
    @if (horario()) {
      <div class="tarjeta">
        <div class="grilla" [style.grid-template-columns]="'64px repeat(' + dias().length + ', minmax(0, 1fr))'">
          <div></div>
          @for (d of dias(); track d) { <div class="cab">{{ nombre(d) }}</div> }
          @for (r of rangos(); track r) {
            <div class="hora">{{ r }}</div>
            @for (d of dias(); track d) {
              @if (!valida(d, r)) { <div class="celda bloqueada"></div> }
              @else {
                <div class="celda">
                  @for (a of en(d, r); track a.idSesion) {
                    <div class="sesion propia"><b>{{ a.curso }}</b> · {{ a.idGrupo }}<br>{{ a.idAula }} · {{ a.matriculados }} estudiantes</div>
                  }
                </div>
              }
            }
          }
        </div>
      </div>
      <div class="tarjeta">
        <h3>Listado</h3>
        <table class="compacta">
          <tr><th>Día</th><th>Hora</th><th>Materia</th><th>Grupo</th><th>Aula</th></tr>
          @for (a of ordenadas(); track a.idSesion) {
            <tr><td>{{ nombre(a.dia) }}</td><td>{{ a.horaInicio }}–{{ a.horaFin }}</td><td>{{ a.curso }}</td><td>{{ a.idGrupo }}</td><td>{{ a.idAula }}</td></tr>
          }
        </table>
      </div>
    }`
})
export class MiHorarioComponent implements OnInit {
  private api = inject(ApiService);
  private portal = inject(PortalService);
  horario = signal<MiHorario | null>(null);
  franjas = signal<Franja[]>([]);
  sinPublicar = signal(false);
  error = signal<ErrorApi | null>(null);

  dias = computed(() => Object.keys(DIAS).filter(d => this.franjas().some(f => f.dia === d)));
  rangos = computed(() => [...new Set(this.franjas().map(f => `${f.horaInicio}–${f.horaFin}`))].sort());
  ordenadas = computed(() => {
    const orden = Object.keys(DIAS);
    return [...(this.horario()?.asignaciones ?? [])].sort((a, b) => orden.indexOf(a.dia) - orden.indexOf(b.dia) || a.horaInicio.localeCompare(b.horaInicio));
  });

  ngOnInit() {
    this.api.parametros().subscribe(p => this.franjas.set(p.franjasValidas ?? []));
    this.portal.horario().subscribe({
      next: h => this.horario.set(h),
      error: e => {
        const err = ApiService.error(e);
        if (err.codigo === 'SIN_PUBLICAR') this.sinPublicar.set(true); else this.error.set(err);
      }
    });
  }

  valida(d: string, r: string) { return this.franjas().some(f => f.dia === d && `${f.horaInicio}–${f.horaFin}` === r); }
  en(d: string, r: string): Asignacion[] { return (this.horario()?.asignaciones ?? []).filter(a => a.dia === d && `${a.horaInicio}–${a.horaFin}` === r); }
  nombre(d: string) { return DIAS[d] ?? d; }
}
