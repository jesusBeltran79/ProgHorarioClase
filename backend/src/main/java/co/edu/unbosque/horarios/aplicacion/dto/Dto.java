package co.edu.unbosque.horarios.aplicacion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** Objetos de transferencia de la API REST. La forma de cada uno está fijada en CONTRATO_M3.md. */
public final class Dto {

    private Dto() { }

    public record Cargados(int docentes, int aulas, int cursos, int grupos, int sesiones) { }

    public record Rechazo(String archivo, int fila, String codigo, String motivo) { }

    public record Hallazgo(String codigo, String idGrupo, String mensaje) { }

    public record ResumenCarga(Cargados cargados, List<Rechazo> rechazos, List<Hallazgo> hallazgos) { }

    public record Franja(int idFranja, String dia, String horaInicio, String horaFin) { }

    public record Parametros(int capMax, double tol, int minCierre, int maxSesiones, int durSesionHoras,
                             String aperturaSemana, String cierreSemana, String cierreSabado,
                             String inicioBloqueo, String finBloqueo,
                             Integer umbralMaximoGrupo, List<Franja> franjasValidas) { }

    public record Metricas(long nodosExplorados, long duracionMs, int totalSesiones, int sesionesUbicadas) { }

    public record AsignacionDto(String idSesion, String idCurso, String curso, String idGrupo, int numeroSesion,
                                int matriculados, String idDocente, String docente, String idAula, int capacidadAula,
                                int idFranja, String dia, String horaInicio, String horaFin) { }

    public record Causa(String codigo, int tuplasBloqueadas, String descripcion) { }

    public record Alternativa(int idFranja, String dia, String horaInicio, String horaFin, String idAula,
                              int capacidadAula, String idDocente, String docente, List<String> liberar) { }

    public record Conflicto(String idSesion, String idCurso, String curso, String idGrupo, int matriculados,
                            List<Causa> causas, List<Alternativa> alternativas) { }

    public record Resultado(int idEjecucion, String estado, String fechaHora, String usuario, Metricas metricas,
                            List<AsignacionDto> asignaciones, List<Conflicto> conflictos, List<Hallazgo> hallazgos) { }

    public record Ejecucion(int idEjecucion, String usuario, String fechaHora, String estado,
                            long nodosExplorados, long duracionMs) { }

    public record Reubicacion(@NotBlank String idSesion, @NotNull Integer idFranja,
                              @NotBlank String idAula, @NotBlank String idDocente) { }

    public record Login(@NotBlank String usuario, @NotBlank String contrasena) { }

    public record Token(String token, long expiraEn, String usuario, String rol, String idDocente) { }

    public record ItemCatalogo(String id, String nombre, String detalle) { }

    public record Catalogo(List<ItemCatalogo> docentes, List<ItemCatalogo> aulas) { }

    public record Error(String codigo, String mensaje, List<String> detalles) { }
}
