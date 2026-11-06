package co.edu.unbosque.horarios.aplicacion.catalogos;

import co.edu.unbosque.horarios.aplicacion.ExcepcionNegocio;
import co.edu.unbosque.horarios.aplicacion.catalogos.DtoCatalogos.AulaGestion;
import co.edu.unbosque.horarios.aplicacion.catalogos.DtoCatalogos.DocenteGestion;
import co.edu.unbosque.horarios.aplicacion.catalogos.DtoCatalogos.FranjaDisponible;
import co.edu.unbosque.horarios.aplicacion.catalogos.DtoCatalogos.GrupoGestion;
import co.edu.unbosque.horarios.aplicacion.catalogos.DtoCatalogos.MateriaGestion;
import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.CaracteristicaAula;
import co.edu.unbosque.horarios.dominio.DiaSemana;
import co.edu.unbosque.horarios.dominio.FranjaHoraria;
import co.edu.unbosque.horarios.persistencia.RepositorioCatalogos;
import co.edu.unbosque.horarios.persistencia.RepositorioCatalogos.Disponible;
import co.edu.unbosque.horarios.persistencia.RepositorioParametros;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;

/**
 * Gestión de docentes, aulas, materias y grupos desde la interfaz (RF-10). Valida con las mismas
 * reglas del cargador CSV (RD-03, RD-07, características y referencias). Todo cambio borra los
 * horarios generados porque dejan de corresponder a los datos.
 */
@Service
public class ServicioCatalogos {

    private final RepositorioCatalogos repo;
    private final RepositorioParametros parametros;

    public ServicioCatalogos(RepositorioCatalogos repo, RepositorioParametros parametros) {
        this.repo = repo;
        this.parametros = parametros;
    }

    // ---------------- Docentes ----------------

    public List<DocenteGestion> docentes() {
        return repo.docentes().stream().map(d -> new DocenteGestion(d.id(), d.nombre(), d.dedicacion(), d.escalafon(),
                d.disponibilidad().stream().map(x -> new FranjaDisponible(x.dia(), x.horaInicio().toString())).toList())).toList();
    }

    @Transactional
    public DocenteGestion guardarDocente(DocenteGestion d, String idRuta) {
        boolean nuevo = idRuta == null;
        String id = texto(nuevo ? d.id() : idRuta, "El identificador del docente es obligatorio");
        String nombre = texto(d.nombre(), "El nombre del docente es obligatorio");
        verificarExistencia("docente", "id_docente", id, nuevo, "El docente " + id);
        List<Disponible> disp = validarDisponibilidad(d.disponibilidad());
        repo.borrarEjecuciones();
        repo.guardarDocente(new RepositorioCatalogos.Docente(id, nombre, vacioANulo(d.dedicacion()),
                vacioANulo(d.escalafon()), disp), nuevo);
        return buscar(docentes(), x -> x.id().equals(id));
    }

    @Transactional
    public void borrarDocente(String id) {
        verificarExistencia("docente", "id_docente", id, false, "El docente " + id);
        repo.borrarEjecuciones();
        repo.borrarDocente(id);
    }

