package co.edu.unbosque.horarios.persistencia;

import co.edu.unbosque.horarios.dominio.Asignacion;
import co.edu.unbosque.horarios.motor.ReporteConflicto;
import co.edu.unbosque.horarios.validacion.ReporteValidacion;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Historial de corridas del motor con sus asignaciones, conflictos y hallazgos (RF-06, RF-07, RNF-06).
 * Las restricciones UNIQUE de la tabla asignacion protegen RD-01 y RD-02 desde la base de datos.
 */
@Repository
public class RepositorioEjecuciones {

    public record Ejecucion(int id, String usuario, LocalDateTime fechaHora, String estado,
                            long nodosExplorados, long duracionMs) { }

    public record FilaAsignacion(String idSesion, String idDocente, String idAula,
                                 String dia, LocalTime horaInicio, LocalTime horaFin) { }

    public record FilaConflicto(String idSesion, Map<String, Integer> tuplasPorCodigo) { }

    private final JdbcTemplate jdbc;

    public RepositorioEjecuciones(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public int guardar(int idUsuario, boolean completo, long nodos, long ms, List<Asignacion> asignaciones,
                       List<ReporteConflicto> conflictos, List<ReporteValidacion> hallazgos) {
        KeyHolder kh = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO ejecucion_horario (id_usuario, fecha_hora, estado, nodos_explorados, duracion_ms) VALUES (?, ?, ?, ?, ?)",
                    new String[]{"id_ejecucion"});
            ps.setInt(1, idUsuario);
            ps.setTimestamp(2, Timestamp.valueOf(LocalDateTime.now().withNano(0)));
            ps.setString(3, completo ? "COMPLETO" : "PARCIAL");
            ps.setLong(4, nodos);
            ps.setInt(5, (int) Math.min(Integer.MAX_VALUE, ms));
            return ps;
        }, kh);
        int id = kh.getKey().intValue();
        jdbc.batchUpdate("INSERT INTO asignacion (id_ejecucion, id_sesion, id_docente, id_aula, dia, hora_inicio, hora_fin) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?)", asignaciones, Math.max(1, asignaciones.size()), (ps, a) -> {
            ps.setInt(1, id);
            ps.setString(2, a.getSesion().getId());
            ps.setString(3, a.getDocente().getId());
            ps.setString(4, a.getAula().getId());
            ps.setString(5, a.getFranja().getDia().name());
            ps.setTime(6, Time.valueOf(a.getFranja().getHoraInicio()));
            ps.setTime(7, Time.valueOf(a.getFranja().getHoraFin()));
        });
        for (ReporteConflicto c : conflictos) {
            guardarConflicto(id, c.idSesion(), c.tuplasBloqueadasPorCodigo());
        }
        for (ReporteValidacion h : hallazgos) {
            jdbc.update("INSERT INTO hallazgo_validacion (id_ejecucion, id_grupo, codigo, mensaje) VALUES (?, ?, ?, ?)",
                    id, h.idGrupo(), h.codigoRegla(), h.mensaje());
        }
        return id;
    }

    private void guardarConflicto(int idEjecucion, String idSesion, Map<String, Integer> tuplas) {
        KeyHolder kh = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO conflicto (id_ejecucion, id_sesion) VALUES (?, ?)", new String[]{"id_conflicto"});
            ps.setInt(1, idEjecucion);
            ps.setString(2, idSesion);
            return ps;
        }, kh);
        int idConflicto = kh.getKey().intValue();
        for (Map.Entry<String, Integer> e : tuplas.entrySet()) {
            if (e.getValue() > 0) {
                jdbc.update("INSERT INTO conflicto_restriccion (id_conflicto, codigo, tuplas_bloqueadas) VALUES (?, ?, ?)",
                        idConflicto, e.getKey(), e.getValue());
            }
        }
    }

    public Optional<Ejecucion> buscar(int id) {
        return jdbc.query("SELECT e.id_ejecucion, u.nombre_usuario, e.fecha_hora, e.estado, e.nodos_explorados, e.duracion_ms "
                        + "FROM ejecucion_horario e JOIN usuario u ON u.id_usuario = e.id_usuario WHERE e.id_ejecucion = ?",
                (rs, i) -> new Ejecucion(rs.getInt(1), rs.getString(2), rs.getTimestamp(3).toLocalDateTime(),
                        rs.getString(4), rs.getLong(5), rs.getLong(6)), id).stream().findFirst();
    }

    public List<Ejecucion> listar() {
        return jdbc.query("SELECT e.id_ejecucion, u.nombre_usuario, e.fecha_hora, e.estado, e.nodos_explorados, e.duracion_ms "
                        + "FROM ejecucion_horario e JOIN usuario u ON u.id_usuario = e.id_usuario ORDER BY e.id_ejecucion DESC",
                (rs, i) -> new Ejecucion(rs.getInt(1), rs.getString(2), rs.getTimestamp(3).toLocalDateTime(),
                        rs.getString(4), rs.getLong(5), rs.getLong(6)));
    }

    public List<FilaAsignacion> asignaciones(int id) {
        return jdbc.query("SELECT id_sesion, id_docente, id_aula, dia, hora_inicio, hora_fin FROM asignacion "
                        + "WHERE id_ejecucion = ? ORDER BY id_sesion",
                (rs, i) -> new FilaAsignacion(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4),
                        rs.getTime(5).toLocalTime(), rs.getTime(6).toLocalTime()), id);
    }

    public List<FilaConflicto> conflictos(int id) {
        Map<String, Map<String, Integer>> porSesion = new LinkedHashMap<>();
        jdbc.query("SELECT c.id_sesion, r.codigo, r.tuplas_bloqueadas FROM conflicto c "
                + "LEFT JOIN conflicto_restriccion r ON r.id_conflicto = c.id_conflicto "
                + "WHERE c.id_ejecucion = ? ORDER BY c.id_sesion, r.tuplas_bloqueadas DESC", rs -> {
            Map<String, Integer> m = porSesion.computeIfAbsent(rs.getString(1), k -> new LinkedHashMap<>());
            if (rs.getString(2) != null) m.put(rs.getString(2), rs.getInt(3));
        }, id);
        return porSesion.entrySet().stream().map(e -> new FilaConflicto(e.getKey(), e.getValue())).toList();
    }

    public List<ReporteValidacion> hallazgos(int id) {
        return jdbc.query("SELECT codigo, id_grupo, mensaje FROM hallazgo_validacion WHERE id_ejecucion = ? ORDER BY codigo, id_grupo",
                (rs, i) -> new ReporteValidacion(rs.getString(1), rs.getString(2), rs.getString(3)), id);
    }

    /** Reubica una sesión. Borra su asignación y su conflicto previos y guarda la nueva tupla. */
    public void reubicar(int idEjecucion, String idSesion, String idDocente, String idAula,
                         String dia, LocalTime inicio, LocalTime fin) {
        jdbc.update("DELETE FROM asignacion WHERE id_ejecucion = ? AND id_sesion = ?", idEjecucion, idSesion);
        jdbc.update("DELETE FROM conflicto_restriccion WHERE id_conflicto IN "
                + "(SELECT id_conflicto FROM conflicto WHERE id_ejecucion = ? AND id_sesion = ?)", idEjecucion, idSesion);
        jdbc.update("DELETE FROM conflicto WHERE id_ejecucion = ? AND id_sesion = ?", idEjecucion, idSesion);
        insertarAsignacion(idEjecucion, idSesion, idDocente, idAula, dia, inicio, fin);
    }

    /** Inserta una asignación directamente. Lo usan las pruebas que verifican las restricciones UNIQUE. */
    public void insertarAsignacion(int idEjecucion, String idSesion, String idDocente, String idAula,
                                   String dia, LocalTime inicio, LocalTime fin) {
        jdbc.update("INSERT INTO asignacion (id_ejecucion, id_sesion, id_docente, id_aula, dia, hora_inicio, hora_fin) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?)", idEjecucion, idSesion, idDocente, idAula, dia, Time.valueOf(inicio), Time.valueOf(fin));
    }

    public void actualizarEstado(int idEjecucion, boolean completo) {
        jdbc.update("UPDATE ejecucion_horario SET estado = ? WHERE id_ejecucion = ?",
                completo ? "COMPLETO" : "PARCIAL", idEjecucion);
    }

    public Map<String, String> descripcionesRestricciones() {
        Map<String, String> m = new LinkedHashMap<>();
        jdbc.query("SELECT codigo, descripcion FROM restriccion ORDER BY codigo", rs -> {
            m.put(rs.getString(1), rs.getString(2));
        });
        return m;
    }
}
