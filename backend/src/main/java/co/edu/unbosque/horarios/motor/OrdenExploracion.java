package co.edu.unbosque.horarios.motor;

/** Orden en que el motor toma las sesiones. */
public enum OrdenExploracion {
    /** Las sesiones en el orden en que llegan del archivo. */
    INGENUO,
    /** Primero la sesión con menos tuplas posibles (most-constrained-first). */
    MAS_RESTRINGIDA_PRIMERO
}
