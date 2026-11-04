package co.edu.unbosque.horarios.nucleo;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.Curso;
import co.edu.unbosque.horarios.dominio.Grupo;
import co.edu.unbosque.horarios.validacion.ReglaCierreMinimoRV02;
import co.edu.unbosque.horarios.validacion.ReglaTopeMatriculadosRV01;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** RV-01 y RV-02 se evalúan sobre los datos antes de asignar (RF-05). */
class ReglasValidacionTest {

    private final Curso curso = new Curso("C1", "Curso", 2, Set.of(), Set.of());

    @Test
    @DisplayName("RV-01 marca 45 pero no 44 con tope 40 y marca 40 pero no 39 con tope 35")
    void topeMatriculados() {
        ConfiguracionParametros cfg = new ConfiguracionParametros();
        ReglaTopeMatriculadosRV01 rv01 = new ReglaTopeMatriculadosRV01();
        assertFalse(rv01.validar(new Grupo("G", curso, 44), cfg).isPresent());
        assertTrue(rv01.validar(new Grupo("G", curso, 45), cfg).isPresent());
        cfg.setCapMax(35);
        assertFalse(rv01.validar(new Grupo("G", curso, 39), cfg).isPresent());
        assertTrue(rv01.validar(new Grupo("G", curso, 40), cfg).isPresent());
    }

    @Test
    @DisplayName("RV-02 marca para cierre un grupo con menos de 10")
    void cierreMinimo() {
        ConfiguracionParametros cfg = new ConfiguracionParametros();
        ReglaCierreMinimoRV02 rv02 = new ReglaCierreMinimoRV02();
        assertTrue(rv02.validar(new Grupo("G", curso, 9), cfg).isPresent());
        assertFalse(rv02.validar(new Grupo("G", curso, 10), cfg).isPresent());
    }
}
