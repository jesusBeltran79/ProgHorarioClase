package co.edu.unbosque.horarios.persistencia;

import co.edu.unbosque.horarios.dominio.Asignacion;
import co.edu.unbosque.horarios.persistencia.csv.LectorCSV;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Exporta el horario en el formato de salida de la Tabla D2 (RF-09).
 * No incluye datos personales de estudiantes (RNF-06).
 */
public final class ExportadorHorarioCSV {

    public static final String ENCABEZADO = "curso,grupo,sesion,docente,aula,dia,hora_inicio,hora_fin";

    public String exportar(List<Asignacion> asignaciones) {
        List<Asignacion> orden = new ArrayList<>(asignaciones);
        orden.sort(Comparator.comparingInt((Asignacion a) -> a.getFranja().getIndice())
                .thenComparing(a -> a.getAula().getId()));
        StringBuilder sb = new StringBuilder(ENCABEZADO).append('\n');
        for (Asignacion a : orden) {
            sb.append(LectorCSV.escapar(a.getSesion().getGrupo().getCurso().getNombre())).append(',')
              .append(LectorCSV.escapar(a.getSesion().getGrupo().getId())).append(',')
              .append(a.getSesion().getNumeroSesion()).append(',')
              .append(LectorCSV.escapar(a.getDocente().getNombre())).append(',')
              .append(LectorCSV.escapar(a.getAula().getId())).append(',')
              .append(a.getFranja().getDia().name()).append(',')
              .append(a.getFranja().getHoraInicio()).append(',')
              .append(a.getFranja().getHoraFin()).append('\n');
        }
        return sb.toString();
    }
}
