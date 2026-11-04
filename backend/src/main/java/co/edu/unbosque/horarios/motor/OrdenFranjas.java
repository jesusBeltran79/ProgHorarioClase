package co.edu.unbosque.horarios.motor;

import co.edu.unbosque.horarios.dominio.FranjaHoraria;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Orden en que el motor prueba las franjas para cada sesión (orden de valores).
 * Intercalar los días (lunes 07:00, martes 07:00, miércoles 07:00 y así) reparte las sesiones
 * de un mismo grupo en días distintos sin agregar una restricción nueva. No cambia qué horarios
 * son válidos, solo cuál encuentra primero el backtracking.
 */
public final class OrdenFranjas {

    private OrdenFranjas() { }

    public static List<FranjaHoraria> intercalarDias(List<FranjaHoraria> franjas) {
        List<FranjaHoraria> orden = new ArrayList<>(franjas);
        orden.sort(Comparator.comparing(FranjaHoraria::getHoraInicio).thenComparing(FranjaHoraria::getDia));
        return orden;
    }
}
