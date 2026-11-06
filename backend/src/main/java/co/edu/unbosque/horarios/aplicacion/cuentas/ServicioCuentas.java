package co.edu.unbosque.horarios.aplicacion.cuentas;

import co.edu.unbosque.horarios.aplicacion.ExcepcionNegocio;
import co.edu.unbosque.horarios.aplicacion.cuentas.DtoCuentas.UsuarioCambio;
import co.edu.unbosque.horarios.aplicacion.cuentas.DtoCuentas.UsuarioGestion;
import co.edu.unbosque.horarios.aplicacion.cuentas.DtoCuentas.UsuarioNuevo;
import co.edu.unbosque.horarios.persistencia.RepositorioCatalogos;
import co.edu.unbosque.horarios.persistencia.RepositorioUsuarios;
import co.edu.unbosque.horarios.persistencia.RepositorioUsuarios.Usuario;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/**
 * RF-11. Cuentas de usuario con dos perfiles. Un DOCENTE queda ligado a un registro de docente y cada
 * docente tiene a lo sumo una cuenta. Nunca se queda el sistema sin un ADMIN activo.
 */
@Service
public class ServicioCuentas {

    public static final int LARGO_MINIMO = 8;

    private final RepositorioUsuarios usuarios;
    private final RepositorioCatalogos catalogos;
    private final PasswordEncoder codificador;

    public ServicioCuentas(RepositorioUsuarios usuarios, RepositorioCatalogos catalogos, PasswordEncoder codificador) {
        this.usuarios = usuarios;
        this.catalogos = catalogos;
        this.codificador = codificador;
    }

    public List<UsuarioGestion> listar() {
        return usuarios.listar().stream().map(this::aDto).toList();
    }

    @Transactional
    public UsuarioGestion crear(UsuarioNuevo u) {
        String nombre = u.nombreUsuario() == null ? "" : u.nombreUsuario().trim();
        if (!nombre.matches("[A-Za-z0-9._-]{3,40}")) {
            throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "FORMATO",
                    "El usuario debe tener entre 3 y 40 letras, números, punto, guion o guion bajo");
        }
        if (usuarios.buscar(nombre).isPresent()) {
            throw new ExcepcionNegocio(HttpStatus.CONFLICT, "DUPLICADO", "El usuario " + nombre + " ya existe");
        }
        String rol = rol(u.rol());
        String idDocente = docenteDe(rol, u.idDocente(), -1);
        validarContrasena(u.contrasena());
        usuarios.crear(nombre, codificador.encode(u.contrasena()), rol, idDocente);
        return aDto(usuarios.buscar(nombre).orElseThrow());
    }

    @Transactional
    public UsuarioGestion editar(int id, UsuarioCambio c, String actual) {
        Usuario u = buscar(id);
        String rol = c.rol() == null ? u.rol() : rol(c.rol());
        boolean activo = c.activo() == null ? u.activo() : c.activo();
        String idDocente = docenteDe(rol, c.rol() == null && c.idDocente() == null ? u.idDocente() : c.idDocente(), id);
        boolean dejaDeSerAdminActivo = "ADMIN".equals(u.rol()) && u.activo() && (!"ADMIN".equals(rol) || !activo);
        if (dejaDeSerAdminActivo && u.nombre().equals(actual)) {
            throw new ExcepcionNegocio(HttpStatus.CONFLICT, "USUARIO_ACTUAL",
                    "No puede quitarse a sí mismo el perfil ADMIN ni desactivar su propia cuenta");
        }
        if (dejaDeSerAdminActivo && usuarios.adminsActivos() <= 1) {
            throw new ExcepcionNegocio(HttpStatus.CONFLICT, "ULTIMO_ADMIN", "Debe quedar al menos un ADMIN activo");
        }
        usuarios.actualizar(id, rol, idDocente, activo);
        if (c.contrasena() != null && !c.contrasena().isEmpty()) {
            validarContrasena(c.contrasena());
            usuarios.cambiarContrasena(id, codificador.encode(c.contrasena()));
        }
        return aDto(buscar(id));
    }

    @Transactional
    public void borrar(int id, String actual) {
        Usuario u = buscar(id);
        if (u.nombre().equals(actual)) {
            throw new ExcepcionNegocio(HttpStatus.CONFLICT, "USUARIO_ACTUAL", "No puede borrar la cuenta con la que inició sesión");
        }
        if ("ADMIN".equals(u.rol()) && u.activo() && usuarios.adminsActivos() <= 1) {
            throw new ExcepcionNegocio(HttpStatus.CONFLICT, "ULTIMO_ADMIN", "Debe quedar al menos un ADMIN activo");
        }
        int heredero = usuarios.buscar(actual).map(Usuario::id).orElseThrow();
        usuarios.borrar(id, heredero);
    }

    /** Cambio de contraseña del propio usuario. Exige la contraseña actual. */
    @Transactional
    public void cambiarPropia(String nombre, String actual, String nueva) {
        Usuario u = usuarios.buscar(nombre).orElseThrow();
        if (actual == null || !codificador.matches(actual, u.hashContrasena())) {
            throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "CONTRASENA_INCORRECTA", "La contraseña actual no coincide");
        }
        validarContrasena(nueva);
        usuarios.cambiarContrasena(u.id(), codificador.encode(nueva));
    }

    private String docenteDe(String rol, String idDocente, int idUsuario) {
        if ("ADMIN".equals(rol)) return null;
        if (idDocente == null || idDocente.isBlank()) {
            throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "FORMATO", "Una cuenta DOCENTE debe estar ligada a un docente");
        }
        if (!catalogos.existe("docente", "id_docente", idDocente)) {
            throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "REFERENCIA", "El docente " + idDocente + " no existe");
        }
        usuarios.buscarPorDocente(idDocente).filter(o -> o.id() != idUsuario).ifPresent(o -> {
            throw new ExcepcionNegocio(HttpStatus.CONFLICT, "DOCENTE_CON_CUENTA",
                    "El docente " + idDocente + " ya tiene la cuenta " + o.nombre());
        });
        return idDocente;
    }

    private static String rol(String rol) {
        String r = rol == null ? "" : rol.trim().toUpperCase(Locale.ROOT);
        if (!r.equals("ADMIN") && !r.equals("DOCENTE")) {
            throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "FORMATO", "El perfil debe ser ADMIN o DOCENTE");
        }
        return r;
    }

    private static void validarContrasena(String c) {
        if (c == null || c.length() < LARGO_MINIMO) {
            throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "FORMATO",
                    "La contraseña debe tener al menos " + LARGO_MINIMO + " caracteres");
        }
    }

    private Usuario buscar(int id) {
        return usuarios.buscarPorId(id).orElseThrow(() ->
                new ExcepcionNegocio(HttpStatus.NOT_FOUND, "NO_ENCONTRADO", "El usuario " + id + " no existe"));
    }

    private UsuarioGestion aDto(Usuario u) {
        return new UsuarioGestion(u.id(), u.nombre(), u.rol(), u.idDocente(),
                usuarios.nombreDocente(u.idDocente()).orElse(null), u.activo());
    }
}
