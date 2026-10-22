package co.edu.unbosque.horarios.validacion;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.Grupo;

import java.util.Optional;

/** Regla que se evalúa una sola vez sobre cada grupo antes de asignar (RF-05). */
public interface ReglaValidacionEntrada {
    String getCodigo();
    Optional<ReporteValidacion> validar(Grupo grupo, ConfiguracionParametros config);
}
