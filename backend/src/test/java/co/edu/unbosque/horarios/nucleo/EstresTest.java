package co.edu.unbosque.horarios.nucleo;

import co.edu.unbosque.horarios.app.MedicionEscalabilidad;
import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.datos.ConjuntoDatos;
import co.edu.unbosque.horarios.datos.GeneradorDatosSinteticos;
import co.edu.unbosque.horarios.dominio.FranjaHoraria;
import co.edu.unbosque.horarios.motor.MotorAsignacion;
import co.edu.unbosque.horarios.motor.OrdenExploracion;
import co.edu.unbosque.horarios.motor.OrdenFranjas;
import co.edu.unbosque.horarios.motor.ResultadoAsignacion;
import co.edu.unbosque.horarios.soporte.Evidencia;
import co.edu.unbosque.horarios.soporte.VerificadorHorario;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

/** Escenario de escalabilidad (RNF-02). La medición completa la hace la clase PruebaEstres. */
class EstresTest {

    @ParameterizedTest(name = "RNF-02 escala {0}x completa y sin violaciones")
    @ValueSource(ints = {1, 3, 10})
    void escala(int k) {
        ConfiguracionParametros cfg = new ConfiguracionParametros();
        List<FranjaHoraria> franjas = cfg.generarFranjasValidas();
        ConjuntoDatos d = new GeneradorDatosSinteticos().generar(k, 11, franjas, true);
        ResultadoAsignacion r = new MotorAsignacion(MedicionEscalabilidad.restriccionesMvp(), cfg, 60_000)
                .generarHorario(d.sesiones(), d.docentes(), d.aulas(), OrdenFranjas.intercalarDias(franjas),
                        OrdenExploracion.MAS_RESTRINGIDA_PRIMERO, true);
        assertTrue(r.completo());
        assertTrue(VerificadorHorario.violaciones(r.estado().getAsignaciones(), d.sesiones()).isEmpty());
        assertTrue(r.msTotal() < 60_000);
        Evidencia.registrar("estres/junit.log", k + "x perfil exigente " + d.sesiones().size() + " sesiones COMPLETO en "
                + r.msTotal() + " ms y " + r.nodosExplorados() + " nodos");
    }
}
