package co.edu.unbosque.horarios.aplicacion.cuentas;

import co.edu.unbosque.horarios.aplicacion.catalogos.DtoCatalogos.FranjaDisponible;
import co.edu.unbosque.horarios.aplicacion.cuentas.DtoCuentas.CambioContrasena;
import co.edu.unbosque.horarios.aplicacion.cuentas.DtoCuentas.MiDisponibilidad;
import co.edu.unbosque.horarios.aplicacion.cuentas.DtoCuentas.MiHorario;
import co.edu.unbosque.horarios.aplicacion.cuentas.DtoCuentas.Perfil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** API REST del portal del docente (RF-12 y RF-14). Solo perfil DOCENTE por la regla /api/mi/**. */
@RestController
@RequestMapping("/api/mi")
public class ControladorPortal {

    private final ServicioPortal portal;
    private final ServicioCuentas cuentas;

    public ControladorPortal(ServicioPortal portal, ServicioCuentas cuentas) {
        this.portal = portal;
        this.cuentas = cuentas;
    }

    @GetMapping("/perfil")
    public Perfil perfil(Authentication sesion) {
        return portal.perfil(sesion.getName());
    }

    @GetMapping("/horario")
    public MiHorario horario(Authentication sesion) {
        return portal.horario(sesion.getName());
    }

    @GetMapping("/disponibilidad")
    public MiDisponibilidad disponibilidad(Authentication sesion) {
        return portal.disponibilidad(sesion.getName());
    }

    @PutMapping("/disponibilidad")
    public MiDisponibilidad guardarDisponibilidad(@RequestBody List<FranjaDisponible> franjas, Authentication sesion) {
        return portal.guardarDisponibilidad(sesion.getName(), franjas);
    }

    @PutMapping("/contrasena")
    public ResponseEntity<Void> contrasena(@RequestBody CambioContrasena c, Authentication sesion) {
        cuentas.cambiarPropia(sesion.getName(), c.actual(), c.nueva());
        return ResponseEntity.noContent().build();
    }
}
