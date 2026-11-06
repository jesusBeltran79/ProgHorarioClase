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
      @if (auth.rol() === 'DOCENTE') {
        <nav>
          <div class="seccion">Mi portal</div>
          <a routerLink="/mi/horario" routerLinkActive="activo"><span class="n">1</span>Mi horario</a>
          <a routerLink="/mi/disponibilidad" routerLinkActive="activo"><span class="n">2</span>Mi disponibilidad</a>
          <a routerLink="/mi/cuenta" routerLinkActive="activo"><span class="n">3</span>Mi cuenta</a>
        </nav>
      } @else {
        <nav>
          <div class="seccion">Gestión</div>
          <a routerLink="/gestion/docentes" routerLinkActive="activo"><span class="n">D</span>Docentes</a>
          <a routerLink="/gestion/aulas" routerLinkActive="activo"><span class="n">A</span>Aulas</a>
          <a routerLink="/gestion/materias" routerLinkActive="activo"><span class="n">M</span>Materias y grupos</a>
          <a routerLink="/gestion/usuarios" routerLinkActive="activo"><span class="n">U</span>Usuarios</a>
          <div class="seccion">Horario</div>
          <a routerLink="/carga" routerLinkActive="activo"><span class="n">1</span>Importar CSV y validar</a>
          <a routerLink="/parametros" routerLinkActive="activo"><span class="n">2</span>Parámetros</a>
          <a routerLink="/horario" routerLinkActive="activo"><span class="n">3</span>Generar y resolver</a>
        </nav>
      }
      <div class="usuario">
        <div>Perfil {{ auth.rol() }} · {{ auth.usuario() }}</div>
        <button class="enlace" (click)="auth.cerrarSesion()">Cerrar sesión</button>
      </div>
    </aside>
    <main class="principal"><router-outlet /></main>
  </div>`
})
export class MarcoComponent {
  auth = inject(AutenticacionService);
}
