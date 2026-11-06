import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AutenticacionService } from './autenticacion.service';
import { Rol } from './modelos';

/** Solo deja entrar a las pantallas internas con una sesión vigente. */
export const guardiaSesion: CanActivateFn = () => {
  const auth = inject(AutenticacionService);
  return auth.autenticado() ? true : inject(Router).createUrlTree(['/ingresar']);
};

/** Restringe una ruta a un perfil. Si el perfil no coincide lo manda a su propia página de inicio. */
export function guardiaRol(rol: Rol): CanActivateFn {
  return () => {
    const auth = inject(AutenticacionService);
    if (!auth.autenticado()) return inject(Router).createUrlTree(['/ingresar']);
    return auth.rol() === rol ? true : inject(Router).createUrlTree([auth.inicio()]);
  };
}
