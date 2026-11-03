package co.edu.unbosque.horarios.aplicacion;

import co.edu.unbosque.horarios.restricciones.RestriccionCapacidadAulaRD06;
import co.edu.unbosque.horarios.restricciones.RestriccionChoqueAulaRD02;
import co.edu.unbosque.horarios.restricciones.RestriccionChoqueDocenteRD01;
import co.edu.unbosque.horarios.restricciones.RestriccionDisponibilidadDocenteRD04;
import co.edu.unbosque.horarios.restricciones.RestriccionDocenteUnicoGrupoRD10;
import co.edu.unbosque.horarios.restricciones.RestriccionDura;
import co.edu.unbosque.horarios.restricciones.RestriccionIdoneidadAulaRD05;
import co.edu.unbosque.horarios.validacion.ReglaCierreMinimoRV02;
import co.edu.unbosque.horarios.validacion.ReglaTopeMatriculadosRV01;
import co.edu.unbosque.horarios.validacion.ValidadorEntrada;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Ensamblaje del núcleo. Este es el único lugar donde se registran las restricciones duras
 * y las reglas de validación. Agregar una restricción nueva es crear su clase y añadir una línea aquí.
 */
@Configuration
public class ConfiguracionMotor {

    /** Envoltorio para que Spring no confunda la lista con una colección de beans. */
    public record CatalogoRestricciones(List<RestriccionDura> duras) { }

    @Bean
    public CatalogoRestricciones catalogoRestricciones() {
        return new CatalogoRestricciones(List.of(
                new RestriccionDisponibilidadDocenteRD04(),
                new RestriccionIdoneidadAulaRD05(),
                new RestriccionCapacidadAulaRD06(),
                new RestriccionChoqueDocenteRD01(),
                new RestriccionChoqueAulaRD02(),
                new RestriccionDocenteUnicoGrupoRD10()));
    }

    @Bean
    public ValidadorEntrada validadorEntrada() {
        return new ValidadorEntrada(List.of(new ReglaTopeMatriculadosRV01(), new ReglaCierreMinimoRV02()));
    }
}
