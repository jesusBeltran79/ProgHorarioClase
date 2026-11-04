package co.edu.unbosque.horarios.api;

import co.edu.unbosque.horarios.soporte.Datos;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/** Base de las pruebas de integración. Levanta la aplicación completa sobre H2 en modo PostgreSQL. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
abstract class ApiBase {

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper json;

    protected String token() throws Exception {
        MvcResult r = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"usuario\":\"admin\",\"contrasena\":\"Horarios2026*\"}")).andReturn();
        return json.readTree(r.getResponse().getContentAsString()).get("token").asText();
    }

    protected String bearer() throws Exception {
        return "Bearer " + token();
    }

    protected JsonNode cargar(String conjunto, String bearer) throws Exception {
        Path c = Datos.carpeta(conjunto);
        MvcResult r = mvc.perform(multipart("/api/inventarios")
                        .file(archivo("docentes", c))
                        .file(archivo("aulas", c))
                        .file(archivo("cursos", c))
                        .file(archivo("grupos", c))
                        .header("Authorization", bearer))
                .andReturn();
        return json.readTree(r.getResponse().getContentAsString());
    }

    protected JsonNode generar(String bearer) throws Exception {
        MvcResult r = mvc.perform(post("/api/horarios/generar").header("Authorization", bearer)).andReturn();
        return json.readTree(r.getResponse().getContentAsString());
    }

    private static MockMultipartFile archivo(String nombre, Path carpeta) throws Exception {
        return new MockMultipartFile(nombre, nombre + ".csv", "text/csv",
                Files.readAllBytes(carpeta.resolve(nombre + ".csv")));
    }
}
