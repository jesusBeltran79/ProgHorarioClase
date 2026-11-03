import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AutenticacionService } from './autenticacion.service';

/** Agrega el encabezado Authorization: Bearer y cierra la sesión si el servidor responde 401. */
export const interceptorJwt: HttpInterceptorFn = (req, next) => {
  const auth = inject(AutenticacionService);
  const token = auth.token();
  const solicitud = token && !req.url.endsWith('/api/auth/login')
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
  return next(solicitud).pipe(catchError((e: HttpErrorResponse) => {
    if (e.status === 401 && !req.url.endsWith('/api/auth/login')) auth.cerrarSesion();
    return throwError(() => e);
  }));
};
