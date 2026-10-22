package co.edu.unbosque.horarios.restricciones;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.Asignacion;
import co.edu.unbosque.horarios.motor.EstadoHorario;

/** RD-02. Un aula no puede tener dos sesiones en la misma franja. */
public final class RestriccionChoqueAulaRD02 implements RestriccionDura {
    @Override public String getCodigo() { return "RD-02"; }
    @Override public boolean esLocal() { return false; }
    @Override
    public boolean esValida(Asignacion c, EstadoHorario estado, ConfiguracionParametros config) {
        return !estado.aulaOcupada(c.getAula().getId(), c.getFranja().getIndice());
    }
}
