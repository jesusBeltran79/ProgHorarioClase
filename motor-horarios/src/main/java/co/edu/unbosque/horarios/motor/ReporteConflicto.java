package co.edu.unbosque.horarios.motor;

import java.util.List;
import java.util.Map;

/**
 * Diagnóstico de una sesión que no pudo ubicarse (RF-07, RNF-04).
 * Lista todas las restricciones que bloquean sus tuplas, no una sola frase.
 */
public record ReporteConflicto(String idCurso, String idGrupo, String idSesion,
                               Map<String, Integer> tuplasBloqueadasPorCodigo,
                               List<String> alternativasPorLiberacion) {
    public List<String> codigosRestriccionesVioladas() {
        return List.copyOf(tuplasBloqueadasPorCodigo.keySet());
    }
}
