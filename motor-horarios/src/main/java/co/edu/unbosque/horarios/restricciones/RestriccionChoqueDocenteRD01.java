package co.edu.unbosque.horarios.restricciones;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.Asignacion;
import co.edu.unbosque.horarios.motor.EstadoHorario;

/** RD-01. Un docente no puede tener dos sesiones en la misma franja. */
public final class RestriccionChoqueDocenteRD01 implements RestriccionDura {
    @Override public String getCodigo() { return "RD-01"; }
    @Override public boolean esLocal() { return false; }
    @Override
    public boolean esValida(Asignacion c, EstadoHorario estado, ConfiguracionParametros config) {
        return !estado.docenteOcupado(c.getDocente().getId(), c.getFranja().getIndice());
    }
}
