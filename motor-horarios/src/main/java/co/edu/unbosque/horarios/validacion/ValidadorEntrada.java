package co.edu.unbosque.horarios.validacion;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.Grupo;

import java.util.ArrayList;
import java.util.List;

/** Ejecuta las reglas RV antes del motor, una sola vez por grupo (RF-05). */
public final class ValidadorEntrada {
    private final List<ReglaValidacionEntrada> reglas;

    public ValidadorEntrada(List<ReglaValidacionEntrada> reglas) {
        this.reglas = List.copyOf(reglas);
    }

    public List<ReporteValidacion> validarGrupos(List<Grupo> grupos, ConfiguracionParametros cfg) {
        List<ReporteValidacion> hallazgos = new ArrayList<>();
        for (Grupo g : grupos) {
            for (ReglaValidacionEntrada r : reglas) {
                r.validar(g, cfg).ifPresent(hallazgos::add);
            }
        }
        return hallazgos;
    }
}
