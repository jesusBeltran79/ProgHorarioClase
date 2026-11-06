package co.edu.unbosque.horarios.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** RF-11, RF-12, RF-14 y RNF-06 ampliado. Cuentas por perfil, publicación y portal del docente. */
class CuentasApiTest extends ApiBase {

    private String entrar(String usuario, String clave) throws Exception {
        MvcResult r = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"usuario\":\"" + usuario + "\",\"contrasena\":\"" + clave + "\"}")).andReturn();
        assertThat(r.getResponse().getStatus()).isEqualTo(200);
        JsonNode t = json.readTree(r.getResponse().getContentAsString());
        return "Bearer " + t.get("token").asText();
    }

    @Test
    void docenteVeSoloSuHorarioPublicadoYCambiaSusDatos() throws Exception {
        String admin = bearer();
        cargar("demo", admin);

        mvc.perform(post("/api/admin/usuarios").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombreUsuario\":\"docente.d03\",\"rol\":\"DOCENTE\",\"idDocente\":\"D03\",\"contrasena\":\"Clave2026*\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.rol").value("DOCENTE"))
                .andExpect(jsonPath("$.nombreDocente").isNotEmpty());
        mvc.perform(post("/api/admin/usuarios").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombreUsuario\":\"otro.d03\",\"rol\":\"DOCENTE\",\"idDocente\":\"D03\",\"contrasena\":\"Clave2026*\"}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.codigo").value("DOCENTE_CON_CUENTA"));
        mvc.perform(post("/api/admin/usuarios").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombreUsuario\":\"corta\",\"rol\":\"ADMIN\",\"idDocente\":null,\"contrasena\":\"123\"}"))
                .andExpect(status().isBadRequest());

        MvcResult login = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"usuario\":\"docente.d03\",\"contrasena\":\"Clave2026*\"}")).andReturn();
        JsonNode token = json.readTree(login.getResponse().getContentAsString());
        assertThat(token.get("rol").asText()).isEqualTo("DOCENTE");
        assertThat(token.get("idDocente").asText()).isEqualTo("D03");
        String doc = "Bearer " + token.get("token").asText();

        mvc.perform(post("/api/horarios/generar").header("Authorization", doc)).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/usuarios").header("Authorization", doc)).andExpect(status().isForbidden());
        mvc.perform(get("/api/mi/perfil").header("Authorization", admin)).andExpect(status().isForbidden());
        mvc.perform(get("/api/mi/perfil").header("Authorization", doc)).andExpect(jsonPath("$.idDocente").value("D03"));
        mvc.perform(get("/api/mi/horario").header("Authorization", doc))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.codigo").value("SIN_PUBLICAR"));

        JsonNode r = generar(admin);
        assertThat(r.get("estado").asText()).isEqualTo("COMPLETO");
        assertThat(r.get("publicado").asBoolean()).isFalse();
        int id = r.get("idEjecucion").asInt();
        mvc.perform(post("/api/horarios/" + id + "/publicar").header("Authorization", admin))
                .andExpect(status().isOk()).andExpect(jsonPath("$.publicado").value(true));
        mvc.perform(get("/api/horarios").header("Authorization", admin)).andExpect(jsonPath("$[0].publicado").value(true));

        long propias = 0;
        for (JsonNode a : r.get("asignaciones")) if ("D03".equals(a.get("idDocente").asText())) propias++;
        JsonNode mio = json.readTree(mvc.perform(get("/api/mi/horario").header("Authorization", doc))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(mio.get("idEjecucion").asInt()).isEqualTo(id);
        assertThat(mio.get("asignaciones").size()).isEqualTo((int) propias);
        for (JsonNode a : mio.get("asignaciones")) assertThat(a.get("idDocente").asText()).isEqualTo("D03");

        // Disponibilidad propia. Una franja inválida se rechaza y un cambio válido no borra el horario publicado.
        JsonNode disp = json.readTree(mvc.perform(get("/api/mi/disponibilidad").header("Authorization", doc))
                .andReturn().getResponse().getContentAsString());
        assertThat(disp.get("franjasValidas").size()).isGreaterThan(0);
        JsonNode primera = disp.get("franjasValidas").get(0);
        mvc.perform(put("/api/mi/disponibilidad").header("Authorization", doc).contentType(MediaType.APPLICATION_JSON)
                        .content("[{\"dia\":\"LUNES\",\"horaInicio\":\"05:00\"}]"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.codigo").value("RD-03"));
        mvc.perform(put("/api/mi/disponibilidad").header("Authorization", doc).contentType(MediaType.APPLICATION_JSON)
                        .content("[{\"dia\":\"" + primera.get("dia").asText() + "\",\"horaInicio\":\"" + primera.get("horaInicio").asText() + "\"}]"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.disponibles.length()").value(1));
        mvc.perform(get("/api/mi/horario").header("Authorization", doc)).andExpect(status().isOk());

        // Contraseña propia.
        mvc.perform(put("/api/mi/contrasena").header("Authorization", doc).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"actual\":\"equivocada\",\"nueva\":\"NuevaClave1\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.codigo").value("CONTRASENA_INCORRECTA"));
        mvc.perform(put("/api/mi/contrasena").header("Authorization", doc).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"actual\":\"Clave2026*\",\"nueva\":\"NuevaClave1\"}"))
                .andExpect(status().isNoContent());
        entrar("docente.d03", "NuevaClave1");

        // Desactivar la cuenta impide iniciar sesión.
        int idCuenta = json.readTree(mvc.perform(get("/api/admin/usuarios").header("Authorization", admin))
                .andReturn().getResponse().getContentAsString()).findParents("nombreUsuario").stream()
                .filter(n -> n.get("nombreUsuario").asText().equals("docente.d03")).findFirst().orElseThrow().get("id").asInt();
        mvc.perform(put("/api/admin/usuarios/" + idCuenta).header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rol\":\"DOCENTE\",\"idDocente\":\"D03\",\"activo\":false,\"contrasena\":null}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.activo").value(false));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"usuario\":\"docente.d03\",\"contrasena\":\"NuevaClave1\"}")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/admin/usuarios/" + idCuenta).header("Authorization", admin)).andExpect(status().isNoContent());
    }

    @Test
    void reglasDelUltimoAdminYDeLaSesionActual() throws Exception {
        String admin = bearer();
        JsonNode lista = json.readTree(mvc.perform(get("/api/admin/usuarios").header("Authorization", admin))
                .andReturn().getResponse().getContentAsString());
        int idAdmin = lista.findParents("nombreUsuario").stream().filter(n -> n.get("nombreUsuario").asText().equals("admin"))
                .findFirst().orElseThrow().get("id").asInt();
        mvc.perform(delete("/api/admin/usuarios/" + idAdmin).header("Authorization", admin))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.codigo").value("USUARIO_ACTUAL"));
        mvc.perform(put("/api/admin/usuarios/" + idAdmin).header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rol\":\"ADMIN\",\"idDocente\":null,\"activo\":false,\"contrasena\":null}"))
                .andExpect(status().isConflict());

        // Un segundo admin no puede dejar al sistema sin ADMIN activo.
        mvc.perform(post("/api/admin/usuarios").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombreUsuario\":\"coordinacion\",\"rol\":\"ADMIN\",\"idDocente\":null,\"contrasena\":\"Coordina2026\"}"))
                .andExpect(status().isOk());
        String segundo = entrar("coordinacion", "Coordina2026");
        mvc.perform(post("/api/admin/usuarios").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombreUsuario\":\"coordinacion\",\"rol\":\"ADMIN\",\"idDocente\":null,\"contrasena\":\"Coordina2026\"}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.codigo").value("DUPLICADO"));
        int idSegundo = json.readTree(mvc.perform(get("/api/admin/usuarios").header("Authorization", admin))
                .andReturn().getResponse().getContentAsString()).findParents("nombreUsuario").stream()
                .filter(n -> n.get("nombreUsuario").asText().equals("coordinacion")).findFirst().orElseThrow().get("id").asInt();
        mvc.perform(put("/api/admin/usuarios/" + idAdmin).header("Authorization", segundo).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rol\":\"ADMIN\",\"idDocente\":null,\"activo\":false,\"contrasena\":null}"))
                .andExpect(status().isOk());
        mvc.perform(delete("/api/admin/usuarios/" + idSegundo).header("Authorization", admin))
                .andExpect(status().isConflict());
        // Se deja todo como estaba para las demás pruebas.
        mvc.perform(put("/api/admin/usuarios/" + idAdmin).header("Authorization", segundo).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rol\":\"ADMIN\",\"idDocente\":null,\"activo\":true,\"contrasena\":null}"))
                .andExpect(status().isOk());
        mvc.perform(delete("/api/admin/usuarios/" + idSegundo).header("Authorization", admin)).andExpect(status().isNoContent());
    }

    @Test
    void noSePublicaUnHorarioParcial() throws Exception {
        String admin = bearer();
        cargar("demo", admin);
        // Una materia que exige computadores con un docente sin disponibilidad queda pendiente.
        mvc.perform(post("/api/admin/docentes").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"id\":\"DP1\",\"nombre\":\"Sin tiempo\",\"disponibilidad\":[]}")).andExpect(status().isOk());
        mvc.perform(post("/api/admin/materias").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"id\":\"CP1\",\"nombre\":\"Imposible\",\"numSesiones\":1,\"requisitos\":[],\"docentesHabilitados\":[\"DP1\"]}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/admin/grupos").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"id\":\"GP1\",\"idCurso\":\"CP1\",\"matriculados\":10}")).andExpect(status().isOk());
        JsonNode r = generar(admin);
        assertThat(r.get("estado").asText()).isEqualTo("PARCIAL");
        mvc.perform(post("/api/horarios/" + r.get("idEjecucion").asInt() + "/publicar").header("Authorization", admin))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.codigo").value("HORARIO_PARCIAL"));
        cargar("demo", admin);
    }
}
