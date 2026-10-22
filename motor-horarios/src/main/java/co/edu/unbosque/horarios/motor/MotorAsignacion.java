package co.edu.unbosque.horarios.motor;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.Asignacion;
import co.edu.unbosque.horarios.dominio.Aula;
import co.edu.unbosque.horarios.dominio.Docente;
import co.edu.unbosque.horarios.dominio.FranjaHoraria;
import co.edu.unbosque.horarios.dominio.Sesion;
import co.edu.unbosque.horarios.restricciones.RestriccionDura;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Contexto del patrón Strategy. Ejecuta el backtracking y delega cada
 * verificación en la lista de RestriccionDura que recibe por constructor.
 * Agregar una restricción nueva no exige modificar esta clase (OCP, RNF-03).
 */
public final class MotorAsignacion {
    private static final Set<String> CODIGOS_DE_CHOQUE = Set.of("RD-01", "RD-02");

    private final List<RestriccionDura> restricciones;
    private final List<RestriccionDura> locales;
    private final ConfiguracionParametros config;
    private final long limiteMs;

    private long nodos;
    private long inicio;
    private boolean agotoTiempo;
    private int mejorProfundidad;
    private List<Asignacion> mejorParcial;

    public MotorAsignacion(List<RestriccionDura> restricciones, ConfiguracionParametros config, long limiteMs) {
        List<RestriccionDura> ordenadas = new ArrayList<>(restricciones);
        ordenadas.sort(Comparator.comparing(r -> r.esLocal() ? 0 : 1)); // primero las baratas
        this.restricciones = List.copyOf(ordenadas);
        this.locales = ordenadas.stream().filter(RestriccionDura::esLocal).toList();
        this.config = config;
        this.limiteMs = limiteMs;
    }

    public ResultadoAsignacion generarHorario(List<Sesion> sesiones, List<Docente> docentes, List<Aula> aulas,
                                              List<FranjaHoraria> franjas, OrdenExploracion orden,
                                              boolean estadoIndexado) {
        inicio = System.nanoTime();
        nodos = 0;
        agotoTiempo = false;
        mejorProfundidad = -1;
        mejorParcial = List.of();
        EstadoHorario estado = new EstadoHorario(franjas.size(), estadoIndexado);

        long evaluaciones = 0;
        List<Sesion> ordenadas = new ArrayList<>(sesiones);
        long t0 = System.nanoTime();
        if (orden == OrdenExploracion.MAS_RESTRINGIDA_PRIMERO) {
            Map<Sesion, Integer> dominio = new HashMap<>();
            for (Sesion s : ordenadas) {
                int cuenta = 0;
                for (FranjaHoraria f : franjas) {
                    for (Aula a : aulas) {
                        for (Docente d : docentes) {
                            evaluaciones++;
                            if (cumpleLocales(new Asignacion(s, d, a, f))) cuenta++;
                        }
                    }
                }
                dominio.put(s, cuenta);
            }
            ordenadas.sort(Comparator.comparingInt(dominio::get));
        }
        long msPreconteo = (System.nanoTime() - t0) / 1_000_000;

        boolean completo = backtrack(0, ordenadas, docentes, aulas, franjas, estado);
        List<ReporteConflicto> conflictos = new ArrayList<>();
        EstadoHorario resultado = estado;
        if (!completo) {
            resultado = new EstadoHorario(franjas.size(), true);
            for (Asignacion a : mejorParcial) resultado.agregarAsignacion(a);
            for (Sesion s : ordenadas) {
                if (estaAsignada(resultado, s)) continue;
                Asignacion directa = buscarTuplaValida(s, docentes, aulas, franjas, resultado);
                if (directa != null) {
                    resultado.agregarAsignacion(directa);
                } else {
                    conflictos.add(diagnosticar(s, docentes, aulas, franjas, resultado));
                }
            }
        }
        long msTotal = (System.nanoTime() - inicio) / 1_000_000;
        return new ResultadoAsignacion(completo, agotoTiempo, resultado, conflictos, nodos,
                evaluaciones, msPreconteo, msTotal);
    }

