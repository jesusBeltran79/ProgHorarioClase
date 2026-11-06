import { Routes } from '@angular/router';
import { guardiaRol, guardiaSesion } from './nucleo/guardia';
import { IngresoComponent } from './paginas/ingreso.component';
import { MarcoComponent } from './paginas/marco.component';
import { CargaComponent } from './paginas/carga.component';
import { ParametrosComponent } from './paginas/parametros.component';
import { HorarioComponent } from './paginas/horario.component';
import { GestionDocentesComponent } from './paginas/gestion/docentes.component';
import { GestionAulasComponent } from './paginas/gestion/aulas.component';
import { GestionMateriasComponent } from './paginas/gestion/materias.component';
import { GestionUsuariosComponent } from './paginas/gestion/usuarios.component';
import { MiHorarioComponent } from './paginas/portal/mi-horario.component';
import { MiDisponibilidadComponent } from './paginas/portal/mi-disponibilidad.component';
import { MiCuentaComponent } from './paginas/portal/mi-cuenta.component';

const admin = guardiaRol('ADMIN');
const docente = guardiaRol('DOCENTE');

export const routes: Routes = [
  { path: 'ingresar', component: IngresoComponent },
  {
    path: '', component: MarcoComponent, canActivate: [guardiaSesion], children: [
      // Perfil ADMIN
      { path: 'gestion/docentes', component: GestionDocentesComponent, canActivate: [admin] },
      { path: 'gestion/aulas', component: GestionAulasComponent, canActivate: [admin] },
      { path: 'gestion/materias', component: GestionMateriasComponent, canActivate: [admin] },
      { path: 'gestion/usuarios', component: GestionUsuariosComponent, canActivate: [admin] },
      { path: 'carga', component: CargaComponent, canActivate: [admin] },
      { path: 'parametros', component: ParametrosComponent, canActivate: [admin] },
      { path: 'horario', component: HorarioComponent, canActivate: [admin] },
      // Perfil DOCENTE
      { path: 'mi/horario', component: MiHorarioComponent, canActivate: [docente] },
      { path: 'mi/disponibilidad', component: MiDisponibilidadComponent, canActivate: [docente] },
      { path: 'mi/cuenta', component: MiCuentaComponent, canActivate: [docente] },
      { path: '', pathMatch: 'full', redirectTo: 'carga' }
    ]
  },
  { path: '**', redirectTo: '' }
];
