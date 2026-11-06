/** Tipos del portal del docente (perfil DOCENTE). Contrato en PLAN_USUARIOS_M3.md. */
import { Asignacion, Franja } from './modelos';
import { FranjaDisponible } from './modelos-gestion';

export interface Perfil { usuario: string; rol: string; idDocente: string; nombreDocente: string; }
export interface MiHorario { idEjecucion: number; fechaPublicacion: string; docente: string; asignaciones: Asignacion[]; }
export interface MiDisponibilidad { franjasValidas: Franja[]; disponibles: FranjaDisponible[]; }
export interface CambioContrasena { actual: string; nueva: string; }
