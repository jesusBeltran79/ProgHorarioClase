/** Tipos de la API REST. La forma de cada uno está fijada en CONTRATO_M3.md. */

export type Rol = 'ADMIN' | 'DOCENTE';
export interface Token { token: string; expiraEn: number; usuario: string; rol: Rol; idDocente: string | null; }

export interface ErrorApi { codigo: string; mensaje: string; detalles: string[]; }

export interface Rechazo { archivo: string; fila: number; codigo: string; motivo: string; }
export interface Hallazgo { codigo: string; idGrupo: string; mensaje: string; }
export interface Cargados { docentes: number; aulas: number; cursos: number; grupos: number; sesiones: number; }
export interface ResumenCarga { cargados: Cargados; rechazos: Rechazo[]; hallazgos: Hallazgo[]; }

export interface Franja { idFranja: number; dia: string; horaInicio: string; horaFin: string; }
export interface Parametros {
  capMax: number; tol: number; minCierre: number; maxSesiones: number; durSesionHoras: number;
  aperturaSemana: string; cierreSemana: string; cierreSabado: string; inicioBloqueo: string; finBloqueo: string;
  umbralMaximoGrupo?: number; franjasValidas?: Franja[];
}

export interface Asignacion {
  idSesion: string; idCurso: string; curso: string; idGrupo: string; numeroSesion: number; matriculados: number;
  idDocente: string; docente: string; idAula: string; capacidadAula: number;
  idFranja: number; dia: string; horaInicio: string; horaFin: string;
}
export interface Causa { codigo: string; tuplasBloqueadas: number; descripcion: string; }
export interface Alternativa {
  idFranja: number; dia: string; horaInicio: string; horaFin: string; idAula: string; capacidadAula: number;
  idDocente: string; docente: string; liberar: string[];
}
export interface Conflicto {
  idSesion: string; idCurso: string; curso: string; idGrupo: string; matriculados: number;
  causas: Causa[]; alternativas: Alternativa[];
}
export interface Metricas { nodosExplorados: number; duracionMs: number; totalSesiones: number; sesionesUbicadas: number; }
export interface Resultado {
  idEjecucion: number; estado: 'COMPLETO' | 'PARCIAL'; fechaHora: string; usuario: string; metricas: Metricas;
  asignaciones: Asignacion[]; conflictos: Conflicto[]; hallazgos: Hallazgo[]; publicado: boolean;
}
export interface Ejecucion { idEjecucion: number; usuario: string; fechaHora: string; estado: string; nodosExplorados: number; duracionMs: number; publicado: boolean; }

export interface ItemCatalogo { id: string; nombre: string; detalle: string; }
export interface Catalogo { docentes: ItemCatalogo[]; aulas: ItemCatalogo[]; }

export const DIAS: Record<string, string> = {
  LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié', JUEVES: 'Jue', VIERNES: 'Vie', SABADO: 'Sáb'
};
