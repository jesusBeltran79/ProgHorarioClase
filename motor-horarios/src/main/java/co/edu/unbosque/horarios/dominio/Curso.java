package co.edu.unbosque.horarios.dominio;

import java.util.EnumSet;
import java.util.HashSet;
import java.util.Set;

/** Curso del plan de estudios con sus requisitos de aula y docentes habilitados (S-06). */
public final class Curso {
    private final String id;
    private final String nombre;
    private final int numSesionesSemanales;
    private final Set<CaracteristicaAula> requisitosAula;
    private final Set<String> docentesHabilitados;

    public Curso(String id, String nombre, int numSesionesSemanales,
                 Set<CaracteristicaAula> requisitosAula, Set<String> docentesHabilitados) {
        this.id = id;
        this.nombre = nombre;
        this.numSesionesSemanales = numSesionesSemanales;
        this.requisitosAula = requisitosAula.isEmpty()
                ? EnumSet.noneOf(CaracteristicaAula.class) : EnumSet.copyOf(requisitosAula);
        this.docentesHabilitados = new HashSet<>(docentesHabilitados);
    }

    public String getId() { return id; }
    public String getNombre() { return nombre; }
    public int getNumSesionesSemanales() { return numSesionesSemanales; }
    public Set<CaracteristicaAula> getRequisitosAula() { return requisitosAula; }
    public boolean requiereCaracteristica(CaracteristicaAula c) { return requisitosAula.contains(c); }
    /** Conjunto vacío significa que todo docente está habilitado (S-06). */
    public boolean habilitaA(String idDocente) {
        return docentesHabilitados.isEmpty() || docentesHabilitados.contains(idDocente);
    }
}
