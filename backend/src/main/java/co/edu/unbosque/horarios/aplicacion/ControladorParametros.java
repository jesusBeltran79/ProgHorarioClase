package co.edu.unbosque.horarios.aplicacion;

import co.edu.unbosque.horarios.aplicacion.dto.Dto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Parámetros del semestre (RF-08). */
@RestController
@RequestMapping("/api/parametros")
public class ControladorParametros {

    private final ServicioParametros servicio;

    public ControladorParametros(ServicioParametros servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    public Dto.Parametros obtener() {
        return servicio.obtener();
    }

    @PutMapping
    public Dto.Parametros actualizar(@RequestBody Dto.Parametros parametros) {
        return servicio.actualizar(parametros);
    }
}
