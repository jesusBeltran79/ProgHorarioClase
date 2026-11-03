package co.edu.unbosque.horarios.api;

import co.edu.unbosque.horarios.soporte.Evidencia;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Flujo completo por la API y pruebas de ruptura. Cada prueba fuerza un error y comprueba
 * que el sistema lo bloquea con el código de la restricción (RNF-04).
 */
class FlujoHorarioTest extends ApiBase {

    private record Asig(String idSesion, String idGrupo, int matriculados, String idDocente, String idAula, int idFranja) { }

    private static List<Asig> asignaciones(JsonNode resultado) {
        List<Asig> lista = new ArrayList<>();
        for (JsonNode a : resultado.get("asignaciones")) {
            lista.add(new Asig(a.get("idSesion").asText(), a.get("idGrupo").asText(), a.get("matriculados").asInt(),
                    a.get("idDocente").asText(), a.get("idAula").asText(), a.get("idFranja").asInt()));
        }
        return lista;
    }

    private JsonNode reubicar(String b, int id, String idSesion, int idFranja, String idAula, String idDocente, int esperado)
            throws Exception {
        String cuerpo = "{\"idSesion\":\"" + idSesion + "\",\"idFranja\":" + idFranja + ",\"idAula\":\"" + idAula
                + "\",\"idDocente\":\"" + idDocente + "\"}";
        MvcResult r = mvc.perform(post("/api/horarios/" + id + "/reubicar").header("Authorization", b)
                .contentType(MediaType.APPLICATION_JSON).content(cuerpo)).andReturn();
        assertEquals(esperado, r.getResponse().getStatus(), r.getResponse().getContentAsString());
        return json.readTree(r.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private static String detalles(JsonNode error) {
        return error.get("detalles").toString();
    }

    @Test
    @DisplayName("RF-01 a RF-09 carga, valida, genera completo y exporta la demostración")
    void flujoCompleto() throws Exception {
        String b = bearer();
        JsonNode carga = cargar("demo", b);
        assertEquals(10, carga.at("/cargados/docentes").asInt());
        assertEquals(42, carga.at("/cargados/sesiones").asInt());
        assertTrue(carga.get("hallazgos").toString().contains("RV-02"));

        JsonNode r = generar(b);
        assertEquals("COMPLETO", r.get("estado").asText());
        assertEquals(42, r.at("/metricas/sesionesUbicadas").asInt());

        MvcResult csv = mvc.perform(get("/api/horarios/" + r.get("idEjecucion").asInt() + "/exportar")
                .header("Authorization", b)).andExpect(status().isOk()).andReturn();
        String[] lineas = csv.getResponse().getContentAsString(StandardCharsets.UTF_8).split("\n");
        assertEquals(43, lineas.length);
        Evidencia.registrar("qa/flujo_api.log", "Demostración por API COMPLETO 42/42 en " + r.at("/metricas/duracionMs").asLong()
                + " ms. Exportación de 42 filas");
    }

    @Test
    @DisplayName("Ruptura RD-01 mover una sesión a una franja donde su docente ya dicta clase")
    void rupturaChoqueDocente() throws Exception {
        String b = bearer();
        cargar("demo", b);
        JsonNode r = generar(b);
        int id = r.get("idEjecucion").asInt();
        List<Asig> lista = asignaciones(r);
        Asig a = null;
        Asig otra = null;
        for (Asig x : lista) {
            for (Asig y : lista) {
                if (x.idDocente().equals(y.idDocente()) && !x.idGrupo().equals(y.idGrupo()) && x.idFranja() != y.idFranja()) {
                    a = x;
                    otra = y;
                    break;
                }
            }
            if (a != null) break;
        }
        JsonNode error = reubicar(b, id, a.idSesion(), otra.idFranja(), a.idAula(), a.idDocente(), 409);
        assertEquals("RESTRICCION_VIOLADA", error.get("codigo").asText());
        assertTrue(detalles(error).contains("RD-01"), detalles(error));
        Evidencia.ruptura("API bloqueó mover " + a.idSesion() + " a la franja " + otra.idFranja() + " donde " + a.idDocente()
                + " dicta " + otra.idSesion() + " con 409 " + detalles(error));
    }

    @Test
    @DisplayName("Ruptura RD-02 mover una sesión a un aula ocupada en esa franja")
    void rupturaChoqueAula() throws Exception {
        String b = bearer();
        cargar("demo", b);
        JsonNode r = generar(b);
        int id = r.get("idEjecucion").asInt();
        List<Asig> lista = asignaciones(r);
        Asig a = null;
        Asig ocupante = null;
        for (Asig x : lista) {
            for (Asig y : lista) {
                if (x.idFranja() == y.idFranja() && !x.idAula().equals(y.idAula())) {
                    a = x;
                    ocupante = y;
                    break;
                }
            }
            if (a != null) break;
        }
        JsonNode error = reubicar(b, id, a.idSesion(), a.idFranja(), ocupante.idAula(), a.idDocente(), 409);
        assertTrue(detalles(error).contains("RD-02"), detalles(error));
        Evidencia.ruptura("API bloqueó mover " + a.idSesion() + " al aula " + ocupante.idAula() + " ocupada por "
                + ocupante.idSesion() + " con 409 " + detalles(error));
    }

    @Test
    @DisplayName("Ruptura RD-06 mover un grupo grande a un aula pequeña")
    void rupturaCapacidad() throws Exception {
        String b = bearer();
        cargar("demo", b);
        JsonNode r = generar(b);
        int id = r.get("idEjecucion").asInt();
        Asig grande = asignaciones(r).stream().filter(x -> x.idGrupo().equals("PRO1-G1")).findFirst().orElseThrow();
        JsonNode error = reubicar(b, id, grande.idSesion(), grande.idFranja(), "A202", grande.idDocente(), 409);
        assertTrue(detalles(error).contains("RD-06"), detalles(error));
        Evidencia.ruptura("API bloqueó mover " + grande.idSesion() + " de 40 estudiantes al aula A202 de 32 puestos con 409 "
                + detalles(error));
    }

    @Test
    @DisplayName("RF-07 una alternativa sugerida se aplica y el horario sigue completo")
    void reubicacionValida() throws Exception {
        String b = bearer();
        cargar("demo", b);
        JsonNode r = generar(b);
        int id = r.get("idEjecucion").asInt();
        Asig a = asignaciones(r).get(0);
        JsonNode alternativas = json.readTree(mvc.perform(get("/api/horarios/" + id + "/alternativas/" + a.idSesion())
                .header("Authorization", b)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        JsonNode valida = null;
        for (JsonNode x : alternativas) {
            if (x.get("liberar").isEmpty() && x.get("idFranja").asInt() != a.idFranja()) { valida = x; break; }
        }
        JsonNode nuevo = reubicar(b, id, a.idSesion(), valida.get("idFranja").asInt(), valida.get("idAula").asText(),
                valida.get("idDocente").asText(), 200);
        assertEquals("COMPLETO", nuevo.get("estado").asText());
    }

    @Test
    @DisplayName("Ruptura RD-08 el caso sobrerrestringido queda PARCIAL y no se puede exportar")
    void rupturaParcial() throws Exception {
        String b = bearer();
        cargar("ruptura/sobrerrestringido", b);
        JsonNode r = generar(b);
        assertEquals("PARCIAL", r.get("estado").asText());
        assertEquals(7, r.at("/metricas/sesionesUbicadas").asInt());
        JsonNode conflicto = r.get("conflictos").get(0);
        assertTrue(conflicto.get("causas").toString().contains("RD-04"));
        MvcResult exp = mvc.perform(get("/api/horarios/" + r.get("idEjecucion").asInt() + "/exportar")
                .header("Authorization", b)).andExpect(status().isConflict()).andReturn();
        JsonNode error = json.readTree(exp.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertEquals("HORARIO_PARCIAL", error.get("codigo").asText());
        Evidencia.ruptura("API generó el caso sobrerrestringido PARCIAL 7/8 con causas " + conflicto.get("causas")
                + " y bloqueó la exportación con 409 HORARIO_PARCIAL");
    }

    @Test
    @DisplayName("Ruptura de carga la API devuelve cada fila rechazada")
    void rupturaCarga() throws Exception {
        String b = bearer();
        JsonNode carga = cargar("ruptura/carga-con-errores", b);
        assertEquals(10, carga.get("rechazos").size());
        assertTrue(carga.get("hallazgos").toString().contains("RV-01"));
        Evidencia.ruptura("API aceptó la carga con errores y devolvió " + carga.get("rechazos").size()
                + " filas rechazadas y el hallazgo RV-01 del grupo de 47 matriculados");
    }
}
