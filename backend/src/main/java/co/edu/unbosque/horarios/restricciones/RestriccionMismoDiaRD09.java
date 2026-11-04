package co.edu.unbosque.horarios.restricciones;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.Asignacion;
import co.edu.unbosque.horarios.motor.EstadoHorario;

/**
 * RD-09 (prueba de cambio). Dos sesiones del mismo grupo no pueden quedar el mismo día.
 * Se agrega como clase nueva sin modificar MotorAsignacion (OCP, RNF-03).
 */
public final class RestriccionMismoDiaRD09 implements RestriccionDura {
    @Override public String getCodigo() { return "RD-09"; }
    @Override public boolean esLocal() { return false; }

    @Override
    public boolean esValida(Asignacion c, EstadoHorario estado, ConfiguracionParametros config) {
        for (Asignacion a : estado.getAsignaciones()) {
            if (a.getSesion().getGrupo() == c.getSesion().getGrupo()
                    && a.getFranja().getDia() == c.getFranja().getDia()) {
                return false;
            }
        }
        return true;
    }
}
