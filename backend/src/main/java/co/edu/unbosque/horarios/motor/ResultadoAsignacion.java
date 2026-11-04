package co.edu.unbosque.horarios.motor;

import java.util.List;

/** Lo que el motor devuelve al controlador. */
public record ResultadoAsignacion(boolean completo, boolean agotoTiempo, EstadoHorario estado,
                                  List<ReporteConflicto> conflictos, long nodosExplorados,
                                  long evaluacionesDominioInicial, long msPreconteo, long msTotal) { }
