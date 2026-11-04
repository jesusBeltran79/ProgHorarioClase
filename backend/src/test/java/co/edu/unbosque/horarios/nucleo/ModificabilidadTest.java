package co.edu.unbosque.horarios.nucleo;

import co.edu.unbosque.horarios.app.MedicionEscalabilidad;
import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.datos.ConjuntoDatos;
import co.edu.unbosque.horarios.dominio.Asignacion;
import co.edu.unbosque.horarios.motor.MotorAsignacion;
import co.edu.unbosque.horarios.motor.OrdenExploracion;
import co.edu.unbosque.horarios.motor.OrdenFranjas;
import co.edu.unbosque.horarios.motor.ResultadoAsignacion;
import co.edu.unbosque.horarios.restricciones.RestriccionDura;
import co.edu.unbosque.horarios.restricciones.RestriccionMismoDiaRD09;
import co.edu.unbosque.horarios.soporte.Datos;
import co.edu.unbosque.horarios.soporte.Evidencia;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Escenario de modificabilidad (RNF-03). Se agrega una regla nueva sin modificar el motor. */
class ModificabilidadTest {

    @Test
    @DisplayName("RNF-03 RD-09 se agrega como clase nueva y el motor la respeta sin cambios")
    void nuevaRestriccion() throws Exception {
        ConfiguracionParametros cfg = new ConfiguracionParametros();
        ConjuntoDatos d = Datos.dominio("demo", cfg);
        List<RestriccionDura> reglas = new ArrayList<>(MedicionEscalabilidad.restriccionesMvp());
        reglas.add(new RestriccionMismoDiaRD09());
        ResultadoAsignacion r = new MotorAsignacion(reglas, cfg, 60_000).generarHorario(d.sesiones(), d.docentes(), d.aulas(),
                OrdenFranjas.intercalarDias(cfg.generarFranjasValidas()), OrdenExploracion.MAS_RESTRINGIDA_PRIMERO, true);
        assertTrue(r.completo());
        Set<String> grupoDia = new HashSet<>();
        int repetidos = 0;
        for (Asignacion a : r.estado().getAsignaciones()) {
            if (!grupoDia.add(a.getSesion().getGrupo().getId() + "@" + a.getFranja().getDia())) repetidos++;
        }
        assertEquals(0, repetidos);
        Evidencia.registrar("modificabilidad/rd09.txt", "RD-09 agregada con una clase nueva. Horario COMPLETO "
                + r.estado().cantidadAsignaciones() + " sesiones. Grupos con dos sesiones el mismo día = " + repetidos
                + ". Rechazos de RD-09 = " + r.estado().getRechazosPorCodigo().getOrDefault("RD-09", 0));
    }

    @Test
    @DisplayName("RNF-03 bajar el tope a 35 cambia el umbral a 39 con solo un parámetro")
    void cambioDeTope() {
        ConfiguracionParametros cfg = new ConfiguracionParametros();
        int antes = cfg.calcularUmbralMaximoGrupo();
        cfg.setCapMax(35);
        assertEquals(39, cfg.calcularUmbralMaximoGrupo());
        Evidencia.registrar("modificabilidad/rv01_tope35.txt", "Umbral RV-01 con tope 40 = " + antes
                + ". Con tope 35 = " + cfg.calcularUmbralMaximoGrupo() + " (techo de 35 x 1,10). Sin recompilar");
    }
}
