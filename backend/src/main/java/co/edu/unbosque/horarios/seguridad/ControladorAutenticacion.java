package co.edu.unbosque.horarios.seguridad;

import co.edu.unbosque.horarios.aplicacion.ExcepcionNegocio;
import co.edu.unbosque.horarios.aplicacion.dto.Dto;
import co.edu.unbosque.horarios.persistencia.RepositorioUsuarios;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Inicio de sesión. Verifica la contraseña con bcrypt y entrega el token JWT. */
@RestController
@RequestMapping("/api/auth")
public class ControladorAutenticacion {

    private final RepositorioUsuarios usuarios;
    private final PasswordEncoder codificador;
    private final ServicioJwt jwt;

    public ControladorAutenticacion(RepositorioUsuarios usuarios, PasswordEncoder codificador, ServicioJwt jwt) {
        this.usuarios = usuarios;
        this.codificador = codificador;
        this.jwt = jwt;
    }

    @PostMapping("/login")
    public Dto.Token login(@Valid @RequestBody Dto.Login login) {
        RepositorioUsuarios.Usuario u = usuarios.buscar(login.usuario())
                .filter(RepositorioUsuarios.Usuario::activo)
                .filter(x -> codificador.matches(login.contrasena(), x.hashContrasena()))
                .orElseThrow(() -> new ExcepcionNegocio(HttpStatus.UNAUTHORIZED, "CREDENCIALES_INVALIDAS",
                        "El usuario o la contraseña no son correctos"));
        return new Dto.Token(jwt.emitir(u.nombre(), u.rol(), u.idDocente()), jwt.segundosDeVigencia(), u.nombre(),
                u.rol(), u.idDocente());
    }
}
