import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../nucleo/api.service';
import { PortalService } from '../../nucleo/portal.service';
import { ErrorApi } from '../../nucleo/modelos';
import { Perfil } from '../../nucleo/modelos-portal';
import { ErrorApiComponent } from '../../componentes/error-api.component';

/** Mi cuenta. Datos del perfil y cambio de contraseña con la contraseña actual. */
@Component({
  selector: 'app-mi-cuenta',
  standalone: true,
  imports: [FormsModule, ErrorApiComponent],
  template: `
    <div class="encabezado"><div>
      <div class="paso">Mi portal</div>
      <h2>Mi cuenta</h2>
      <p class="intro">Sus datos de acceso al sistema.</p>
    </div></div>
    <div class="dos-columnas">
      <div class="tarjeta">
        <h3>Perfil</h3>
        @if (perfil(); as p) {
          <table class="compacta">
            <tr><td class="meta">Usuario</td><td><b>{{ p.usuario }}</b></td></tr>
            <tr><td class="meta">Perfil</td><td><span class="etiqueta verde">{{ p.rol === 'DOCENTE' ? 'Docente' : 'Administrador' }}</span></td></tr>
            <tr><td class="meta">Docente</td><td>{{ p.idDocente }} · {{ p.nombreDocente }}</td></tr>
          </table>
        }
      </div>
      <form class="tarjeta" (ngSubmit)="cambiar()">
        <h3>Cambiar contraseña</h3>
        <app-error-api [error]="error()" />
        @if (aviso()) { <div class="alerta ok">{{ aviso() }}</div> }
        <label>Contraseña actual <input type="password" name="a" [(ngModel)]="actual" required></label>
        <label>Contraseña nueva <input type="password" name="n" [(ngModel)]="nueva" minlength="8" required></label>
        <label>Repita la contraseña nueva <input type="password" name="r" [(ngModel)]="repetida" required></label>
        <button class="btn ancho" type="submit" [disabled]="!actual || nueva.length < 8 || nueva !== repetida">Cambiar contraseña</button>
        @if (nueva && nueva !== repetida) { <div class="alerta aviso">Las contraseñas nuevas no coinciden</div> }
      </form>
    </div>`
})
export class MiCuentaComponent implements OnInit {
  private portal = inject(PortalService);
  perfil = signal<Perfil | null>(null);
  error = signal<ErrorApi | null>(null);
  aviso = signal('');
  actual = '';
  nueva = '';
  repetida = '';

  ngOnInit() { this.portal.perfil().subscribe(p => this.perfil.set(p)); }

  cambiar() {
    this.error.set(null);
    this.portal.cambiarContrasena({ actual: this.actual, nueva: this.nueva }).subscribe({
      next: () => { this.aviso.set('Contraseña actualizada'); this.actual = this.nueva = this.repetida = ''; },
      error: e => this.error.set(ApiService.error(e))
    });
  }
}
