package co.edu.unbosque.horarios.persistencia;

import co.edu.unbosque.horarios.dominio.CaracteristicaAula;
import co.edu.unbosque.horarios.dominio.DiaSemana;
import co.edu.unbosque.horarios.persistencia.InventarioCargado.Disponibilidad;
import co.edu.unbosque.horarios.persistencia.InventarioCargado.RegistroAula;
import co.edu.unbosque.horarios.persistencia.InventarioCargado.RegistroCurso;
import co.edu.unbosque.horarios.persistencia.InventarioCargado.RegistroDocente;
import co.edu.unbosque.horarios.persistencia.InventarioCargado.RegistroGrupo;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Time;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Guarda y lee los inventarios de docentes, aulas, cursos y grupos (RF-01 a RF-04).
 * Una carga nueva reemplaza la anterior y, como las ejecuciones apuntan a esas sesiones,
 * también borra el historial de ejecuciones. Esa limitación está declarada en el acta.
 */
@Repository
public class RepositorioInventarios {

    public record Conteos(int docentes, int aulas, int cursos, int grupos, int sesiones) { }

    private final JdbcTemplate jdbc;

    public RepositorioInventarios(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void reemplazar(InventarioCargado inv) {
        for (String tabla : List.of("hallazgo_validacion", "conflicto_restriccion", "conflicto", "asignacion",
                "ejecucion_horario", "sesion", "grupo", "habilitacion_docente", "curso_requisito_aula", "curso",
                "aula_caracteristica", "aula", "disponibilidad_docente")) {
            jdbc.update("DELETE FROM " + tabla);
        }
        // Los docentes se actualizan en lugar de borrarse porque un usuario DOCENTE apunta a su registro.
        // Si un docente ya no viene en la carga se borra junto con su usuario.
        java.util.Set<String> nuevos = new java.util.HashSet<>();
        inv.docentes().forEach(d -> nuevos.add(d.id()));
        for (String existente : jdbc.queryForList("SELECT id_docente FROM docente", String.class)) {
            if (!nuevos.contains(existente)) {
                jdbc.update("DELETE FROM usuario WHERE id_docente = ?", existente);
                jdbc.update("DELETE FROM docente WHERE id_docente = ?", existente);
            }
        }
        for (RegistroDocente d : inv.docentes()) {
            int actualizados = jdbc.update("UPDATE docente SET nombre = ?, dedicacion = ?, escalafon = ? WHERE id_docente = ?",
                    d.nombre(), vacioANulo(d.dedicacion()), vacioANulo(d.escalafon()), d.id());
            if (actualizados == 0) {
                jdbc.update("INSERT INTO docente (id_docente, nombre, dedicacion, escalafon) VALUES (?, ?, ?, ?)",
                        d.id(), d.nombre(), vacioANulo(d.dedicacion()), vacioANulo(d.escalafon()));
            }
            jdbc.batchUpdate("INSERT INTO disponibilidad_docente (id_docente, dia, hora_inicio) VALUES (?, ?, ?)",
                    d.disponibilidad(), d.disponibilidad().size(), (ps, x) -> {
                        ps.setString(1, d.id());
                        ps.setString(2, x.dia().name());
                        ps.setTime(3, Time.valueOf(x.horaInicio()));
                    });
        }
        for (RegistroAula a : inv.aulas()) {
            jdbc.update("INSERT INTO aula (id_aula, capacidad) VALUES (?, ?)", a.id(), a.capacidad());
            for (CaracteristicaAula c : a.caracteristicas()) {
                jdbc.update("INSERT INTO aula_caracteristica (id_aula, id_caracteristica) VALUES (?, ?)", a.id(), c.name());
            }
        }
        for (RegistroCurso c : inv.cursos()) {
            jdbc.update("INSERT INTO curso (id_curso, nombre, num_sesiones_semanales) VALUES (?, ?, ?)",
                    c.id(), c.nombre(), c.numSesiones());
            for (CaracteristicaAula r : c.requisitos()) {
                jdbc.update("INSERT INTO curso_requisito_aula (id_curso, id_caracteristica) VALUES (?, ?)", c.id(), r.name());
            }
            for (String d : c.docentesHabilitados()) {
                jdbc.update("INSERT INTO habilitacion_docente (id_curso, id_docente) VALUES (?, ?)", c.id(), d);
            }
        }
        Map<String, Integer> sesionesPorCurso = new HashMap<>();
        inv.cursos().forEach(c -> sesionesPorCurso.put(c.id(), c.numSesiones()));
        for (RegistroGrupo g : inv.grupos()) {
            jdbc.update("INSERT INTO grupo (id_grupo, id_curso, matriculados) VALUES (?, ?, ?)",
                    g.id(), g.idCurso(), g.matriculados());
            int n = sesionesPorCurso.getOrDefault(g.idCurso(), 0);
            for (int s = 1; s <= n; s++) {
                jdbc.update("INSERT INTO sesion (id_sesion, id_grupo, numero_sesion) VALUES (?, ?, ?)",
                        ConstructorDominio.idSesion(g.id(), s), g.id(), s);
            }
        }
    }

    /** Reconstruye el inventario guardado con la misma forma que produce el cargador. */
    public InventarioCargado cargar() {
        Map<String, List<Disponibilidad>> disp = new HashMap<>();
        jdbc.query("SELECT id_docente, dia, hora_inicio FROM disponibilidad_docente ORDER BY id_docente, dia, hora_inicio", rs -> {
            disp.computeIfAbsent(rs.getString(1), k -> new ArrayList<>())
                    .add(new Disponibilidad(DiaSemana.valueOf(rs.getString(2)), rs.getTime(3).toLocalTime()));
        });
        List<RegistroDocente> docentes = jdbc.query(
                "SELECT id_docente, nombre, dedicacion, escalafon FROM docente ORDER BY id_docente",
                (rs, i) -> new RegistroDocente(rs.getString(1), rs.getString(2), nuloAVacio(rs.getString(3)),
                        nuloAVacio(rs.getString(4)), disp.getOrDefault(rs.getString(1), List.of())));

        Map<String, Set<CaracteristicaAula>> caracAula = new HashMap<>();
        jdbc.query("SELECT id_aula, id_caracteristica FROM aula_caracteristica", rs -> {
            caracAula.computeIfAbsent(rs.getString(1), k -> EnumSet.noneOf(CaracteristicaAula.class))
                    .add(CaracteristicaAula.valueOf(rs.getString(2)));
        });
        List<RegistroAula> aulas = jdbc.query("SELECT id_aula, capacidad FROM aula ORDER BY id_aula",
                (rs, i) -> new RegistroAula(rs.getString(1), rs.getInt(2),
                        caracAula.getOrDefault(rs.getString(1), EnumSet.noneOf(CaracteristicaAula.class))));

        Map<String, Set<CaracteristicaAula>> req = new HashMap<>();
        jdbc.query("SELECT id_curso, id_caracteristica FROM curso_requisito_aula", rs -> {
            req.computeIfAbsent(rs.getString(1), k -> EnumSet.noneOf(CaracteristicaAula.class))
                    .add(CaracteristicaAula.valueOf(rs.getString(2)));
        });
        Map<String, Set<String>> hab = new LinkedHashMap<>();
        jdbc.query("SELECT id_curso, id_docente FROM habilitacion_docente ORDER BY id_curso, id_docente", rs -> {
            hab.computeIfAbsent(rs.getString(1), k -> new LinkedHashSet<>()).add(rs.getString(2));
        });
        List<RegistroCurso> cursos = jdbc.query(
                "SELECT id_curso, nombre, num_sesiones_semanales FROM curso ORDER BY id_curso",
                (rs, i) -> new RegistroCurso(rs.getString(1), rs.getString(2), rs.getInt(3),
                        req.getOrDefault(rs.getString(1), EnumSet.noneOf(CaracteristicaAula.class)),
                        hab.getOrDefault(rs.getString(1), Set.of())));
        List<RegistroGrupo> grupos = jdbc.query("SELECT id_grupo, id_curso, matriculados FROM grupo ORDER BY id_grupo",
                (rs, i) -> new RegistroGrupo(rs.getString(1), rs.getString(2), rs.getInt(3)));
        return new InventarioCargado(docentes, aulas, cursos, grupos, List.of());
    }

    public Conteos contar() {
        return new Conteos(contar("docente"), contar("aula"), contar("curso"), contar("grupo"), contar("sesion"));
    }

    private int contar(String tabla) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM " + tabla, Integer.class);
        return n == null ? 0 : n;
    }

    private static String vacioANulo(String s) {
        return s == null || s.isBlank() ? null : s;
    }

    private static String nuloAVacio(String s) {
        return s == null ? "" : s;
    }
}
