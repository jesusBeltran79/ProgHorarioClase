package co.edu.unbosque.horarios.api;

import co.edu.unbosque.horarios.soporte.Evidencia;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** RF-08. Los parámetros cambian sin modificar código y la grilla se recalcula. */
class ParametrosApiTest extends ApiBase {

    private JsonNode actuales(String b) throws Exception {
        return json.readTree(mvc.perform(get("/api/parametros").header("Authorization", b))
                .andReturn().getResponse().getContentAsString());
    }

    @AfterEach
    void restaurar() throws Exception {
        String b = bearer();
        ObjectNode p = (ObjectNode) actuales(b);
        p.put("capMax", 40);
        p.put("cierreSemana", "22:00");
        mvc.perform(put("/api/parametros").header("Authorization", b).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(p))).andExpect(status().isOk());
    }

    @Test
    @DisplayName("RF-08 bajar el tope a 35 da un umbral de 39")
    void tope35() throws Exception {
        String b = bearer();
        ObjectNode p = (ObjectNode) actuales(b);
        assertEquals(44, p.get("umbralMaximoGrupo").asInt());
        p.put("capMax", 35);
        mvc.perform(put("/api/parametros").header("Authorization", b).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(p)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.umbralMaximoGrupo").value(39));
        Evidencia.registrar("modificabilidad/rv01_tope35.txt", "API PUT /api/parametros capMax=35 respondió umbralMaximoGrupo=39");
    }

    @Test
    @DisplayName("RF-08 cerrar a las 20:00 deja 27 franjas")
    void cierre20() throws Exception {
        String b = bearer();
        ObjectNode p = (ObjectNode) actuales(b);
        assertEquals(32, p.get("franjasValidas").size());
        p.put("cierreSemana", "20:00");
        mvc.perform(put("/api/parametros").header("Authorization", b).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(p)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.franjasValidas.length()").value(27));
    }

    @Test
    @DisplayName("RF-08 un parámetro inválido se rechaza con 400")
    void invalido() throws Exception {
        String b = bearer();
        ObjectNode p = (ObjectNode) actuales(b);
        p.put("tol", 3.0);
        mvc.perform(put("/api/parametros").header("Authorization", b).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(p)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("PARAMETROS_INVALIDOS"));
    }
}
