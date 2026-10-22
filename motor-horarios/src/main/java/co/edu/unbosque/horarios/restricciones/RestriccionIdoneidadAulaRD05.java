package co.edu.unbosque.horarios.restricciones;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.Asignacion;
import co.edu.unbosque.horarios.motor.EstadoHorario;

/** RD-05. El aula debe tener las características que exige el curso. */
public final class RestriccionIdoneidadAulaRD05 implements RestriccionDura {
    @Override public String getCodigo() { return "RD-05"; }
    @Override public boolean esLocal() { return true; }
    @Override
    public boolean esValida(Asignacion c, EstadoHorario estado, ConfiguracionParametros config) {
        return c.getAula().cumpleRequisitos(c.getSesion().getGrupo().getCurso().getRequisitosAula());
    }
}
