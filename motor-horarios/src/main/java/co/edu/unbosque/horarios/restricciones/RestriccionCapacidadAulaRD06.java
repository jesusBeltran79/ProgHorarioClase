package co.edu.unbosque.horarios.restricciones;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.Asignacion;
import co.edu.unbosque.horarios.motor.EstadoHorario;

/** RD-06. La capacidad del aula debe cubrir a los matriculados del grupo. */
public final class RestriccionCapacidadAulaRD06 implements RestriccionDura {
    @Override public String getCodigo() { return "RD-06"; }
    @Override public boolean esLocal() { return true; }
    @Override
    public boolean esValida(Asignacion c, EstadoHorario estado, ConfiguracionParametros config) {
        return c.getAula().getCapacidad() >= c.getSesion().getGrupo().getMatriculados();
    }
}
