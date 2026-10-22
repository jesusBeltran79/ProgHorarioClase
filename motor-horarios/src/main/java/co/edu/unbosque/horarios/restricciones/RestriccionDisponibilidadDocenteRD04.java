package co.edu.unbosque.horarios.restricciones;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.Asignacion;
import co.edu.unbosque.horarios.motor.EstadoHorario;

/** RD-04. Respeta la disponibilidad declarada del docente y su habilitación para el curso (S-06). */
public final class RestriccionDisponibilidadDocenteRD04 implements RestriccionDura {
    @Override public String getCodigo() { return "RD-04"; }
    @Override public boolean esLocal() { return true; }
    @Override
    public boolean esValida(Asignacion c, EstadoHorario estado, ConfiguracionParametros config) {
        return c.getDocente().estaDisponibleEn(c.getFranja().getIndice())
                && c.getSesion().getGrupo().getCurso().habilitaA(c.getDocente().getId());
    }
}
