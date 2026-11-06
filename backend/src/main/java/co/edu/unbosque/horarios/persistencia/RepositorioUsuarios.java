package co.edu.unbosque.horarios.persistencia;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Usuarios del sistema (RNF-06). Dos perfiles. ADMIN gestiona todo y DOCENTE queda ligado a un
 * registro de la tabla docente. La contraseña se guarda con bcrypt.
 */
@Repository
public class RepositorioUsuarios {

    public record Usuario(int id, String nombre, String hashContrasena, String rol, String idDocente, boolean activo) { }

    private static final String COLUMNAS = "SELECT id_usuario, nombre_usuario, hash_contrasena, rol, id_docente, activo FROM usuario ";

    private final JdbcTemplate jdbc;

    public RepositorioUsuarios(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static Usuario mapear(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new Usuario(rs.getInt(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getString(5), rs.getBoolean(6));
    }

    public Optional<Usuario> buscar(String nombre) {
        return jdbc.query(COLUMNAS + "WHERE nombre_usuario = ?", (rs, i) -> mapear(rs), nombre).stream().findFirst();
    }

    public Optional<Usuario> buscarPorId(int id) {
        return jdbc.query(COLUMNAS + "WHERE id_usuario = ?", (rs, i) -> mapear(rs), id).stream().findFirst();
    }

    public List<Usuario> listar() {
        return jdbc.query(COLUMNAS + "ORDER BY rol, nombre_usuario", (rs, i) -> mapear(rs));
    }

    public void crear(String nombre, String hash, String rol) {
        crear(nombre, hash, rol, null);
    }

    public void crear(String nombre, String hash, String rol, String idDocente) {
        jdbc.update("INSERT INTO usuario (nombre_usuario, hash_contrasena, rol, id_docente) VALUES (?, ?, ?, ?)",
                nombre, hash, rol, idDocente);
    }

    public Optional<Usuario> buscarPorDocente(String idDocente) {
        return jdbc.query(COLUMNAS + "WHERE id_docente = ?", (rs, i) -> mapear(rs), idDocente).stream().findFirst();
    }

    public void actualizar(int id, String rol, String idDocente, boolean activo) {
        jdbc.update("UPDATE usuario SET rol = ?, id_docente = ?, activo = ? WHERE id_usuario = ?", rol, idDocente, activo, id);
    }

    public void cambiarContrasena(int id, String hash) {
        jdbc.update("UPDATE usuario SET hash_contrasena = ? WHERE id_usuario = ?", hash, id);
    }

    /** Las ejecuciones del usuario borrado pasan a quien lo borra para no perder el historial. */
    public void borrar(int id, int idHeredero) {
        jdbc.update("UPDATE ejecucion_horario SET id_usuario = ? WHERE id_usuario = ?", idHeredero, id);
        jdbc.update("DELETE FROM usuario WHERE id_usuario = ?", id);
    }

    public int adminsActivos() {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM usuario WHERE rol = 'ADMIN' AND activo = TRUE", Integer.class);
        return n == null ? 0 : n;
    }

    public Optional<String> nombreDocente(String idDocente) {
        if (idDocente == null) return Optional.empty();
        return jdbc.queryForList("SELECT nombre FROM docente WHERE id_docente = ?", String.class, idDocente).stream().findFirst();
    }
}
