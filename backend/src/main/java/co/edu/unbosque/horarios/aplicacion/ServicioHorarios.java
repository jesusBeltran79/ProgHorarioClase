package co.edu.unbosque.horarios.aplicacion;

import co.edu.unbosque.horarios.aplicacion.ConfiguracionMotor.CatalogoRestricciones;
import co.edu.unbosque.horarios.aplicacion.dto.Dto;
import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.datos.ConjuntoDatos;
import co.edu.unbosque.horarios.dominio.Asignacion;
import co.edu.unbosque.horarios.dominio.Aula;
import co.edu.unbosque.horarios.dominio.Docente;
import co.edu.unbosque.horarios.dominio.FranjaHoraria;
import co.edu.unbosque.horarios.dominio.Sesion;
import co.edu.unbosque.horarios.motor.EstadoHorario;
import co.edu.unbosque.horarios.motor.MotorAsignacion;
import co.edu.unbosque.horarios.motor.OrdenExploracion;
import co.edu.unbosque.horarios.motor.OrdenFranjas;
import co.edu.unbosque.horarios.motor.ResultadoAsignacion;
import co.edu.unbosque.horarios.persistencia.ConstructorDominio;
import co.edu.unbosque.horarios.persistencia.ExportadorHorarioCSV;
import co.edu.unbosque.horarios.persistencia.RepositorioEjecuciones;
import co.edu.unbosque.horarios.persistencia.RepositorioEjecuciones.FilaAsignacion;
import co.edu.unbosque.horarios.persistencia.RepositorioEjecuciones.FilaConflicto;
import co.edu.unbosque.horarios.persistencia.RepositorioInventarios;
import co.edu.unbosque.horarios.persistencia.RepositorioParametros;
import co.edu.unbosque.horarios.persistencia.RepositorioUsuarios;
import co.edu.unbosque.horarios.restricciones.RestriccionDura;
import co.edu.unbosque.horarios.validacion.ReporteValidacion;
import co.edu.unbosque.horarios.validacion.ValidadorEntrada;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Orquesta la generación, consulta, reubicación y exportación de horarios (RF-06, RF-07, RF-09).
 * El motor y las restricciones son las mismas clases del núcleo. Este servicio solo arma el
 * contexto desde la base de datos y guarda el resultado.
 */
@Service
public class ServicioHorarios {

    private static final Set<String> CODIGOS_DE_CHOQUE = Set.of("RD-01", "RD-02");
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final RepositorioInventarios inventarios;
    private final RepositorioParametros parametros;
    private final RepositorioEjecuciones ejecuciones;
    private final RepositorioUsuarios usuarios;
    private final List<RestriccionDura> restricciones;
    private final ValidadorEntrada validador;
    private final long limiteMs;

    public ServicioHorarios(RepositorioInventarios inventarios, RepositorioParametros parametros,
                            RepositorioEjecuciones ejecuciones, RepositorioUsuarios usuarios,
                            CatalogoRestricciones catalogo, ValidadorEntrada validador,
                            @Value("${app.motor.limite-ms:60000}") long limiteMs) {
        this.inventarios = inventarios;
        this.parametros = parametros;
        this.ejecuciones = ejecuciones;
        this.usuarios = usuarios;
        this.restricciones = catalogo.duras();
        this.validador = validador;
        this.limiteMs = limiteMs;
    }

    /** Datos del problema reconstruidos desde la base de datos con la grilla vigente. */
    private record Contexto(ConfiguracionParametros cfg, List<FranjaHoraria> franjas, ConjuntoDatos datos,
                            Map<String, Sesion> sesiones, Map<String, Docente> docentes, Map<String, Aula> aulas,
                            Map<String, FranjaHoraria> franjaPorClave, Map<Integer, FranjaHoraria> franjaPorId) { }

