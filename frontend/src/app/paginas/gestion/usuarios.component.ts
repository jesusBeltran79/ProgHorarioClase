import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../nucleo/api.service';
import { AutenticacionService } from '../../nucleo/autenticacion.service';
import { GestionService } from '../../nucleo/gestion.service';
import { ErrorApi } from '../../nucleo/modelos';
import { DocenteGestion, UsuarioGestion, UsuarioNuevo } from '../../nucleo/modelos-gestion';
import { ErrorApiComponent } from '../../componentes/error-api.component';

/** RF-11. Cuentas ADMIN y DOCENTE. Cada cuenta DOCENTE queda ligada a un docente del catálogo. */
@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [FormsModule, ErrorApiComponent],
  template: `
    <div class="encabezado">
      <div><h2>Usuarios</h2><div class="meta">{{ usuarios().length }} cuentas · {{ sinCuenta().length }} docentes sin cuenta</div></div>
    </div>
    <app-error-api [error]="error()" />
    @if (aviso()) { <div class="alerta ok">{{ aviso() }}</div> }
    <div class="gestion">
      <div class="tarjeta">
        <table>
          <tr><th>Usuario</th><th>Perfil</th><th>Docente</th><th>Estado</th><th></th></tr>
          @for (u of usuarios(); track u.id) {
            <tr [class.inactiva]="!u.activo">
              <td><b>{{ u.nombreUsuario }}</b> @if (u.nombreUsuario === sesion.usuario()) { <span class="meta">(usted)</span> }</td>
              <td><span class="etiqueta" [class.verde]="u.rol === 'DOCENTE'">{{ u.rol }}</span></td>
              <td>{{ u.nombreDocente ? u.idDocente + ' · ' + u.nombreDocente : '—' }}</td>
              <td>{{ u.activo ? 'Activa' : 'Inactiva' }}</td>
              <td class="derecha">
                <button class="enlace azul" (click)="alternarActivo(u)">{{ u.activo ? 'Desactivar' : 'Activar' }}</button>
                <button class="enlace azul" (click)="restablecer(u)">Restablecer clave</button>
                <button class="enlace rojo" (click)="borrar(u)">Borrar</button>
              </td>
            </tr>
          }
        </table>
      </div>
      <form class="tarjeta formulario" (ngSubmit)="crear()">
        <h3>Nueva cuenta</h3>
        <label>Usuario <input name="u" [(ngModel)]="nueva.nombreUsuario" required></label>
        <label>Perfil
          <select name="r" [(ngModel)]="nueva.rol">
            <option value="DOCENTE">DOCENTE · ve su horario y su disponibilidad</option>
            <option value="ADMIN">ADMIN · gestiona todo</option>
          </select></label>
        @if (nueva.rol === 'DOCENTE') {
          <label>Docente
            <select name="d" [(ngModel)]="nueva.idDocente">
              @for (d of sinCuenta(); track d.id) { <option [value]="d.id">{{ d.id }} · {{ d.nombre }}</option> }
            </select></label>
        }
        <label>Contraseña inicial <input name="c" type="password" [(ngModel)]="nueva.contrasena" minlength="8" required></label>
        <div class="meta">Mínimo 8 caracteres. El docente puede cambiarla desde Mi cuenta.</div>
        <button class="btn ancho" type="submit">Crear cuenta</button>
      </form>
    </div>`
})
export class GestionUsuariosComponent implements OnInit {
  private gestion = inject(GestionService);
  sesion = inject(AutenticacionService);
  usuarios = signal<UsuarioGestion[]>([]);
  docentes = signal<DocenteGestion[]>([]);
  error = signal<ErrorApi | null>(null);
  aviso = signal('');
  nueva: UsuarioNuevo = { nombreUsuario: '', rol: 'DOCENTE', idDocente: null, contrasena: '' };

  sinCuenta = computed(() => {
    const con = new Set(this.usuarios().map(u => u.idDocente).filter(x => !!x));
    return this.docentes().filter(d => !con.has(d.id));
  });

  ngOnInit() { this.cargar(); }

  cargar() {
    forkJoin([this.gestion.usuarios(), this.gestion.docentes()]).subscribe(([u, d]) => {
      this.usuarios.set(u); this.docentes.set(d);
      if (this.nueva.rol === 'DOCENTE' && !this.sinCuenta().some(x => x.id === this.nueva.idDocente)) {
        this.nueva.idDocente = this.sinCuenta()[0]?.id ?? null;
      }
    });
  }

  crear() {
    this.error.set(null);
    const u = { ...this.nueva, idDocente: this.nueva.rol === 'DOCENTE' ? this.nueva.idDocente : null };
    this.gestion.crearUsuario(u).subscribe({
      next: r => { this.aviso.set(`Cuenta ${r.nombreUsuario} creada con perfil ${r.rol}`); this.nueva = { nombreUsuario: '', rol: 'DOCENTE', idDocente: null, contrasena: '' }; this.cargar(); },
      error: x => this.error.set(ApiService.error(x))
    });
  }

  alternarActivo(u: UsuarioGestion) { this.cambiar(u, { activo: !u.activo, contrasena: null }, u.activo ? 'desactivada' : 'activada'); }

  restablecer(u: UsuarioGestion) {
    const c = prompt(`Nueva contraseña para ${u.nombreUsuario} (mínimo 8 caracteres)`);
    if (c) this.cambiar(u, { activo: u.activo, contrasena: c }, 'con contraseña nueva');
  }

  borrar(u: UsuarioGestion) {
    if (!confirm(`¿Borrar la cuenta ${u.nombreUsuario}?`)) return;
    this.gestion.borrarUsuario(u.id).subscribe({
      next: () => { this.aviso.set(`Cuenta ${u.nombreUsuario} borrada`); this.cargar(); },
      error: x => this.error.set(ApiService.error(x))
    });
  }

  private cambiar(u: UsuarioGestion, c: { activo: boolean; contrasena: string | null }, texto: string) {
    this.error.set(null);
    this.gestion.editarUsuario(u.id, { rol: u.rol, idDocente: u.idDocente, ...c }).subscribe({
      next: r => { this.aviso.set(`Cuenta ${r.nombreUsuario} ${texto}`); this.cargar(); },
      error: x => this.error.set(ApiService.error(x))
    });
  }
}
