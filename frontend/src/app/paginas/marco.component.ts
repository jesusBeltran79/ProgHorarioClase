import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AutenticacionService } from '../nucleo/autenticacion.service';

@Component({
  selector: 'app-marco',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <div class="app">
    <aside class="lateral">
      <div class="marca">
        <h1 class="logo" style="margin: 0"><span class="mini-grilla" aria-hidden="true"><i></i><i class="llena"></i><i></i><i></i><i></i><i></i></span><b>Motor de Horarios</b></h1>
        <div class="sub">Programa de Ingeniería de Sistemas</div>
      </div>
      @if (auth.rol() === 'DOCENTE') {
        <nav class="pasos" aria-label="Mi portal">
          <div class="seccion">Mi portal</div>
          <a routerLink="/mi/horario" routerLinkActive="activo">
            <span class="n">1</span><span class="nombre">Mi horario</span><span class="ayuda">Mis clases de la semana</span>
          </a>
          <a routerLink="/mi/disponibilidad" routerLinkActive="activo">
            <span class="n">2</span><span class="nombre">Mi disponibilidad</span><span class="ayuda">Cuándo puedo dictar clase</span>
          </a>
          <a routerLink="/mi/cuenta" routerLinkActive="activo">
            <span class="n">3</span><span class="nombre">Mi cuenta</span><span class="ayuda">Cambiar mi contraseña</span>
          </a>
        </nav>
      } @else {
        <nav class="pasos" aria-label="Menú del coordinador">
          <div class="seccion">Crear el horario</div>
          <a routerLink="/carga" routerLinkActive="activo">
            <span class="n">1</span><span class="nombre">Importar CSV y validar</span><span class="ayuda">Subir los cuatro archivos</span>
          </a>
          <a routerLink="/parametros" routerLinkActive="activo">
            <span class="n">2</span><span class="nombre">Parámetros</span><span class="ayuda">Topes y horario de la semana</span>
          </a>
          <a routerLink="/horario" routerLinkActive="activo">
            <span class="n">3</span><span class="nombre">Generar y resolver</span><span class="ayuda">Crear, ajustar, publicar y exportar</span>
          </a>
          <div class="seccion">Datos del semestre</div>
          <a routerLink="/gestion/docentes" routerLinkActive="activo"><span class="n">D</span><span class="nombre">Docentes</span></a>
          <a routerLink="/gestion/aulas" routerLinkActive="activo"><span class="n">A</span><span class="nombre">Aulas</span></a>
          <a routerLink="/gestion/materias" routerLinkActive="activo"><span class="n">M</span><span class="nombre">Materias y grupos</span></a>
          <a routerLink="/gestion/usuarios" routerLinkActive="activo"><span class="n">U</span><span class="nombre">Usuarios</span></a>
        </nav>
      }
      <div class="usuario">
        <div>Sesión de <b>{{ auth.usuario() }}</b> · {{ auth.rol() === 'DOCENTE' ? 'docente' : 'administrador' }}</div>
        <button class="enlace" (click)="auth.cerrarSesion()">Cerrar sesión</button>
      </div>
    </aside>
    <main class="principal"><router-outlet /></main>
  </div>`
})
export class MarcoComponent {
  auth = inject(AutenticacionService);
}
