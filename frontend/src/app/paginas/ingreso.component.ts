import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutenticacionService } from '../nucleo/autenticacion.service';
import { ApiService } from '../nucleo/api.service';

@Component({
  selector: 'app-ingreso',
  standalone: true,
  imports: [FormsModule],
  template: `
  <div class="ingreso">
    <form class="tarjeta ingreso-caja" (ngSubmit)="entrar()">
      <h1 class="logo" style="margin: 0"><span class="mini-grilla" aria-hidden="true"><i></i><i class="llena"></i><i></i><i></i><i></i><i></i></span><b>Motor de Horarios</b></h1>
      <p class="sub">Programa de Ingeniería de Sistemas · Universidad El Bosque</p>
      <label>Usuario
        <input name="usuario" [(ngModel)]="usuario" autocomplete="username" autofocus required>
      </label>
      <label>Contraseña
        <input name="contrasena" type="password" [(ngModel)]="contrasena" autocomplete="current-password" required>
      </label>
      @if (error()) { <div class="alerta error">{{ error() }}</div> }
      <button class="btn" type="submit" [disabled]="cargando() || !usuario || !contrasena">{{ cargando() ? 'Ingresando…' : 'Ingresar' }}</button>
      <p class="nota">Ingrese con su cuenta de coordinación o de docente</p>
    </form>
  </div>`
})
export class IngresoComponent {
  private auth = inject(AutenticacionService);
  private router = inject(Router);
  usuario = '';
  contrasena = '';
  error = signal<string | null>(null);
  cargando = signal(false);

  entrar(): void {
    this.error.set(null);
    this.cargando.set(true);
    this.auth.iniciarSesion(this.usuario, this.contrasena).subscribe({
      next: () => { this.cargando.set(false); this.router.navigate([this.auth.inicio()]); },
      error: e => { this.cargando.set(false); this.error.set(ApiService.error(e).mensaje); }
    });
  }
}