    private Contexto contexto() {
        ConfiguracionParametros cfg = parametros.cargar();
        List<FranjaHoraria> franjas = cfg.generarFranjasValidas();
        ConjuntoDatos datos = ConstructorDominio.construir(inventarios.cargar(), franjas);
        Map<String, Sesion> sesiones = new HashMap<>();
        datos.sesiones().forEach(s -> sesiones.put(s.getId(), s));
        Map<String, Docente> docentes = new HashMap<>();
        datos.docentes().forEach(d -> docentes.put(d.getId(), d));
        Map<String, Aula> aulas = new HashMap<>();
        datos.aulas().forEach(a -> aulas.put(a.getId(), a));
        Map<String, FranjaHoraria> porClave = new HashMap<>();
        Map<Integer, FranjaHoraria> porId = new HashMap<>();
        for (FranjaHoraria f : franjas) {
            porClave.put(f.getDia().name() + "|" + f.getHoraInicio(), f);
            porId.put(f.getIndice(), f);
        }
        return new Contexto(cfg, franjas, datos, sesiones, docentes, aulas, porClave, porId);
    }

    @Transactional
    public Dto.Resultado generar(String nombreUsuario) {
        Contexto ctx = contexto();
        if (ctx.datos().sesiones().isEmpty()) {
            throw new ExcepcionNegocio(HttpStatus.CONFLICT, "SIN_DATOS",
                    "No hay sesiones para asignar. Cargue primero los inventarios");
        }
        List<ReporteValidacion> hallazgos = validador.validarGrupos(ctx.datos().grupos(), ctx.cfg());
        MotorAsignacion motor = new MotorAsignacion(restricciones, ctx.cfg(), limiteMs);
        ResultadoAsignacion r = motor.generarHorario(ctx.datos().sesiones(), ctx.datos().docentes(), ctx.datos().aulas(),
                OrdenFranjas.intercalarDias(ctx.franjas()), OrdenExploracion.MAS_RESTRINGIDA_PRIMERO, true);
        int idUsuario = usuarios.buscar(nombreUsuario).map(RepositorioUsuarios.Usuario::id)
                .orElseThrow(() -> new ExcepcionNegocio(HttpStatus.UNAUTHORIZED, "USUARIO_DESCONOCIDO", "El usuario no existe"));
        int id = ejecuciones.guardar(idUsuario, r.completo(), r.nodosExplorados(), r.msTotal(),
                r.estado().getAsignaciones(), r.conflictos(), hallazgos);
        return armarResultado(id, ctx);
    }

    public List<Dto.Ejecucion> listar() {
        return ejecuciones.listar().stream().map(e -> new Dto.Ejecucion(e.id(), e.usuario(), e.fechaHora().format(FECHA),
                e.estado(), e.nodosExplorados(), e.duracionMs(), e.publicado())).toList();
    }

    public Dto.Resultado obtener(int id) {
        return armarResultado(id, contexto());
    }

    /** RF-12. Publica un horario COMPLETO para que lo vean los docentes. Solo queda uno publicado. */
    @Transactional
    public Dto.Resultado publicar(int id) {
        RepositorioEjecuciones.Ejecucion e = buscarEjecucion(id);
        if (!"COMPLETO".equals(e.estado())) {
            throw new ExcepcionNegocio(HttpStatus.CONFLICT, "HORARIO_PARCIAL",
                    "Solo se puede publicar un horario COMPLETO. Resuelva primero las sesiones pendientes");
        }
        ejecuciones.publicar(id);
        return armarResultado(id, contexto());
    }

    /** El horario publicado vigente, si existe. Lo usa el portal del docente. */
    public java.util.Optional<Dto.Resultado> publicado() {
        return ejecuciones.idPublicada().map(id -> armarResultado(id, contexto()));
    }

    public List<Dto.Alternativa> alternativas(int id, String idSesion) {
        buscarEjecucion(id);
        Contexto ctx = contexto();
        Sesion sesion = buscarSesion(ctx, idSesion);
        EstadoHorario estado = estadoSin(ctx, ejecuciones.asignaciones(id), idSesion);
        return calcularAlternativas(ctx, sesion, estado, 12, 6);
    }

