package co.edu.unbosque.horarios.validacion;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.Grupo;

import java.util.Optional;

public final class ReglaTopeMatriculadosRV01 implements ReglaValidacionEntrada {
    @Override public String getCodigo() { return "RV-01"; }

    @Override
    public Optional<ReporteValidacion> validar(Grupo g, ConfiguracionParametros cfg) {
        int umbral = cfg.calcularUmbralMaximoGrupo();
        if (g.getMatriculados() > umbral) {
            return Optional.of(new ReporteValidacion(getCodigo(), g.getId(),
                    "El grupo tiene " + g.getMatriculados() + " matriculados y supera el tope de " + umbral));
        }
        return Optional.empty();
    }
}
