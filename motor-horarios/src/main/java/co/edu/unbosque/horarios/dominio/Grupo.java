package co.edu.unbosque.horarios.dominio;

/** Grupo (sección) de un curso con su número de matriculados (S-07). */
public final class Grupo {
    private final String id;
    private final Curso curso;
    private final int matriculados;

    public Grupo(String id, Curso curso, int matriculados) {
        this.id = id;
        this.curso = curso;
        this.matriculados = matriculados;
    }

    public String getId() { return id; }
    public Curso getCurso() { return curso; }
    public int getMatriculados() { return matriculados; }
}
