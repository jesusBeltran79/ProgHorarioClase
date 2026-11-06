import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AulaGestion, DocenteGestion, GrupoGestion, MateriaGestion, UsuarioCambio, UsuarioGestion, UsuarioNuevo
} from './modelos-gestion';
import { Resultado } from './modelos';

/** Cliente de /api/admin/** para la gestión de catálogos, usuarios y publicación (perfil ADMIN). */
@Injectable({ providedIn: 'root' })
export class GestionService {
  private http = inject(HttpClient);
  private base = '/api/admin';

  docentes(): Observable<DocenteGestion[]> { return this.http.get<DocenteGestion[]>(`${this.base}/docentes`); }
  crearDocente(d: DocenteGestion): Observable<DocenteGestion> { return this.http.post<DocenteGestion>(`${this.base}/docentes`, d); }
  editarDocente(d: DocenteGestion): Observable<DocenteGestion> { return this.http.put<DocenteGestion>(`${this.base}/docentes/${enc(d.id)}`, d); }
  borrarDocente(id: string): Observable<void> { return this.http.delete<void>(`${this.base}/docentes/${enc(id)}`); }

  aulas(): Observable<AulaGestion[]> { return this.http.get<AulaGestion[]>(`${this.base}/aulas`); }
  crearAula(a: AulaGestion): Observable<AulaGestion> { return this.http.post<AulaGestion>(`${this.base}/aulas`, a); }
  editarAula(a: AulaGestion): Observable<AulaGestion> { return this.http.put<AulaGestion>(`${this.base}/aulas/${enc(a.id)}`, a); }
  borrarAula(id: string): Observable<void> { return this.http.delete<void>(`${this.base}/aulas/${enc(id)}`); }

  materias(): Observable<MateriaGestion[]> { return this.http.get<MateriaGestion[]>(`${this.base}/materias`); }
  crearMateria(m: MateriaGestion): Observable<MateriaGestion> { return this.http.post<MateriaGestion>(`${this.base}/materias`, m); }
  editarMateria(m: MateriaGestion): Observable<MateriaGestion> { return this.http.put<MateriaGestion>(`${this.base}/materias/${enc(m.id)}`, m); }
  borrarMateria(id: string): Observable<void> { return this.http.delete<void>(`${this.base}/materias/${enc(id)}`); }

  grupos(): Observable<GrupoGestion[]> { return this.http.get<GrupoGestion[]>(`${this.base}/grupos`); }
  crearGrupo(g: GrupoGestion): Observable<GrupoGestion> { return this.http.post<GrupoGestion>(`${this.base}/grupos`, g); }
  editarGrupo(g: GrupoGestion): Observable<GrupoGestion> { return this.http.put<GrupoGestion>(`${this.base}/grupos/${enc(g.id)}`, g); }
  borrarGrupo(id: string): Observable<void> { return this.http.delete<void>(`${this.base}/grupos/${enc(id)}`); }

  usuarios(): Observable<UsuarioGestion[]> { return this.http.get<UsuarioGestion[]>(`${this.base}/usuarios`); }
  crearUsuario(u: UsuarioNuevo): Observable<UsuarioGestion> { return this.http.post<UsuarioGestion>(`${this.base}/usuarios`, u); }
  editarUsuario(id: number, c: UsuarioCambio): Observable<UsuarioGestion> { return this.http.put<UsuarioGestion>(`${this.base}/usuarios/${id}`, c); }
  borrarUsuario(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/usuarios/${id}`); }

  publicar(idEjecucion: number): Observable<Resultado> { return this.http.post<Resultado>(`/api/horarios/${idEjecucion}/publicar`, {}); }
}

function enc(v: string): string { return encodeURIComponent(v); }
