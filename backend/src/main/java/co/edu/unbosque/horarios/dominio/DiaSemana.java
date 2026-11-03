package co.edu.unbosque.horarios.dominio;

import java.util.Locale;

/** Días de la grilla. El código corto es el que se usa en los archivos CSV. */
public enum DiaSemana {
    LUNES("LUN"), MARTES("MAR"), MIERCOLES("MIE"), JUEVES("JUE"), VIERNES("VIE"), SABADO("SAB");

    private final String codigo;

    DiaSemana(String codigo) { this.codigo = codigo; }

    public String getCodigo() { return codigo; }

    /** Acepta el código corto (MAR) o el nombre completo (MARTES), sin importar mayúsculas. */
    public static DiaSemana desdeTexto(String texto) {
        String t = texto.trim().toUpperCase(Locale.ROOT).replace("É", "E").replace("Á", "A");
        for (DiaSemana d : values()) {
            if (d.codigo.equals(t) || d.name().equals(t)) return d;
        }
        throw new IllegalArgumentException("Día no válido " + texto);
    }
}
