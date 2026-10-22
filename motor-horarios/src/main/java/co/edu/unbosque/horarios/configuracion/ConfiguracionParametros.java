package co.edu.unbosque.horarios.configuracion;

import co.edu.unbosque.horarios.dominio.DiaSemana;
import co.edu.unbosque.horarios.dominio.FranjaHoraria;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Parámetros configurables del sistema (RF-08, S-04). Cambiar un valor aquí
 * no exige tocar el motor ni las restricciones.
 */
public final class ConfiguracionParametros {
    private int capMax = 40;
    private double tol = 0.10;
    private int minCierre = 10;
    private int maxSesiones = 4;
    private int durSesionHoras = 2;
    private LocalTime aperturaSemana = LocalTime.of(7, 0);
    private LocalTime cierreSemana = LocalTime.of(22, 0);
    private LocalTime cierreSabado = LocalTime.of(13, 0);
    private LocalTime inicioBloqueo = LocalTime.of(12, 0);
    private LocalTime finBloqueo = LocalTime.of(13, 0);

    public int calcularUmbralMaximoGrupo() {
        return (int) Math.floor(capMax * (1.0 + tol) + 1e-9); // 44 por defecto (RV-01)
    }

    /**
     * Construye el dominio de franjas válidas con la grilla alineada (S-01).
     * Un bloque que cruza el bloqueo o supera el cierre se excluye y no se recorta (S-02).
     */
    public List<FranjaHoraria> generarFranjasValidas() {
        List<FranjaHoraria> franjas = new ArrayList<>();
        int indice = 0;
        for (DiaSemana dia : DiaSemana.values()) {
            LocalTime cierre = dia == DiaSemana.SABADO ? cierreSabado : cierreSemana;
            LocalTime inicio = aperturaSemana;
            while (!inicio.plusHours(durSesionHoras).isAfter(cierre)
                    && inicio.plusHours(durSesionHoras).isAfter(inicio)) {
                LocalTime fin = inicio.plusHours(durSesionHoras);
                boolean cruzaBloqueo = inicio.isBefore(finBloqueo) && fin.isAfter(inicioBloqueo);
                if (!cruzaBloqueo) {
                    franjas.add(new FranjaHoraria(indice++, dia, inicio, fin));
                }
                inicio = fin;
            }
        }
        return franjas;
    }

    public int getCapMax() { return capMax; }
    public double getTol() { return tol; }
    public int getMinCierre() { return minCierre; }
    public int getMaxSesiones() { return maxSesiones; }
    public int getDurSesionHoras() { return durSesionHoras; }
    public void setCapMax(int capMax) { this.capMax = capMax; }
    public void setTol(double tol) { this.tol = tol; }
    public void setMinCierre(int minCierre) { this.minCierre = minCierre; }
    public void setMaxSesiones(int maxSesiones) { this.maxSesiones = maxSesiones; }
    public void setCierreSemana(LocalTime cierreSemana) { this.cierreSemana = cierreSemana; }
}
