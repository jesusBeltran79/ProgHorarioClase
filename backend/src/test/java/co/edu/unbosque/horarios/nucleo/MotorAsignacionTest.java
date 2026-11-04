package co.edu.unbosque.horarios.nucleo;

import co.edu.unbosque.horarios.app.MedicionEscalabilidad;
import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.datos.ConjuntoDatos;
import co.edu.unbosque.horarios.motor.MotorAsignacion;
import co.edu.unbosque.horarios.motor.OrdenExploracion;
import co.edu.unbosque.horarios.motor.OrdenFranjas;
import co.edu.unbosque.horarios.motor.ReporteConflicto;
import co.edu.unbosque.horarios.motor.ResultadoAsignacion;
import co.edu.unbosque.horarios.persistencia.ExportadorHorarioCSV;
import co.edu.unbosque.horarios.soporte.Datos;
import co.edu.unbosque.horarios.soporte.Evidencia;
import co.edu.unbosque.horarios.soporte.VerificadorHorario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** RF-06, RF-07, RD-08 y RNF-01 sobre los conjuntos de la carpeta datos. */
class MotorAsignacionTest {

    private final ConfiguracionParametros cfg = new ConfiguracionParametros();

    private ResultadoAsignacion generar(ConjuntoDatos d) {
        MotorAsignacion motor = new MotorAsignacion(MedicionEscalabilidad.restriccionesMvp(), cfg, 60_000);
        return motor.generarHorario(d.sesiones(), d.docentes(), d.aulas(),
                OrdenFranjas.intercalarDias(cfg.generarFranjasValidas()), OrdenExploracion.MAS_RESTRINGIDA_PRIMERO, true);
    }

    @Test
    @DisplayName("RF-06 y RNF-01 la demostración sale completa y sin violaciones en menos de 60 s")
    void demoCompleta() throws Exception {
        ConjuntoDatos d = Datos.dominio("demo", cfg);
        ResultadoAsignacion r = generar(d);
        assertTrue(r.completo());
        assertEquals(42, r.estado().cantidadAsignaciones());
        List<String> errores = VerificadorHorario.violaciones(r.estado().getAsignaciones(), d.sesiones());
        assertTrue(errores.isEmpty(), errores.toString());
        assertTrue(r.msTotal() < 60_000);
        Evidencia.registrar("qa/motor.log", "Demostración COMPLETO 42/42 sesiones en " + r.msTotal() + " ms con "
                + r.nodosExplorados() + " nodos. Verificador independiente sin violaciones");
    }

    @Test
    @DisplayName("Ruptura RD-08 el caso sobrerrestringido queda PARCIAL y explica la causa por código")
    void sobrerrestringido() throws Exception {
        ConjuntoDatos d = Datos.dominio("ruptura/sobrerrestringido", cfg);
        ResultadoAsignacion r = generar(d);
        assertFalse(r.completo());
        assertEquals(7, r.estado().cantidadAsignaciones());
        assertEquals(1, r.conflictos().size());
        ReporteConflicto c = r.conflictos().get(0);
        assertTrue(c.codigosRestriccionesVioladas().contains("RD-04"));
        assertTrue(VerificadorHorario.violaciones(r.estado().getAsignaciones(), List.of()).isEmpty());
        Evidencia.ruptura("MOTOR caso sobrerrestringido ubicó 7 de 8 sesiones. Sesión " + c.idSesion()
                + " bloqueada por " + c.tuplasBloqueadasPorCodigo());
    }

    @Test
    @DisplayName("RF-09 el horario exportado tiene una fila por sesión")
    void exportacion() throws Exception {
        ConjuntoDatos d = Datos.dominio("demo", cfg);
        String csv = new ExportadorHorarioCSV().exportar(generar(d).estado().getAsignaciones());
        String[] lineas = csv.split("\n");
        assertEquals(ExportadorHorarioCSV.ENCABEZADO, lineas[0]);
        assertEquals(43, lineas.length);
    }
}
