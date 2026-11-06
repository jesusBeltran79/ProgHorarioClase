import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutenticacionService } from '../nucleo/autenticacion.service';
import { ApiService } from '../nucleo/api.service';

/** Pantalla de inicio de sesión del administrador (RNF-06). */
@Component({
  selector: 'app-ingreso',
  standalone: true,
  imports: [FormsModule],
  template: `
  <div class="ingreso">
    <form class="tarjeta ingreso-caja" (ngSubmit)="entrar()">
      <h1>Motor de Horarios</h1>
      <p class="sub">Programa de Ingeniería de Sistemas · Universidad El Bosque</p>
      <label>Usuario
        <input name="usuario" [(ngModel)]="usuario" autocomplete="username" required>
      </label>
      <label>Contraseña
        <input name="contrasena" type="password" [(ngModel)]="contrasena" autocomplete="current-password" required>
      </label>
      @if (error()) { <div class="alerta error">{{ error() }}</div> }
      <button class="btn" type="submit" [disabled]="cargando()">{{ cargando() ? 'Ingresando…' : 'Ingresar' }}</button>
      <p class="nota">Perfiles administrador y docente</p>
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