    @Transactional
    public Dto.Resultado reubicar(int id, Dto.Reubicacion req) {
        buscarEjecucion(id);
        Contexto ctx = contexto();
        Sesion sesion = buscarSesion(ctx, req.idSesion());
        Docente docente = ctx.docentes().get(req.idDocente());
        Aula aula = ctx.aulas().get(req.idAula());
        FranjaHoraria franja = ctx.franjaPorId().get(req.idFranja());
        List<String> faltantes = new ArrayList<>();
        if (docente == null) faltantes.add("El docente " + req.idDocente() + " no existe");
        if (aula == null) faltantes.add("El aula " + req.idAula() + " no existe");
        if (franja == null) faltantes.add("La franja " + req.idFranja() + " no pertenece a las franjas válidas (RD-03)");
        if (!faltantes.isEmpty()) {
            throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "REUBICACION_INVALIDA", "La reubicación no es válida", faltantes);
        }
        EstadoHorario estado = estadoSin(ctx, ejecuciones.asignaciones(id), req.idSesion());
        Asignacion candidata = new Asignacion(sesion, docente, aula, franja);
        List<String> violadas = violaciones(candidata, estado, ctx.cfg());
        if (!violadas.isEmpty()) {
            Map<String, String> desc = ejecuciones.descripcionesRestricciones();
            List<String> detalles = violadas.stream().map(c -> c + " " + desc.getOrDefault(c, "")).toList();
            throw new ExcepcionNegocio(HttpStatus.CONFLICT, "RESTRICCION_VIOLADA",
                    "El sistema bloqueó la reubicación porque viola " + String.join(", ", violadas), detalles);
        }
        ejecuciones.reubicar(id, sesion.getId(), docente.getId(), aula.getId(), franja.getDia().name(),
                franja.getHoraInicio(), franja.getHoraFin());
        boolean completo = ejecuciones.asignaciones(id).size() == ctx.datos().sesiones().size();
        ejecuciones.actualizarEstado(id, completo);
        return armarResultado(id, ctx);
    }

    public String exportar(int id) {
        RepositorioEjecuciones.Ejecucion e = buscarEjecucion(id);
        if (!"COMPLETO".equals(e.estado())) {
            throw new ExcepcionNegocio(HttpStatus.CONFLICT, "HORARIO_PARCIAL",
                    "El horario tiene sesiones sin asignar y no cumple RD-08. Resuelva los conflictos antes de exportar");
        }
        Contexto ctx = contexto();
        EstadoHorario estado = estadoSin(ctx, ejecuciones.asignaciones(id), null);
        return new ExportadorHorarioCSV().exportar(estado.getAsignaciones());
    }

    // ----------------------------------------------------------------------------------------

    private RepositorioEjecuciones.Ejecucion buscarEjecucion(int id) {
        return ejecuciones.buscar(id).orElseThrow(() ->
                new ExcepcionNegocio(HttpStatus.NOT_FOUND, "EJECUCION_NO_ENCONTRADA", "No existe la ejecución " + id));
    }

    private static Sesion buscarSesion(Contexto ctx, String idSesion) {
        Sesion s = ctx.sesiones().get(idSesion);
        if (s == null) {
            throw new ExcepcionNegocio(HttpStatus.NOT_FOUND, "SESION_NO_ENCONTRADA", "No existe la sesión " + idSesion);
        }
        return s;
    }

    /** Arma el horario guardado como estado del motor, dejando por fuera una sesión si se indica. */
    private static EstadoHorario estadoSin(Contexto ctx, List<FilaAsignacion> filas, String excluir) {
        EstadoHorario estado = new EstadoHorario(ctx.franjas().size(), true);
        for (FilaAsignacion f : filas) {
            if (f.idSesion().equals(excluir)) continue;
            FranjaHoraria franja = ctx.franjaPorClave().get(f.dia() + "|" + f.horaInicio());
            Sesion s = ctx.sesiones().get(f.idSesion());
            Docente d = ctx.docentes().get(f.idDocente());
            Aula a = ctx.aulas().get(f.idAula());
            if (franja == null || s == null || d == null || a == null) {
                throw new ExcepcionNegocio(HttpStatus.CONFLICT, "GRILLA_CAMBIADA",
                        "La grilla de franjas cambió después de esta ejecución. Genere un horario nuevo");
            }
            estado.agregarAsignacion(new Asignacion(s, d, a, franja));
        }
        return estado;
    }

    private List<String> violaciones(Asignacion candidata, EstadoHorario estado, ConfiguracionParametros cfg) {
        List<String> codigos = new ArrayList<>();
        for (RestriccionDura r : restricciones) {
            if (!r.esValida(candidata, estado, cfg)) codigos.add(r.getCodigo());
        }
        return codigos;
    }

    private List<Dto.Alternativa> calcularAlternativas(Contexto ctx, Sesion sesion, EstadoHorario estado,
                                                       int maxValidas, int maxLiberando) {
        List<Dto.Alternativa> validas = new ArrayList<>();
        List<Dto.Alternativa> liberando = new ArrayList<>();
        for (FranjaHoraria f : OrdenFranjas.intercalarDias(ctx.franjas())) {
            for (Aula a : ctx.datos().aulas()) {
                for (Docente d : ctx.datos().docentes()) {
                    if (validas.size() >= maxValidas && liberando.size() >= maxLiberando) break;
                    Asignacion c = new Asignacion(sesion, d, a, f);
                    List<String> v = violaciones(c, estado, ctx.cfg());
                    if (v.isEmpty() && validas.size() < maxValidas) {
                        validas.add(alternativa(c, List.of()));
                    } else if (!v.isEmpty() && CODIGOS_DE_CHOQUE.containsAll(v) && liberando.size() < maxLiberando) {
                        liberando.add(alternativa(c, v));
                    }
                }
            }
        }
        List<Dto.Alternativa> todas = new ArrayList<>(validas);
        todas.addAll(liberando);
        return todas;
    }

    private static Dto.Alternativa alternativa(Asignacion c, List<String> liberar) {
        FranjaHoraria f = c.getFranja();
        return new Dto.Alternativa(f.getIndice(), f.getDia().name(), f.getHoraInicio().toString(), f.getHoraFin().toString(),
                c.getAula().getId(), c.getAula().getCapacidad(), c.getDocente().getId(), c.getDocente().getNombre(), liberar);
    }

    private Dto.Resultado armarResultado(int id, Contexto ctx) {
        RepositorioEjecuciones.Ejecucion e = buscarEjecucion(id);
        List<FilaAsignacion> filas = ejecuciones.asignaciones(id);
        EstadoHorario estado = estadoSin(ctx, filas, null);
        List<Dto.AsignacionDto> asignaciones = new ArrayList<>();
        for (Asignacion a : estado.getAsignaciones()) {
            Sesion s = a.getSesion();
            FranjaHoraria f = a.getFranja();
            asignaciones.add(new Dto.AsignacionDto(s.getId(), s.getGrupo().getCurso().getId(), s.getGrupo().getCurso().getNombre(),
                    s.getGrupo().getId(), s.getNumeroSesion(), s.getGrupo().getMatriculados(), a.getDocente().getId(),
                    a.getDocente().getNombre(), a.getAula().getId(), a.getAula().getCapacidad(), f.getIndice(),
                    f.getDia().name(), f.getHoraInicio().toString(), f.getHoraFin().toString()));
        }
        Map<String, String> desc = ejecuciones.descripcionesRestricciones();
        List<Dto.Conflicto> conflictos = new ArrayList<>();
        for (FilaConflicto fc : ejecuciones.conflictos(id)) {
            Sesion s = ctx.sesiones().get(fc.idSesion());
            if (s == null) continue;
            List<Dto.Causa> causas = fc.tuplasPorCodigo().entrySet().stream()
                    .map(x -> new Dto.Causa(x.getKey(), x.getValue(), desc.getOrDefault(x.getKey(), ""))).toList();
            conflictos.add(new Dto.Conflicto(s.getId(), s.getGrupo().getCurso().getId(), s.getGrupo().getCurso().getNombre(),
                    s.getGrupo().getId(), s.getGrupo().getMatriculados(), causas, calcularAlternativas(ctx, s, estado, 3, 3)));
        }
        List<Dto.Hallazgo> hallazgos = ejecuciones.hallazgos(id).stream()
                .map(h -> new Dto.Hallazgo(h.codigoRegla(), h.idGrupo(), h.mensaje())).toList();
        Dto.Metricas metricas = new Dto.Metricas(e.nodosExplorados(), e.duracionMs(), ctx.datos().sesiones().size(), filas.size());
        return new Dto.Resultado(e.id(), e.estado(), e.fechaHora().format(FECHA), e.usuario(), metricas,
                asignaciones, conflictos, hallazgos, e.publicado());
    }
}
