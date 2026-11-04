package co.edu.unbosque.horarios.persistencia;

import co.edu.unbosque.horarios.dominio.CaracteristicaAula;
import co.edu.unbosque.horarios.dominio.DiaSemana;

import java.time.LocalTime;
import java.util.List;
import java.util.Set;

/**
 * Resultado de leer los cuatro archivos de entrada. Contiene solo los registros
 * aceptados y la lista de rechazos con su motivo (RF-01 a RF-04, RNF-04).
 */
public record InventarioCargado(List<RegistroDocente> docentes, List<RegistroAula> aulas,
                                List<RegistroCurso> cursos, List<RegistroGrupo> grupos,
                                List<Rechazo> rechazos) {

    public record Disponibilidad(DiaSemana dia, LocalTime horaInicio) { }

    public record RegistroDocente(String id, String nombre, String dedicacion, String escalafon,
                                  List<Disponibilidad> disponibilidad) { }

    public record RegistroAula(String id, int capacidad, Set<CaracteristicaAula> caracteristicas) { }

    public record RegistroCurso(String id, String nombre, int numSesiones,
                                Set<CaracteristicaAula> requisitos, Set<String> docentesHabilitados) { }

    public record RegistroGrupo(String id, String idCurso, int matriculados) { }

    /** Fila rechazada. El código es RD-xx cuando la fila viola una restricción o FORMATO o REFERENCIA. */
    public record Rechazo(String archivo, int fila, String codigo, String motivo) { }
}
