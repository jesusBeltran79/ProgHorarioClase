package co.edu.unbosque.horarios.dominio;

/** Unidad que el motor debe ubicar en una tupla (docente, aula, franja) (RD-07, RD-08). */
public final class Sesion {
    private final String id;
    private final Grupo grupo;
    private final int numeroSesion;

    public Sesion(String id, Grupo grupo, int numeroSesion) {
        this.id = id;
        this.grupo = grupo;
        this.numeroSesion = numeroSesion;
    }

    public String getId() { return id; }
    public Grupo getGrupo() { return grupo; }
    public int getNumeroSesion() { return numeroSesion; }
}
