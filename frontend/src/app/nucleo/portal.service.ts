import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CambioContrasena, MiDisponibilidad, MiHorario, Perfil } from './modelos-portal';
import { FranjaDisponible } from './modelos-gestion';

/** Cliente de /api/mi/** para el portal del docente (perfil DOCENTE). */
@Injectable({ providedIn: 'root' })
export class PortalService {
  private http = inject(HttpClient);

  perfil(): Observable<Perfil> { return this.http.get<Perfil>('/api/mi/perfil'); }
  horario(): Observable<MiHorario> { return this.http.get<MiHorario>('/api/mi/horario'); }
  disponibilidad(): Observable<MiDisponibilidad> { return this.http.get<MiDisponibilidad>('/api/mi/disponibilidad'); }
  guardarDisponibilidad(d: FranjaDisponible[]): Observable<MiDisponibilidad> { return this.http.put<MiDisponibilidad>('/api/mi/disponibilidad', d); }
  cambiarContrasena(c: CambioContrasena): Observable<void> { return this.http.put<void>('/api/mi/contrasena', c); }
}
