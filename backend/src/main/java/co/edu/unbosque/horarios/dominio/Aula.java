package co.edu.unbosque.horarios.dominio;

import java.util.EnumSet;
import java.util.Set;

/** Aula como recurso escaso con capacidad y características (RD-05, RD-06). */
public final class Aula {
    private final String id;
    private final int capacidad;
    private final Set<CaracteristicaAula> caracteristicas;

    public Aula(String id, int capacidad, Set<CaracteristicaAula> caracteristicas) {
        this.id = id;
        this.capacidad = capacidad;
        this.caracteristicas = caracteristicas.isEmpty()
                ? EnumSet.noneOf(CaracteristicaAula.class) : EnumSet.copyOf(caracteristicas);
    }

    public String getId() { return id; }
    public int getCapacidad() { return capacidad; }
    public boolean cumpleRequisitos(Set<CaracteristicaAula> requisitos) { return caracteristicas.containsAll(requisitos); }
    public Set<CaracteristicaAula> getCaracteristicas() { return caracteristicas; }
}
