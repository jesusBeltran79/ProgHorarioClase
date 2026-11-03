import { Routes } from '@angular/router';
import { guardiaSesion } from './nucleo/guardia';
import { IngresoComponent } from './paginas/ingreso.component';
import { MarcoComponent } from './paginas/marco.component';
import { CargaComponent } from './paginas/carga.component';
import { ParametrosComponent } from './paginas/parametros.component';
import { HorarioComponent } from './paginas/horario.component';

export const routes: Routes = [
  { path: 'ingresar', component: IngresoComponent },
  {
    path: '', component: MarcoComponent, canActivate: [guardiaSesion], children: [
      { path: 'carga', component: CargaComponent },
      { path: 'parametros', component: ParametrosComponent },
      { path: 'horario', component: HorarioComponent },
      { path: '', pathMatch: 'full', redirectTo: 'carga' }
    ]
  },
  { path: '**', redirectTo: '' }
];
