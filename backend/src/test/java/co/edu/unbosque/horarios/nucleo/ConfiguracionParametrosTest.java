package co.edu.unbosque.horarios.nucleo;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.DiaSemana;
import co.edu.unbosque.horarios.dominio.FranjaHoraria;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** RD-03, S-01, S-02 y RF-08. La grilla se deriva de los parámetros. */
class ConfiguracionParametrosTest {

    @Test
    @DisplayName("RD-03 la grilla por defecto tiene 32 franjas válidas")
    void grillaPorDefecto() {
        List<FranjaHoraria> f = new ConfiguracionParametros().generarFranjasValidas();
        assertEquals(32, f.size());
        assertEquals(2, f.stream().filter(x -> x.getDia() == DiaSemana.SABADO).count());
    }

    @Test
    @DisplayName("S-02 ninguna franja cruza el bloqueo de 12:00 a 13:00")
    void sinCruzarBloqueo() {
        for (FranjaHoraria f : new ConfiguracionParametros().generarFranjasValidas()) {
            boolean cruza = f.getHoraInicio().isBefore(LocalTime.of(13, 0)) && f.getHoraFin().isAfter(LocalTime.of(12, 0));
            assertFalse(cruza, f.toString());
            assertEquals(2, f.getHoraFin().getHour() - f.getHoraInicio().getHour());
        }
    }

    @Test
    @DisplayName("RF-08 cerrar a las 20:00 deja 27 franjas sin tocar código")
    void cambioDeCierre() {
        ConfiguracionParametros c = new ConfiguracionParametros();
        c.setCierreSemana(LocalTime.of(20, 0));
        assertEquals(27, c.generarFranjasValidas().size());
    }

    @Test
    @DisplayName("RV-01 umbral con techo 44 con tope 40 y 39 con tope 35")
    void umbralConTecho() {
        ConfiguracionParametros c = new ConfiguracionParametros();
        assertEquals(44, c.calcularUmbralMaximoGrupo());
        c.setCapMax(35);
        assertEquals(39, c.calcularUmbralMaximoGrupo());
        assertTrue(c.calcularUmbralMaximoGrupo() > 38);
    }
}
