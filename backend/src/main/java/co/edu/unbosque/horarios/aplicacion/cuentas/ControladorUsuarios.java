package co.edu.unbosque.horarios.aplicacion.cuentas;

import co.edu.unbosque.horarios.aplicacion.cuentas.DtoCuentas.UsuarioCambio;
import co.edu.unbosque.horarios.aplicacion.cuentas.DtoCuentas.UsuarioGestion;
import co.edu.unbosque.horarios.aplicacion.cuentas.DtoCuentas.UsuarioNuevo;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** API REST de cuentas (RF-11). Solo perfil ADMIN por la regla /api/admin/** de ConfiguracionSeguridad. */
@RestController
@RequestMapping("/api/admin/usuarios")
public class ControladorUsuarios {

    private final ServicioCuentas servicio;

    public ControladorUsuarios(ServicioCuentas servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    public List<UsuarioGestion> listar() {
        return servicio.listar();
    }

    @PostMapping
    public UsuarioGestion crear(@RequestBody UsuarioNuevo u) {
        return servicio.crear(u);
    }

    @PutMapping("/{id}")
    public UsuarioGestion editar(@PathVariable int id, @RequestBody UsuarioCambio c, Authentication sesion) {
        return servicio.editar(id, c, sesion.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> borrar(@PathVariable int id, Authentication sesion) {
        servicio.borrar(id, sesion.getName());
        return ResponseEntity.noContent().build();
    }
}
