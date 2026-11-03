package co.edu.unbosque.horarios.aplicacion;

import co.edu.unbosque.horarios.aplicacion.dto.Dto;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Carga de inventarios y resumen de validación (RF-01 a RF-05). */
@RestController
@RequestMapping("/api/inventarios")
public class ControladorInventarios {

    private final ServicioInventarios servicio;

    public ControladorInventarios(ServicioInventarios servicio) {
        this.servicio = servicio;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Dto.ResumenCarga cargar(@RequestPart("docentes") MultipartFile docentes,
                                   @RequestPart("aulas") MultipartFile aulas,
                                   @RequestPart("cursos") MultipartFile cursos,
                                   @RequestPart("grupos") MultipartFile grupos) {
        return servicio.cargar(docentes, aulas, cursos, grupos);
    }

    @GetMapping("/catalogo")
    public Dto.Catalogo catalogo() {
        return servicio.catalogo();
    }

    @GetMapping("/resumen")
    public Dto.ResumenCarga resumen() {
        return servicio.resumen();
    }
}
