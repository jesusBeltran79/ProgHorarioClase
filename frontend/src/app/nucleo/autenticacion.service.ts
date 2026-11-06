import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Rol, Token } from './modelos';

const CLAVE = 'horarios.token';

/** Guarda el token JWT del administrador y expone si hay una sesión vigente. */
@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private http = inject(HttpClient);
  private router = inject(Router);
  readonly usuario = signal<string | null>(null);
  readonly rol = signal<Rol | null>(null);
  readonly idDocente = signal<string | null>(null);

  constructor() {
    const t = this.leer();
    if (t && this.vigente(t.token)) this.fijar(t);
  }

  iniciarSesion(usuario: string, contrasena: string): Observable<Token> {
    return this.http.post<Token>('/api/auth/login', { usuario, contrasena }).pipe(tap(t => {
      try { localStorage.setItem(CLAVE, JSON.stringify(t)); } catch { /* sin almacenamiento */ }
      this.memoria = t;
      this.fijar(t);
    }));
  }

  cerrarSesion(): void {
    try { localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
    this.memoria = null;
    this.usuario.set(null);
    this.rol.set(null);
    this.idDocente.set(null);
    this.router.navigate(['/ingresar']);
  }

  token(): string | null {
    const t = this.leer();
    return t && this.vigente(t.token) ? t.token : null;
  }

  autenticado(): boolean {
    return this.token() !== null;
  }

  /** Ruta de inicio según el perfil. */
  inicio(): string {
    return this.rol() === 'DOCENTE' ? '/mi/horario' : '/carga';
  }

  private fijar(t: Token): void {
    this.usuario.set(t.usuario);
    this.rol.set(t.rol ?? 'ADMIN');
    this.idDocente.set(t.idDocente ?? null);
  }

  private memoria: Token | null = null;

  private leer(): Token | null {
    if (this.memoria) return this.memoria;
    try {
      const crudo = localStorage.getItem(CLAVE);
      this.memoria = crudo ? JSON.parse(crudo) as Token : null;
    } catch { this.memoria = null; }
    return this.memoria;
  }

  /** Lee la fecha de expiración del token sin verificar la firma. La firma la verifica el servidor. */
  private vigente(token: string): boolean {
    try {
      const carga = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof carga.exp === 'number' && carga.exp * 1000 > Date.now();
    } catch { return false; }
  }
}
