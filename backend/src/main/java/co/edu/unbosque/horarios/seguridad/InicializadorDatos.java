package co.edu.unbosque.horarios.seguridad;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.persistencia.RepositorioParametros;
import co.edu.unbosque.horarios.persistencia.RepositorioUsuarios;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Al arrancar crea el usuario administrador si no existe y sincroniza el catálogo de franjas
 * con los parámetros guardados.
 */
@Component
public class InicializadorDatos implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(InicializadorDatos.class);

    private final RepositorioUsuarios usuarios;
    private final RepositorioParametros parametros;
    private final PasswordEncoder codificador;
    private final String usuarioAdmin;
    private final String claveAdmin;

    public InicializadorDatos(RepositorioUsuarios usuarios, RepositorioParametros parametros, PasswordEncoder codificador,
                              @Value("${app.admin.usuario}") String usuarioAdmin, @Value("${app.admin.clave}") String claveAdmin) {
        this.usuarios = usuarios;
        this.parametros = parametros;
        this.codificador = codificador;
        this.usuarioAdmin = usuarioAdmin;
        this.claveAdmin = claveAdmin;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (usuarios.buscar(usuarioAdmin).isEmpty()) {
            usuarios.crear(usuarioAdmin, codificador.encode(claveAdmin), "ADMIN");
            LOG.info("Usuario administrador {} creado", usuarioAdmin);
        }
        ConfiguracionParametros cfg = parametros.cargar();
        parametros.sincronizarFranjas(cfg.generarFranjasValidas());
        LOG.info("Grilla sincronizada con {} franjas válidas", cfg.generarFranjasValidas().size());
    }
}
