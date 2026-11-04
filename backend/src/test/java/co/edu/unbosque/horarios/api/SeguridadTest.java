package co.edu.unbosque.horarios.api;

import co.edu.unbosque.horarios.soporte.Evidencia;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** RNF-06. Solo un administrador autenticado con JWT puede usar la API. */
class SeguridadTest extends ApiBase {

    @Test
    @DisplayName("RNF-06 generar sin token responde 401")
    void sinToken() throws Exception {
        mvc.perform(post("/api/horarios/generar")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.codigo").value("NO_AUTENTICADO"));
        Evidencia.ruptura("SEGURIDAD bloqueó POST /api/horarios/generar sin token con 401 NO_AUTENTICADO");
    }

    @Test
    @DisplayName("RNF-06 una contraseña incorrecta no entrega token")
    void credencialesInvalidas() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"admin\",\"contrasena\":\"otra\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.codigo").value("CREDENCIALES_INVALIDAS"));
        Evidencia.ruptura("SEGURIDAD rechazó el inicio de sesión con contraseña incorrecta con 401");
    }

    @Test
    @DisplayName("RNF-06 un token alterado no da acceso")
    void tokenAlterado() throws Exception {
        String t = token();
        String alterado = t.substring(0, t.length() - 3) + (t.endsWith("aaa") ? "bbb" : "aaa");
        mvc.perform(get("/api/parametros").header("Authorization", "Bearer " + alterado))
                .andExpect(status().isUnauthorized());
        Evidencia.ruptura("SEGURIDAD rechazó un token JWT con la firma alterada con 401");
    }

    @Test
    @DisplayName("RNF-06 con token válido la API responde y la salud es pública")
    void tokenValido() throws Exception {
        String t = token();
        assertTrue(t.split("\\.").length == 3);
        mvc.perform(get("/api/parametros").header("Authorization", "Bearer " + t)).andExpect(status().isOk());
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
