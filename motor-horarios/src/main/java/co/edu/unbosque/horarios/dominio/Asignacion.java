package co.edu.unbosque.horarios.dominio;

/** Tupla candidata o confirmada (sesión, docente, aula, franja). */
public final class Asignacion {
    private final Sesion sesion;
    private final Docente docente;
    private final Aula aula;
    private final FranjaHoraria franja;

    public Asignacion(Sesion sesion, Docente docente, Aula aula, FranjaHoraria franja) {
        this.sesion = sesion;
        this.docente = docente;
        this.aula = aula;
        this.franja = franja;
    }

    public Sesion getSesion() { return sesion; }
    public Docente getDocente() { return docente; }
    public Aula getAula() { return aula; }
    public FranjaHoraria getFranja() { return franja; }
}
