package co.edu.unbosque.horarios.aplicacion.catalogos;

import java.util.List;

/** Formas JSON de la gestión de catálogos. Fijadas en PLAN_USUARIOS_M3.md sección 2.2. */
public final class DtoCatalogos {

    private DtoCatalogos() { }

    public record FranjaDisponible(String dia, String horaInicio) { }

    public record DocenteGestion(String id, String nombre, String dedicacion, String escalafon,
                                 List<FranjaDisponible> disponibilidad) { }

    public record AulaGestion(String id, Integer capacidad, List<String> caracteristicas) { }

    public record MateriaGestion(String id, String nombre, Integer numSesiones, List<String> requisitos,
                                 List<String> docentesHabilitados) { }

    public record GrupoGestion(String id, String idCurso, Integer matriculados) { }
}
