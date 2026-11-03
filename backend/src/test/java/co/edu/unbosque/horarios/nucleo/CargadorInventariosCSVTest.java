package co.edu.unbosque.horarios.nucleo;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.persistencia.InventarioCargado;
import co.edu.unbosque.horarios.soporte.Datos;
import co.edu.unbosque.horarios.soporte.Evidencia;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** RF-01 a RF-04. El cargador acepta las filas válidas y rechaza las inválidas con su motivo. */
class CargadorInventariosCSVTest {

    @Test
    @DisplayName("Los datos de la demostración cargan completos y sin rechazos")
    void demoSinRechazos() throws Exception {
        InventarioCargado inv = Datos.inventario("demo", new ConfiguracionParametros());
        assertEquals(10, inv.docentes().size());
        assertEquals(5, inv.aulas().size());
        assertEquals(20, inv.cursos().size());
        assertEquals(21, inv.grupos().size());
        assertTrue(inv.rechazos().isEmpty(), inv.rechazos().toString());
    }

    @Test
    @DisplayName("Ruptura de carga cada fila inválida se rechaza con su código")
    void cargaConErrores() throws Exception {
        InventarioCargado inv = Datos.inventario("ruptura/carga-con-errores", new ConfiguracionParametros());
        List<String> codigos = inv.rechazos().stream().map(r -> r.archivo() + ":" + r.fila() + ":" + r.codigo()).toList();
        assertTrue(codigos.contains("docentes.csv:3:RD-03"), codigos.toString());
        assertTrue(codigos.contains("docentes.csv:5:FORMATO"), codigos.toString());
        assertTrue(codigos.contains("aulas.csv:3:FORMATO"), codigos.toString());
        assertTrue(codigos.contains("cursos.csv:3:RD-07"), codigos.toString());
        assertTrue(codigos.contains("cursos.csv:4:REFERENCIA"), codigos.toString());
        assertTrue(codigos.contains("grupos.csv:5:REFERENCIA"), codigos.toString());
        assertEquals(10, inv.rechazos().size());
        assertEquals(2, inv.docentes().size());
        inv.rechazos().forEach(r -> Evidencia.ruptura("CARGA bloqueó " + r.archivo() + " fila " + r.fila()
                + " [" + r.codigo() + "] " + r.motivo()));
    }
}
