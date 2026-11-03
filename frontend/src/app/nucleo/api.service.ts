import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alternativa, Catalogo, Ejecucion, ErrorApi, Parametros, Resultado, ResumenCarga } from './modelos';

/** Cliente de la API REST del motor de horarios. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  cargarInventarios(archivos: { docentes: File; aulas: File; cursos: File; grupos: File }): Observable<ResumenCarga> {
    const datos = new FormData();
    datos.append('docentes', archivos.docentes);
    datos.append('aulas', archivos.aulas);
    datos.append('cursos', archivos.cursos);
    datos.append('grupos', archivos.grupos);
    return this.http.post<ResumenCarga>('/api/inventarios', datos);
  }

  resumen(): Observable<ResumenCarga> { return this.http.get<ResumenCarga>('/api/inventarios/resumen'); }
  catalogo(): Observable<Catalogo> { return this.http.get<Catalogo>('/api/inventarios/catalogo'); }
  parametros(): Observable<Parametros> { return this.http.get<Parametros>('/api/parametros'); }
  guardarParametros(p: Parametros): Observable<Parametros> { return this.http.put<Parametros>('/api/parametros', p); }
  generar(): Observable<Resultado> { return this.http.post<Resultado>('/api/horarios/generar', {}); }
  ejecuciones(): Observable<Ejecucion[]> { return this.http.get<Ejecucion[]>('/api/horarios'); }
  horario(id: number): Observable<Resultado> { return this.http.get<Resultado>(`/api/horarios/${id}`); }

  alternativas(id: number, idSesion: string): Observable<Alternativa[]> {
    return this.http.get<Alternativa[]>(`/api/horarios/${id}/alternativas/${encodeURIComponent(idSesion)}`);
  }

  reubicar(id: number, idSesion: string, idFranja: number, idAula: string, idDocente: string): Observable<Resultado> {
    return this.http.post<Resultado>(`/api/horarios/${id}/reubicar`, { idSesion, idFranja, idAula, idDocente });
  }

  exportar(id: number): Observable<Blob> {
    return this.http.get(`/api/horarios/${id}/exportar`, { responseType: 'blob' });
  }

  /** Convierte cualquier error HTTP en la forma { codigo, mensaje, detalles } del contrato. */
  static error(e: unknown): ErrorApi {
    if (e instanceof HttpErrorResponse) {
      const cuerpo = e.error;
      if (cuerpo && typeof cuerpo === 'object' && 'codigo' in cuerpo) return cuerpo as ErrorApi;
      if (e.status === 0) return { codigo: 'SIN_CONEXION', mensaje: 'No hay conexión con el servidor', detalles: [] };
      return { codigo: `HTTP_${e.status}`, mensaje: e.message, detalles: [] };
    }
    return { codigo: 'ERROR', mensaje: String(e), detalles: [] };
  }
}