    private boolean backtrack(int idx, List<Sesion> sesiones, List<Docente> docentes, List<Aula> aulas,
                              List<FranjaHoraria> franjas, EstadoHorario estado) {
        if (idx > mejorProfundidad) {
            mejorProfundidad = idx;
            mejorParcial = new ArrayList<>(estado.getAsignaciones());
        }
        if (idx == sesiones.size()) return true; // RD-08 cumplida
        if ((System.nanoTime() - inicio) / 1_000_000 > limiteMs) {
            agotoTiempo = true;
            return false;
        }
        Sesion actual = sesiones.get(idx);
        for (FranjaHoraria f : franjas) {
            for (Aula a : aulas) {
                for (Docente d : docentes) {
                    nodos++;
                    Asignacion candidata = new Asignacion(actual, d, a, f);
                    if (cumpleTodas(candidata, estado)) {
                        estado.agregarAsignacion(candidata);
                        if (backtrack(idx + 1, sesiones, docentes, aulas, franjas, estado)) return true;
                        estado.removerUltimaAsignacion();
                        if (agotoTiempo) return false;
                    }
                }
            }
        }
        return false; // se agotaron aulas, docentes y franjas para esta sesión
    }

    private boolean cumpleTodas(Asignacion candidata, EstadoHorario estado) {
        for (RestriccionDura r : restricciones) {
            if (!r.esValida(candidata, estado, config)) {
                estado.registrarRechazo(candidata.getSesion(), r.getCodigo());
                return false;
            }
        }
        return true;
    }

    private boolean cumpleLocales(Asignacion candidata) {
        for (RestriccionDura r : locales) {
            if (!r.esValida(candidata, null, config)) return false;
        }
        return true;
    }

    private static boolean estaAsignada(EstadoHorario estado, Sesion s) {
        for (Asignacion a : estado.getAsignaciones()) if (a.getSesion() == s) return true;
        return false;
    }

    private Asignacion buscarTuplaValida(Sesion s, List<Docente> docentes, List<Aula> aulas,
                                         List<FranjaHoraria> franjas, EstadoHorario estado) {
        for (FranjaHoraria f : franjas)
            for (Aula a : aulas)
                for (Docente d : docentes) {
                    Asignacion c = new Asignacion(s, d, a, f);
                    if (cumpleTodas(c, estado)) return c;
                }
        return null;
    }

    /** Evalúa todas las reglas sin cortar en la primera para explicar el bloqueo completo. */
    private ReporteConflicto diagnosticar(Sesion s, List<Docente> docentes, List<Aula> aulas,
                                          List<FranjaHoraria> franjas, EstadoHorario estado) {
        Map<String, Integer> porCodigo = new LinkedHashMap<>();
        List<String> porLiberacion = new ArrayList<>();
        for (FranjaHoraria f : franjas)
            for (Aula a : aulas)
                for (Docente d : docentes) {
                    Asignacion c = new Asignacion(s, d, a, f);
                    List<String> fallas = new ArrayList<>();
                    for (RestriccionDura r : restricciones)
                        if (!r.esValida(c, estado, config)) fallas.add(r.getCodigo());
                    for (String codigo : fallas) porCodigo.merge(codigo, 1, Integer::sum);
                    if (!fallas.isEmpty() && CODIGOS_DE_CHOQUE.containsAll(fallas) && porLiberacion.size() < 3) {
                        porLiberacion.add(f + " | " + a.getId() + " | " + d.getNombre() + " (liberar " + fallas + ")");
                    }
                }
        return new ReporteConflicto(s.getGrupo().getCurso().getId(), s.getGrupo().getId(), s.getId(),
                porCodigo, porLiberacion);
    }
}
