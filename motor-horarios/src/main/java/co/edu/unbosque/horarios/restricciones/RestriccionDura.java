package co.edu.unbosque.horarios.restricciones;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.Asignacion;
import co.edu.unbosque.horarios.motor.EstadoHorario;

/**
 * Estrategia del patrón Strategy. Cada restricción dura es una clase que
 * implementa este contrato y el motor solo conoce la interfaz (RNF-03, RNF-04).
 */
public interface RestriccionDura {
    String getCodigo();

    /** true si la regla solo mira la tupla y no el horario ya construido. */
    boolean esLocal();

    boolean esValida(Asignacion candidata, EstadoHorario estado, ConfiguracionParametros config);
}
