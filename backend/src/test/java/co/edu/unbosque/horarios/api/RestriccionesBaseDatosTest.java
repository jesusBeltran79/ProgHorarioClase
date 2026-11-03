package co.edu.unbosque.horarios.api;

import co.edu.unbosque.horarios.persistencia.RepositorioEjecuciones;
import co.edu.unbosque.horarios.soporte.Evidencia;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;

import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** Las restricciones UNIQUE de la tabla asignacion bloquean RD-01 y RD-02 sin pasar por el motor. */
class RestriccionesBaseDatosTest extends ApiBase {

    @Autowired
    private RepositorioEjecuciones ejecuciones;

    @Test
    @DisplayName("La base de datos rechaza un choque de docente y uno de aula insertados a mano")
    void uniqueEnAsignacion() throws Exception {
        String b = bearer();
        cargar("ruptura/sobrerrestringido", b);
        JsonNode r = generar(b);
        int id = r.get("idEjecucion").asInt();
        String pendiente = r.get("conflictos").get(0).get("idSesion").asText();
        JsonNode ocupada = r.get("asignaciones").get(0);
        String dia = ocupada.get("dia").asText();
        LocalTime inicio = LocalTime.parse(ocupada.get("horaInicio").asText());
        LocalTime fin = LocalTime.parse(ocupada.get("horaFin").asText());
        String docente = ocupada.get("idDocente").asText();
        String aula = ocupada.get("idAula").asText();
        String otroDocente = docente.equals("D1") ? "D2" : "D1";
        String otraAula = aula.equals("A204") ? "A301" : "A204";

        DuplicateKeyException e1 = assertThrows(DuplicateKeyException.class,
                () -> ejecuciones.insertarAsignacion(id, pendiente, docente, otraAula, dia, inicio, fin));
        DuplicateKeyException e2 = assertThrows(DuplicateKeyException.class,
                () -> ejecuciones.insertarAsignacion(id, pendiente, otroDocente, aula, dia, inicio, fin));
        assertEquals(7, ejecuciones.asignaciones(id).size());
        Evidencia.ruptura("BASE DE DATOS rechazó insertar " + pendiente + " con " + docente + " el " + dia + " " + inicio
                + " por uq_asignacion_docente_franja (RD-01)");
        Evidencia.ruptura("BASE DE DATOS rechazó insertar " + pendiente + " en " + aula + " el " + dia + " " + inicio
                + " por uq_asignacion_aula_franja (RD-02)");
        assertEquals(e1.getClass(), e2.getClass());
    }
}
