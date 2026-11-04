package co.edu.unbosque.horarios.restricciones;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.Asignacion;
import co.edu.unbosque.horarios.motor.EstadoHorario;

/**
 * RD-10. Todas las sesiones de un mismo grupo las dicta el mismo docente.
 * Es una restricción derivada del caso que el Módulo 1 daba por supuesta y que la
 * construcción hizo visible. Se agrega como clase nueva sin modificar el motor (RNF-03).
 */
public final class RestriccionDocenteUnicoGrupoRD10 implements RestriccionDura {
    @Override public String getCodigo() { return "RD-10"; }
    @Override public boolean esLocal() { return false; }

    @Override
    public boolean esValida(Asignacion c, EstadoHorario estado, ConfiguracionParametros config) {
        for (Asignacion a : estado.getAsignaciones()) {
            if (a.getSesion().getGrupo() == c.getSesion().getGrupo()
                    && a.getSesion() != c.getSesion()
                    && !a.getDocente().getId().equals(c.getDocente().getId())) {
                return false;
            }
        }
        return true;
    }
}
