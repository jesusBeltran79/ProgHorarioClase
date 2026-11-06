package co.edu.unbosque.horarios.persistencia;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Time;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Altas, cambios y bajas de docentes, aulas, materias y grupos desde la interfaz (RF-10).
 * Mantiene las mismas tablas del DER que llena el cargador CSV.
 */
@Repository
public class RepositorioCatalogos {

    public record Disponible(String dia, LocalTime horaInicio) { }
    public record Docente(String id, String nombre, String dedicacion, String escalafon, List<Disponible> disponibilidad) { }
    public record Aula(String id, int capacidad, List<String> caracteristicas) { }
    public record Materia(String id, String nombre, int numSesiones, List<String> requisitos, List<String> habilitados) { }
    public record Grupo(String id, String idCurso, int matriculados) { }

    private final JdbcTemplate jdbc;

    public RepositorioCatalogos(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Un cambio de catálogo deja sin sentido los horarios anteriores, así que se borran. */
    public void borrarEjecuciones() {
        for (String t : List.of("hallazgo_validacion", "conflicto_restriccion", "conflicto", "asignacion", "ejecucion_horario")) {
            jdbc.update("DELETE FROM " + t);
        }
    }

    public boolean existe(String tabla, String columna, String id) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM " + tabla + " WHERE " + columna + " = ?", Integer.class, id);
        return n != null && n > 0;
    }

    // ---------------- Docentes ----------------

