package co.edu.unbosque.horarios.soporte;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/** Escribe líneas de evidencia en target/evidencias para el Informe de Calidad y Pruebas. */
public final class Evidencia {

    public static final Path CARPETA = Path.of("target", "evidencias");
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private Evidencia() { }

    public static synchronized void registrar(String archivo, String linea) {
        try {
            Path p = CARPETA.resolve(archivo);
            Files.createDirectories(p.getParent());
            Files.writeString(p, "[" + LocalDateTime.now().format(HORA) + "] " + linea + System.lineSeparator(),
                    StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    public static void ruptura(String linea) {
        registrar("qa/ruptura.log", linea);
    }
}
