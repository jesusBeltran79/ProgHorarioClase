import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AutenticacionService } from './autenticacion.service';

/** Solo deja entrar a las pantallas internas con una sesión vigente. */
export const guardiaSesion: CanActivateFn = () => {
  const auth = inject(AutenticacionService);
  return auth.autenticado() ? true : inject(Router).createUrlTree(['/ingresar']);
};