    public List<Docente> docentes() {
        Map<String, List<Disponible>> disp = new HashMap<>();
        jdbc.query("SELECT id_docente, dia, hora_inicio FROM disponibilidad_docente", rs -> {
            disp.computeIfAbsent(rs.getString(1), k -> new ArrayList<>())
                    .add(new Disponible(rs.getString(2), rs.getTime(3).toLocalTime()));
        });
        return jdbc.query("SELECT id_docente, nombre, dedicacion, escalafon FROM docente ORDER BY id_docente",
                (rs, i) -> new Docente(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4),
                        disp.getOrDefault(rs.getString(1), List.of())));
    }

    public void guardarDocente(Docente d, boolean nuevo) {
        if (nuevo) {
            jdbc.update("INSERT INTO docente (id_docente, nombre, dedicacion, escalafon) VALUES (?, ?, ?, ?)",
                    d.id(), d.nombre(), d.dedicacion(), d.escalafon());
        } else {
            jdbc.update("UPDATE docente SET nombre = ?, dedicacion = ?, escalafon = ? WHERE id_docente = ?",
                    d.nombre(), d.dedicacion(), d.escalafon(), d.id());
        }
        reemplazarDisponibilidad(d.id(), d.disponibilidad());
    }

    public void reemplazarDisponibilidad(String idDocente, List<Disponible> disponibilidad) {
        jdbc.update("DELETE FROM disponibilidad_docente WHERE id_docente = ?", idDocente);
        for (Disponible x : disponibilidad) {
            jdbc.update("INSERT INTO disponibilidad_docente (id_docente, dia, hora_inicio) VALUES (?, ?, ?)",
                    idDocente, x.dia(), Time.valueOf(x.horaInicio()));
        }
    }

    public void borrarDocente(String id) {
        jdbc.update("DELETE FROM usuario WHERE id_docente = ?", id);
        jdbc.update("DELETE FROM disponibilidad_docente WHERE id_docente = ?", id);
        jdbc.update("DELETE FROM habilitacion_docente WHERE id_docente = ?", id);
        jdbc.update("DELETE FROM docente WHERE id_docente = ?", id);
    }

    // ---------------- Aulas ----------------

    public List<Aula> aulas() {
        Map<String, List<String>> carac = new HashMap<>();
        jdbc.query("SELECT id_aula, id_caracteristica FROM aula_caracteristica ORDER BY id_caracteristica", rs -> {
            carac.computeIfAbsent(rs.getString(1), k -> new ArrayList<>()).add(rs.getString(2));
        });
        return jdbc.query("SELECT id_aula, capacidad FROM aula ORDER BY id_aula",
                (rs, i) -> new Aula(rs.getString(1), rs.getInt(2), carac.getOrDefault(rs.getString(1), List.of())));
    }

    public void guardarAula(Aula a, boolean nueva) {
        if (nueva) {
            jdbc.update("INSERT INTO aula (id_aula, capacidad) VALUES (?, ?)", a.id(), a.capacidad());
        } else {
            jdbc.update("UPDATE aula SET capacidad = ? WHERE id_aula = ?", a.capacidad(), a.id());
        }
        jdbc.update("DELETE FROM aula_caracteristica WHERE id_aula = ?", a.id());
        for (String c : a.caracteristicas()) {
            jdbc.update("INSERT INTO aula_caracteristica (id_aula, id_caracteristica) VALUES (?, ?)", a.id(), c);
        }
    }

    public void borrarAula(String id) {
        jdbc.update("DELETE FROM aula_caracteristica WHERE id_aula = ?", id);
        jdbc.update("DELETE FROM aula WHERE id_aula = ?", id);
    }

    // ---------------- Materias ----------------

    public List<Materia> materias() {
        Map<String, List<String>> req = new HashMap<>();
        jdbc.query("SELECT id_curso, id_caracteristica FROM curso_requisito_aula ORDER BY id_caracteristica", rs -> {
            req.computeIfAbsent(rs.getString(1), k -> new ArrayList<>()).add(rs.getString(2));
        });
        Map<String, List<String>> hab = new HashMap<>();
        jdbc.query("SELECT id_curso, id_docente FROM habilitacion_docente ORDER BY id_docente", rs -> {
            hab.computeIfAbsent(rs.getString(1), k -> new ArrayList<>()).add(rs.getString(2));
        });
        return jdbc.query("SELECT id_curso, nombre, num_sesiones_semanales FROM curso ORDER BY id_curso",
                (rs, i) -> new Materia(rs.getString(1), rs.getString(2), rs.getInt(3),
                        req.getOrDefault(rs.getString(1), List.of()), hab.getOrDefault(rs.getString(1), List.of())));
    }

    public void guardarMateria(Materia m, boolean nueva) {
        if (nueva) {
            jdbc.update("INSERT INTO curso (id_curso, nombre, num_sesiones_semanales) VALUES (?, ?, ?)",
                    m.id(), m.nombre(), m.numSesiones());
        } else {
            jdbc.update("UPDATE curso SET nombre = ?, num_sesiones_semanales = ? WHERE id_curso = ?",
                    m.nombre(), m.numSesiones(), m.id());
        }
        jdbc.update("DELETE FROM curso_requisito_aula WHERE id_curso = ?", m.id());
        for (String r : m.requisitos()) {
            jdbc.update("INSERT INTO curso_requisito_aula (id_curso, id_caracteristica) VALUES (?, ?)", m.id(), r);
        }
        jdbc.update("DELETE FROM habilitacion_docente WHERE id_curso = ?", m.id());
        for (String d : m.habilitados()) {
            jdbc.update("INSERT INTO habilitacion_docente (id_curso, id_docente) VALUES (?, ?)", m.id(), d);
        }
        for (String g : jdbc.queryForList("SELECT id_grupo FROM grupo WHERE id_curso = ?", String.class, m.id())) {
            regenerarSesiones(g, m.numSesiones());
        }
    }

    public void borrarMateria(String id) {
        for (String g : jdbc.queryForList("SELECT id_grupo FROM grupo WHERE id_curso = ?", String.class, id)) {
            borrarGrupo(g);
        }
        jdbc.update("DELETE FROM curso_requisito_aula WHERE id_curso = ?", id);
        jdbc.update("DELETE FROM habilitacion_docente WHERE id_curso = ?", id);
        jdbc.update("DELETE FROM curso WHERE id_curso = ?", id);
    }

    public int sesionesDe(String idCurso) {
        Integer n = jdbc.queryForObject("SELECT num_sesiones_semanales FROM curso WHERE id_curso = ?", Integer.class, idCurso);
        return n == null ? 0 : n;
    }

    // ---------------- Grupos ----------------

    public List<Grupo> grupos() {
        return jdbc.query("SELECT id_grupo, id_curso, matriculados FROM grupo ORDER BY id_grupo",
                (rs, i) -> new Grupo(rs.getString(1), rs.getString(2), rs.getInt(3)));
    }

    public void guardarGrupo(Grupo g, boolean nuevo) {
        if (nuevo) {
            jdbc.update("INSERT INTO grupo (id_grupo, id_curso, matriculados) VALUES (?, ?, ?)", g.id(), g.idCurso(), g.matriculados());
        } else {
            jdbc.update("UPDATE grupo SET id_curso = ?, matriculados = ? WHERE id_grupo = ?", g.idCurso(), g.matriculados(), g.id());
        }
        regenerarSesiones(g.id(), sesionesDe(g.idCurso()));
    }

    public void borrarGrupo(String id) {
        jdbc.update("DELETE FROM sesion WHERE id_grupo = ?", id);
        jdbc.update("DELETE FROM grupo WHERE id_grupo = ?", id);
    }

    private void regenerarSesiones(String idGrupo, int n) {
        jdbc.update("DELETE FROM sesion WHERE id_grupo = ?", idGrupo);
        for (int s = 1; s <= n; s++) {
            jdbc.update("INSERT INTO sesion (id_sesion, id_grupo, numero_sesion) VALUES (?, ?, ?)",
                    ConstructorDominio.idSesion(idGrupo, s), idGrupo, s);
        }
    }
}
