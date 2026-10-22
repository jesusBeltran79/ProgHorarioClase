package co.edu.unbosque.horarios.dominio;

import java.util.BitSet;

/** Docente con su disponibilidad declarada sobre las franjas válidas (RD-04). */
public final class Docente {
    private final String id;
    private final String nombre;
    private final BitSet franjasDisponibles;

    public Docente(String id, String nombre, BitSet franjasDisponibles) {
        this.id = id;
        this.nombre = nombre;
        this.franjasDisponibles = (BitSet) franjasDisponibles.clone();
    }

    public String getId() { return id; }
    public String getNombre() { return nombre; }
    public boolean estaDisponibleEn(int indiceFranja) { return franjasDisponibles.get(indiceFranja); }
    public int cantidadFranjasDisponibles() { return franjasDisponibles.cardinality(); }
}
