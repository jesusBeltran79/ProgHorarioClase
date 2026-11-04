package co.edu.unbosque.horarios.aplicacion;

import co.edu.unbosque.horarios.aplicacion.dto.Dto;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * API REST del horario (RF-06, RF-07, RF-09). No tiene lógica. Delega todo en ServicioHorarios.
 */
@RestController
@RequestMapping("/api/horarios")
public class ControladorHorarios {

    private final ServicioHorarios servicio;

    public ControladorHorarios(ServicioHorarios servicio) {
        this.servicio = servicio;
    }

    @PostMapping("/generar")
    public Dto.Resultado generar(Authentication autenticacion) {
        return servicio.generar(autenticacion.getName());
    }

    @GetMapping
    public List<Dto.Ejecucion> listar() {
        return servicio.listar();
    }

    @GetMapping("/{id}")
    public Dto.Resultado obtener(@PathVariable int id) {
        return servicio.obtener(id);
    }

    @GetMapping("/{id}/alternativas/{idSesion}")
    public List<Dto.Alternativa> alternativas(@PathVariable int id, @PathVariable String idSesion) {
        return servicio.alternativas(id, idSesion);
    }

    @PostMapping("/{id}/reubicar")
    public Dto.Resultado reubicar(@PathVariable int id, @Valid @RequestBody Dto.Reubicacion solicitud) {
        return servicio.reubicar(id, solicitud);
    }

    @GetMapping("/{id}/exportar")
    public ResponseEntity<byte[]> exportar(@PathVariable int id) {
        byte[] csv = servicio.exportar(id).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"horario_" + id + ".csv\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv);
    }
}
