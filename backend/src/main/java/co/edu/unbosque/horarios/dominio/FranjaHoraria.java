package co.edu.unbosque.horarios.dominio;

import java.time.LocalTime;

/** Bloque válido de 2 horas dentro de la grilla alineada (S-01, S-02, RD-03). */
public final class FranjaHoraria {
    private final int indice;
    private final DiaSemana dia;
    private final LocalTime horaInicio;
    private final LocalTime horaFin;

    public FranjaHoraria(int indice, DiaSemana dia, LocalTime horaInicio, LocalTime horaFin) {
        this.indice = indice;
        this.dia = dia;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
    }

    public int getIndice() { return indice; }
    public DiaSemana getDia() { return dia; }
    public LocalTime getHoraInicio() { return horaInicio; }
    public LocalTime getHoraFin() { return horaFin; }

    @Override
    public String toString() { return dia + " " + horaInicio + "-" + horaFin; }
}
