/** Tipos de la gestión de catálogos y usuarios (perfil ADMIN). Contrato en PLAN_USUARIOS_M3.md. */
import { Rol } from './modelos';

export interface FranjaDisponible { dia: string; horaInicio: string; }

export interface DocenteGestion {
  id: string; nombre: string; dedicacion: string | null; escalafon: string | null;
  disponibilidad: FranjaDisponible[];
}
export interface AulaGestion { id: string; capacidad: number; caracteristicas: string[]; }
export interface MateriaGestion {
  id: string; nombre: string; numSesiones: number; requisitos: string[]; docentesHabilitados: string[];
}
export interface GrupoGestion { id: string; idCurso: string; matriculados: number; }

export interface UsuarioGestion {
  id: number; nombreUsuario: string; rol: Rol; idDocente: string | null; nombreDocente: string | null; activo: boolean;
}
export interface UsuarioNuevo {
  nombreUsuario: string; rol: Rol; idDocente: string | null; contrasena: string;
}
export interface UsuarioCambio { rol: Rol; idDocente: string | null; activo: boolean; contrasena: string | null; }