    /** Valida cada franja contra la grilla vigente. Una franja que no existe se rechaza con RD-03. */
    public List<Disponible> validarDisponibilidad(List<FranjaDisponible> lista) {
        List<FranjaHoraria> franjas = parametros.cargar().generarFranjasValidas();
        List<Disponible> salida = new ArrayList<>();
        LinkedHashSet<String> vistos = new LinkedHashSet<>();
        for (FranjaDisponible f : lista == null ? List.<FranjaDisponible>of() : lista) {
            DiaSemana dia;
            LocalTime hora;
            try {
                dia = DiaSemana.desdeTexto(f.dia());
                hora = LocalTime.parse(f.horaInicio());
            } catch (RuntimeException e) {
                throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "FORMATO",
                        "La franja " + f.dia() + " " + f.horaInicio() + " no tiene el formato DIA y HH:MM");
            }
            boolean valida = franjas.stream().anyMatch(x -> x.getDia() == dia && x.getHoraInicio().equals(hora));
            if (!valida) {
                throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "RD-03", "La franja " + dia.name() + " " + hora
                        + " no pertenece a las " + franjas.size() + " franjas válidas");
            }
            if (vistos.add(dia.name() + hora)) salida.add(new Disponible(dia.name(), hora));
        }
        return salida;
    }

    // ---------------- Aulas ----------------

    public List<AulaGestion> aulas() {
        return repo.aulas().stream().map(a -> new AulaGestion(a.id(), a.capacidad(), a.caracteristicas())).toList();
    }

    @Transactional
    public AulaGestion guardarAula(AulaGestion a, String idRuta) {
        boolean nueva = idRuta == null;
        String id = texto(nueva ? a.id() : idRuta, "El identificador del aula es obligatorio");
        if (a.capacidad() == null || a.capacidad() <= 0) {
            throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "FORMATO", "La capacidad del aula debe ser mayor que cero");
        }
        verificarExistencia("aula", "id_aula", id, nueva, "El aula " + id);
        List<String> carac = caracteristicas(a.caracteristicas());
        repo.borrarEjecuciones();
        repo.guardarAula(new RepositorioCatalogos.Aula(id, a.capacidad(), carac), nueva);
        return buscar(aulas(), x -> x.id().equals(id));
    }

    @Transactional
    public void borrarAula(String id) {
        verificarExistencia("aula", "id_aula", id, false, "El aula " + id);
        repo.borrarEjecuciones();
        repo.borrarAula(id);
    }

    // ---------------- Materias ----------------

    public List<MateriaGestion> materias() {
        return repo.materias().stream().map(m -> new MateriaGestion(m.id(), m.nombre(), m.numSesiones(),
                m.requisitos(), m.habilitados())).toList();
    }

    @Transactional
    public MateriaGestion guardarMateria(MateriaGestion m, String idRuta) {
        boolean nueva = idRuta == null;
        String id = texto(nueva ? m.id() : idRuta, "El identificador de la materia es obligatorio");
        String nombre = texto(m.nombre(), "El nombre de la materia es obligatorio");
        ConfiguracionParametros cfg = parametros.cargar();
        if (m.numSesiones() == null || m.numSesiones() < 1 || m.numSesiones() > cfg.getMaxSesiones()) {
            throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "RD-07",
                    "La materia debe tener entre 1 y " + cfg.getMaxSesiones() + " sesiones semanales");
        }
        verificarExistencia("curso", "id_curso", id, nueva, "La materia " + id);
        List<String> req = caracteristicas(m.requisitos());
        List<String> hab = new ArrayList<>(new LinkedHashSet<>(m.docentesHabilitados() == null ? List.of() : m.docentesHabilitados()));
        for (String d : hab) {
            if (!repo.existe("docente", "id_docente", d)) {
                throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "REFERENCIA", "El docente habilitado " + d + " no existe");
            }
        }
        repo.borrarEjecuciones();
        repo.guardarMateria(new RepositorioCatalogos.Materia(id, nombre, m.numSesiones(), req, hab), nueva);
        return buscar(materias(), x -> x.id().equals(id));
    }

    @Transactional
    public void borrarMateria(String id) {
        verificarExistencia("curso", "id_curso", id, false, "La materia " + id);
        repo.borrarEjecuciones();
        repo.borrarMateria(id);
    }

    // ---------------- Grupos ----------------

    public List<GrupoGestion> grupos() {
        return repo.grupos().stream().map(g -> new GrupoGestion(g.id(), g.idCurso(), g.matriculados())).toList();
    }

    @Transactional
    public GrupoGestion guardarGrupo(GrupoGestion g, String idRuta) {
        boolean nuevo = idRuta == null;
        String id = texto(nuevo ? g.id() : idRuta, "El identificador del grupo es obligatorio");
        String curso = texto(g.idCurso(), "La materia del grupo es obligatoria");
        if (!repo.existe("curso", "id_curso", curso)) {
            throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "REFERENCIA", "La materia " + curso + " no existe");
        }
        if (g.matriculados() == null || g.matriculados() < 0) {
            throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "FORMATO", "Los matriculados deben ser un entero no negativo");
        }
        verificarExistencia("grupo", "id_grupo", id, nuevo, "El grupo " + id);
        repo.borrarEjecuciones();
        repo.guardarGrupo(new RepositorioCatalogos.Grupo(id, curso, g.matriculados()), nuevo);
        return buscar(grupos(), x -> x.id().equals(id));
    }

    @Transactional
    public void borrarGrupo(String id) {
        verificarExistencia("grupo", "id_grupo", id, false, "El grupo " + id);
        repo.borrarEjecuciones();
        repo.borrarGrupo(id);
    }

    // ---------------- Comunes ----------------

    private void verificarExistencia(String tabla, String columna, String id, boolean debeSerNuevo, String sujeto) {
        boolean existe = repo.existe(tabla, columna, id);
        if (debeSerNuevo && existe) {
            throw new ExcepcionNegocio(HttpStatus.CONFLICT, "DUPLICADO", sujeto + " ya existe");
        }
        if (!debeSerNuevo && !existe) {
            throw new ExcepcionNegocio(HttpStatus.NOT_FOUND, "NO_ENCONTRADO", sujeto + " no existe");
        }
    }

    private static List<String> caracteristicas(List<String> lista) {
        LinkedHashSet<String> salida = new LinkedHashSet<>();
        for (String c : lista == null ? List.<String>of() : lista) {
            try {
                salida.add(CaracteristicaAula.valueOf(c.trim().toUpperCase(Locale.ROOT)).name());
            } catch (RuntimeException e) {
                throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "FORMATO",
                        "La característica " + c + " no existe. Use COMPUTADORES o SILLAS_MOVILES");
            }
        }
        return new ArrayList<>(salida);
    }

    private static String texto(String valor, String mensaje) {
        if (valor == null || valor.isBlank()) throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "FORMATO", mensaje);
        if (valor.trim().length() > 80) throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "FORMATO", "El texto " + valor + " es demasiado largo");
        return valor.trim();
    }

    private static String vacioANulo(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static <T> T buscar(List<T> lista, java.util.function.Predicate<T> filtro) {
        return lista.stream().filter(filtro).findFirst().orElseThrow();
    }
}
