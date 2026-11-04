package co.edu.unbosque.horarios.persistencia;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/** Usuarios con perfil administrador (RNF-06). La contraseña se guarda con bcrypt. */
@Repository
public class RepositorioUsuarios {

    public record Usuario(int id, String nombre, String hashContrasena, String rol) { }

    private final JdbcTemplate jdbc;

    public RepositorioUsuarios(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Usuario> buscar(String nombre) {
        List<Usuario> lista = jdbc.query(
                "SELECT id_usuario, nombre_usuario, hash_contrasena, rol FROM usuario WHERE nombre_usuario = ?",
                (rs, i) -> new Usuario(rs.getInt(1), rs.getString(2), rs.getString(3), rs.getString(4)), nombre);
        return lista.stream().findFirst();
    }

    public void crear(String nombre, String hash, String rol) {
        jdbc.update("INSERT INTO usuario (nombre_usuario, hash_contrasena, rol) VALUES (?, ?, ?)", nombre, hash, rol);
    }
}
