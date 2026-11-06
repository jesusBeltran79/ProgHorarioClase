import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../nucleo/api.service';
import { DIAS, ErrorApi, Parametros } from '../nucleo/modelos';

@Component({
  selector: 'app-parametros',
  standalone: true,
  imports: [FormsModule],
  template: `
  <div class="encabezado">
    <div>
      <div class="paso">Paso 2 de 3</div>
      <h2>Parámetros del semestre</h2>
      <p class="intro">Ajuste los topes y el horario de la semana. Los cambios se guardan sin tocar código y se aplican en el siguiente horario que genere.</p>
    </div>
  </div>
  @if (p(); as v) {
    <div class="dos-columnas" (input)="cambios.set(true)">
      <section class="tarjeta">
        <h3>Grupos y sesiones</h3>
        <div class="campos">
          <label>Tope de estudiantes por grupo<input type="number" min="1" [(ngModel)]="v.capMax">
            <span class="pista">Cupo normal de un grupo <code>CAP_MAX</code></span></label>
          <label>Tolerancia sobre el tope<input type="number" step="0.01" min="0" max="1" [(ngModel)]="v.tol">
            <span class="pista">Entre 0 y 1. Por ejemplo 0,10 es un 10 % <code>TOL</code></span></label>
          <label>Mínimo para no cerrar un grupo<input type="number" min="0" [(ngModel)]="v.minCierre">
            <span class="pista">Con menos matriculados el grupo se marca para cierre <code>MIN_CIERRE</code></span></label>
          <label>Máximo de sesiones por semana<input type="number" min="1" [(ngModel)]="v.maxSesiones">
            <span class="pista"><code>MAX_SESIONES</code></span></label>
          <label>Duración de cada sesión (horas)<input type="number" min="1" [(ngModel)]="v.durSesionHoras">
            <span class="pista"><code>DUR_SESION</code></span></label>
        </div>
        <div class="alerta">Con lo guardado, un grupo se marca por exceso a partir de <b>{{ v.umbralMaximoGrupo }}</b> estudiantes (tope más tolerancia).</div>
      </section>
      <section class="tarjeta">
        <h3>Horario de la semana</h3>
        <div class="campos">
          <label>Apertura<input type="time" [(ngModel)]="v.aperturaSemana"></label>
          <label>Cierre de lunes a viernes<input type="time" [(ngModel)]="v.cierreSemana"></label>
          <label>Cierre del sábado<input type="time" [(ngModel)]="v.cierreSabado"></label>
          <span></span>
          <label>Sin clases desde<input type="time" [(ngModel)]="v.inicioBloqueo"></label>
          <label>Sin clases hasta<input type="time" [(ngModel)]="v.finBloqueo"></label>
        </div>
        <h3>Franjas válidas guardadas <span class="etiqueta">{{ v.franjasValidas?.length }}</span></h3>
        <div class="semana" [style.grid-template-columns]="'86px repeat(' + dias().length + ', 1fr)'">
          <div></div>
          @for (d of dias(); track d) { <div class="cab">{{ nombreDia(d) }}</div> }
          @for (h of horas(); track h) {
            <div class="cab">{{ h }}</div>
            @for (d of dias(); track d) {
              <div [class.valida]="existe(d, h)" [class.invalida]="!existe(d, h)">{{ existe(d, h) ? '✓' : '' }}</div>
            }
          }
        </div>
        <div class="leyenda"><span><i class="valida"></i>Franja donde se puede programar</span><span><i class="invalida"></i>Fuera del horario</span></div>
        @if (cambios()) { <p class="meta" style="margin-top: 8px">La vista previa se actualiza al guardar.</p> }
      </section>
    </div>
    @if (error()) {
      <div class="alerta error"><b>No se guardaron los cambios ({{ error()!.codigo }}).</b> {{ error()!.mensaje }}
        @for (d of error()!.detalles; track $index) { <div class="detalle">{{ d }}</div> }
      </div>
    }
    <div class="tarjeta pie" style="margin-top: 0">
      <div class="acciones">
        <button class="btn" (click)="guardar()" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar parámetros' }}</button>
        @if (cambios()) { <span class="alerta aviso en-linea">Hay cambios sin guardar</span> }
        @else if (ok()) { <span class="alerta ok en-linea">Parámetros guardados. La grilla quedó con {{ v.franjasValidas?.length }} franjas</span> }
      </div>
      <button class="btn" [class.sec]="cambios()" (click)="ir()">Continuar a generar →</button>
    </div>
  } @else {
    <p class="cargando">Cargando parámetros…</p>
  }`
})
export class ParametrosComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  p = signal<Parametros | null>(null);
  error = signal<ErrorApi | null>(null);
  ok = signal(false);
  guardando = signal(false);
  cambios = signal(false);

  dias = computed(() => {
    const orden = Object.keys(DIAS);
    const presentes = new Set((this.p()?.franjasValidas ?? []).map(f => f.dia));
    return orden.filter(d => presentes.has(d));
  });
  horas = computed(() => [...new Set((this.p()?.franjasValidas ?? []).map(f => `${f.horaInicio}–${f.horaFin}`))].sort());

  ngOnInit(): void { this.api.parametros().subscribe(v => this.p.set(v)); }

  existe(dia: string, rango: string): boolean {
    return (this.p()?.franjasValidas ?? []).some(f => f.dia === dia && `${f.horaInicio}–${f.horaFin}` === rango);
  }

  nombreDia(d: string): string { return DIAS[d] ?? d; }

  guardar(): void {
    const v = this.p();
    if (!v) return;
    this.error.set(null);
    this.ok.set(false);
    this.guardando.set(true);
    const { umbralMaximoGrupo, franjasValidas, ...cuerpo } = v;
    this.api.guardarParametros(cuerpo as Parametros).subscribe({
      next: r => { this.guardando.set(false); this.p.set(r); this.ok.set(true); this.cambios.set(false); },
      error: e => { this.guardando.set(false); this.error.set(ApiService.error(e)); }
    });
  }

  ir(): void { this.router.navigate(['/horario']); }
}
