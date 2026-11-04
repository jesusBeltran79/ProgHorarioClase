import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AutenticacionService } from '../nucleo/autenticacion.service';

/** Marco con la barra lateral de los pasos del coordinador. */
@Component({
  selector: 'app-marco',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <div class="app">
    <aside class="lateral">
      <h1>Motor de Horarios</h1>
      <div class="sub">Programa de Ingeniería de Sistemas</div>
      <nav>
        <a routerLink="/carga" routerLinkActive="activo"><span class="n">1</span>Cargar y validar</a>
        <a routerLink="/parametros" routerLinkActive="activo"><span class="n">2</span>Parámetros</a>
        <a routerLink="/horario" routerLinkActive="activo"><span class="n">3</span>Generar y resolver</a>
      </nav>
      <div class="usuario">
        <div>Perfil ADMIN · {{ auth.usuario() }}</div>
        <button class="enlace" (click)="auth.cerrarSesion()">Cerrar sesión</button>
      </div>
    </aside>
    <main class="principal"><router-outlet /></main>
  </div>`
})
export class MarcoComponent {
  auth = inject(AutenticacionService);
}
