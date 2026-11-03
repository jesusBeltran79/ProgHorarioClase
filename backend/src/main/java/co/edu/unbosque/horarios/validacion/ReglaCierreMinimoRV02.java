package co.edu.unbosque.horarios.validacion;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.Grupo;

import java.util.Optional;

public final class ReglaCierreMinimoRV02 implements ReglaValidacionEntrada {
    @Override public String getCodigo() { return "RV-02"; }

    @Override
    public Optional<ReporteValidacion> validar(Grupo g, ConfiguracionParametros cfg) {
        if (g.getMatriculados() < cfg.getMinCierre()) {
            return Optional.of(new ReporteValidacion(getCodigo(), g.getId(),
                    "El grupo tiene menos de " + cfg.getMinCierre() + " matriculados y se marca para cierre"));
        }
        return Optional.empty();
    }
}
