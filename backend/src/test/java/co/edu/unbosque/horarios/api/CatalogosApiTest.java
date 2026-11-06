package co.edu.unbosque.horarios.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** RF-10. Gestión de docentes, aulas, materias y grupos desde la interfaz con las mismas reglas del CSV. */
class CatalogosApiTest extends ApiBase {

    @Test
    void crearEditarBorrarYGenerarConDatosManuales() throws Exception {
        String b = bearer();
        cargar("demo", b);

        String franjas = json.readTree(mvc.perform(get("/api/parametros").header("Authorization", b))
                .andReturn().getResponse().getContentAsString()).get("franjasValidas").toString()
                .replace("\"idFranja\"", "\"x\"");
        JsonNode lista = json.readTree(franjas);
        StringBuilder disp = new StringBuilder("[");
        for (JsonNode f : lista) {
            if (disp.length() > 1) disp.append(',');
            disp.append("{\"dia\":\"").append(f.get("dia").asText()).append("\",\"horaInicio\":\"")
                    .append(f.get("horaInicio").asText()).append("\"}");
        }
        disp.append(']');

        enviar(post("/api/admin/docentes"), b, "{\"id\":\"DX1\",\"nombre\":\"Docente Manual\",\"dedicacion\":\"CATEDRA\","
                + "\"escalafon\":\"ASISTENTE\",\"disponibilidad\":" + disp + "}", 200);
        enviar(post("/api/admin/aulas"), b, "{\"id\":\"AX1\",\"capacidad\":30,\"caracteristicas\":[\"COMPUTADORES\"]}", 200);
        enviar(post("/api/admin/materias"), b, "{\"id\":\"CX1\",\"nombre\":\"Materia Manual\",\"numSesiones\":2,"
                + "\"requisitos\":[\"COMPUTADORES\"],\"docentesHabilitados\":[\"DX1\"]}", 200);
        enviar(post("/api/admin/grupos"), b, "{\"id\":\"GX1\",\"idCurso\":\"CX1\",\"matriculados\":20}", 200);

        mvc.perform(get("/api/admin/materias").header("Authorization", b))
                .andExpect(jsonPath("$[?(@.id=='CX1')].docentesHabilitados[0]").value("DX1"));
        mvc.perform(put("/api/admin/grupos/GX1").header("Authorization", b).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idCurso\":\"CX1\",\"matriculados\":25}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.matriculados").value(25));
        mvc.perform(put("/api/admin/aulas/AX1").header("Authorization", b).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"capacidad\":35,\"caracteristicas\":[\"COMPUTADORES\",\"SILLAS_MOVILES\"]}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.caracteristicas.length()").value(2));

        JsonNode r = generar(b);
        assertThat(r.get("estado").asText()).isEqualTo("COMPLETO");
        long deGx1 = 0;
        for (JsonNode a : r.get("asignaciones")) if (a.get("idSesion").asText().startsWith("GX1-")) deGx1++;
        assertThat(deGx1).isEqualTo(2);

        // Un cambio de catálogo borra los horarios generados.
        enviar(put("/api/admin/materias/CX1"), b, "{\"nombre\":\"Materia Manual\",\"numSesiones\":3,"
                + "\"requisitos\":[],\"docentesHabilitados\":[\"DX1\"]}", 200);
        mvc.perform(get("/api/horarios").header("Authorization", b)).andExpect(jsonPath("$.length()").value(0));

        mvc.perform(delete("/api/admin/materias/CX1").header("Authorization", b)).andExpect(status().isNoContent());
        mvc.perform(get("/api/admin/grupos").header("Authorization", b))
                .andExpect(jsonPath("$[?(@.id=='GX1')]").isEmpty());
        mvc.perform(delete("/api/admin/aulas/AX1").header("Authorization", b)).andExpect(status().isNoContent());
        mvc.perform(delete("/api/admin/docentes/DX1").header("Authorization", b)).andExpect(status().isNoContent());
        mvc.perform(delete("/api/admin/docentes/DX1").header("Authorization", b))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.codigo").value("NO_ENCONTRADO"));
    }

    @Test
    void erroresDeValidacion() throws Exception {
        String b = bearer();
        cargar("demo", b);
        String docente = json.readTree(mvc.perform(get("/api/admin/docentes").header("Authorization", b))
                .andReturn().getResponse().getContentAsString()).get(0).get("id").asText();

        error(post("/api/admin/docentes"), b, "{\"id\":\"" + docente + "\",\"nombre\":\"Repetido\",\"disponibilidad\":[]}", 409, "DUPLICADO");
        error(post("/api/admin/docentes"), b, "{\"id\":\"DX9\",\"nombre\":\"Fuera\",\"disponibilidad\":[{\"dia\":\"LUNES\",\"horaInicio\":\"05:00\"}]}", 400, "RD-03");
        error(post("/api/admin/docentes"), b, "{\"id\":\"DX9\",\"nombre\":\"Sabado tarde\",\"disponibilidad\":[{\"dia\":\"SABADO\",\"horaInicio\":\"17:00\"}]}", 400, "RD-03");
        error(post("/api/admin/materias"), b, "{\"id\":\"CX9\",\"nombre\":\"Muchas\",\"numSesiones\":9,\"docentesHabilitados\":[]}", 400, "RD-07");
        error(post("/api/admin/materias"), b, "{\"id\":\"CX9\",\"nombre\":\"Ref\",\"numSesiones\":2,\"docentesHabilitados\":[\"NOEXISTE\"]}", 400, "REFERENCIA");
        error(post("/api/admin/grupos"), b, "{\"id\":\"GX9\",\"idCurso\":\"NOEXISTE\",\"matriculados\":10}", 400, "REFERENCIA");
        error(post("/api/admin/aulas"), b, "{\"id\":\"AX9\",\"capacidad\":20,\"caracteristicas\":[\"PROYECTOR\"]}", 400, "FORMATO");
        error(put("/api/admin/aulas/NOEXISTE"), b, "{\"capacidad\":20,\"caracteristicas\":[]}", 404, "NO_ENCONTRADO");
    }

    private void enviar(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder req, String b,
                        String cuerpo, int estado) throws Exception {
        mvc.perform(req.header("Authorization", b).contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().is(estado));
    }

    private void error(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder req, String b,
                       String cuerpo, int estado, String codigo) throws Exception {
        mvc.perform(req.header("Authorization", b).contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().is(estado)).andExpect(jsonPath("$.codigo").value(codigo));
    }
}
