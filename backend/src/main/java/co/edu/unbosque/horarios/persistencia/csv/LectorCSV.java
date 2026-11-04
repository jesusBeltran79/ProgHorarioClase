package co.edu.unbosque.horarios.persistencia.csv;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Lector CSV mínimo según RFC 4180. Soporta campos entre comillas y comillas dobles escapadas.
 * Devuelve las filas sin el encabezado, cada una con su número de línea en el archivo.
 */
public final class LectorCSV {

    public record Fila(int numero, List<String> campos) {
        public String campo(int i) { return i < campos.size() ? campos.get(i).trim() : ""; }
    }

    public record Archivo(List<String> encabezado, List<Fila> filas) { }

    private LectorCSV() { }

    public static Archivo leer(InputStream entrada) throws IOException {
        List<Fila> filas = new ArrayList<>();
        List<String> encabezado = null;
        try (BufferedReader lector = new BufferedReader(new InputStreamReader(entrada, StandardCharsets.UTF_8))) {
            String linea;
            int numero = 0;
            while ((linea = lector.readLine()) != null) {
                numero++;
                if (numero == 1 && !linea.isEmpty() && linea.charAt(0) == '﻿') linea = linea.substring(1);
                if (linea.isBlank()) continue;
                List<String> campos = separar(linea);
                if (encabezado == null) {
                    encabezado = campos.stream().map(c -> c.trim().toLowerCase()).toList();
                } else {
                    filas.add(new Fila(numero, campos));
                }
            }
        }
        return new Archivo(encabezado == null ? List.of() : encabezado, filas);
    }

    static List<String> separar(String linea) {
        List<String> campos = new ArrayList<>();
        StringBuilder actual = new StringBuilder();
        boolean entreComillas = false;
        for (int i = 0; i < linea.length(); i++) {
            char c = linea.charAt(i);
            if (entreComillas) {
                if (c == '"' && i + 1 < linea.length() && linea.charAt(i + 1) == '"') {
                    actual.append('"');
                    i++;
                } else if (c == '"') {
                    entreComillas = false;
                } else {
                    actual.append(c);
                }
            } else if (c == '"') {
                entreComillas = true;
            } else if (c == ',') {
                campos.add(actual.toString());
                actual.setLength(0);
            } else {
                actual.append(c);
            }
        }
        campos.add(actual.toString());
        return campos;
    }

    /** Escapa un valor para escribirlo en CSV. */
    public static String escapar(String valor) {
        if (valor == null) return "";
        if (valor.contains(",") || valor.contains("\"") || valor.contains("\n")) {
            return "\"" + valor.replace("\"", "\"\"") + "\"";
        }
        return valor;
    }
}
