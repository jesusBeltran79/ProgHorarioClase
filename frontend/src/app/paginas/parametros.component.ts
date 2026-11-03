import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../nucleo/api.service';
import { DIAS, ErrorApi, Parametros } from '../nucleo/modelos';

/** Paso 2. Parámetros del semestre y vista previa de las franjas válidas (RF-08, RD-03). */
@Component({
  selector: 'app-parametros',
  standalone: true,
  imports: [FormsModule],
  template: `
  <div class="encabezado">
    <div>
      <h2>2. Parámetros del semestre</h2>
      <div class="meta">Los cambios se aplican en la siguiente generación sin tocar código (RF-08)</div>
    </div>
    <button class="btn" (click)="ir()">Continuar a generar →</button>
  </div>
  @if (p(); as v) {
    <div class="dos-columnas">
      <section class="tarjeta">
        <h3>Reglas de grupos y sesiones</h3>
        <label>Tope de estudiantes por grupo (CAP_MAX)<input type="number" [(ngModel)]="v.capMax"></label>
        <label>Tolerancia sobre el tope (TOL, de 0 a 1)<input type="number" step="0.01" [(ngModel)]="v.tol"></label>
        <div class="meta">Umbral efectivo de RV-01 guardado {{ v.umbralMaximoGrupo }} estudiantes</div>
        <label>Mínimo para no cerrar un grupo (MIN_CIERRE)<input type="number" [(ngModel)]="v.minCierre"></label>
        <label>Máximo de sesiones semanales (MAX_SESIONES)<input type="number" [(ngModel)]="v.maxSesiones"></label>
        <label>Duración de cada sesión en horas (DUR_SESION)<input type="number" [(ngModel)]="v.durSesionHoras"></label>
      </section>
      <section class="tarjeta">
        <h3>Ventana de oferta</h3>
        <div class="dos-columnas">
          <label>Apertura<input type="time" [(ngModel)]="v.aperturaSemana"></label>
          <label>Cierre lunes a viernes<input type="time" [(ngModel)]="v.cierreSemana"></label>
          <label>Cierre sábado<input type="time" [(ngModel)]="v.cierreSabado"></label>
          <label>Bloqueo intermedio desde<input type="time" [(ngModel)]="v.inicioBloqueo"></label>
          <label>Bloqueo intermedio hasta<input type="time" [(ngModel)]="v.finBloqueo"></label>
        </div>
        <h3>Franjas válidas guardadas <span class="etiqueta">{{ v.franjasValidas?.length }}</span></h3>
        <div class="semana" [style.grid-template-columns]="'70px repeat(' + dias().length + ', 1fr)'">
          <div></div>
          @for (d of dias(); track d) { <div class="cab">{{ nombreDia(d) }}</div> }
          @for (h of horas(); track h) {
            <div class="cab">{{ h }}</div>
            @for (d of dias(); track d) {
              <div [class.valida]="existe(d, h)" [class.invalida]="!existe(d, h)">{{ existe(d, h) ? '✓' : '' }}</div>
            }
          }
        </div>
      </section>
    </div>
    <div class="acciones">
      <button class="btn" (click)="guardar()" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar parámetros' }}</button>
      @if (ok()) { <span class="alerta ok en-linea">Parámetros guardados. La grilla quedó con {{ v.franjasValidas?.length }} franjas</span> }
    </div>
    @if (error()) {
      <div class="alerta error"><b>{{ error()!.codigo }}</b> {{ error()!.mensaje }}
        @for (d of error()!.detalles; track $index) { <div>{{ d }}</div> }
      </div>
    }
  }`
})
export class ParametrosComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  p = signal<Parametros | null>(null);
  error = signal<ErrorApi | null>(null);
  ok = signal(false);
  guardando = signal(false);

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
      next: r => { this.guardando.set(false); this.p.set(r); this.ok.set(true); },
      error: e => { this.guardando.set(false); this.error.set(ApiService.error(e)); }
    });
  }

  ir(): void { this.router.navigate(['/horario']); }
}
