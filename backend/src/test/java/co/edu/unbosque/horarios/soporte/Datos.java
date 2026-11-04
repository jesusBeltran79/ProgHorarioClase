package co.edu.unbosque.horarios.soporte;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.datos.ConjuntoDatos;
import co.edu.unbosque.horarios.persistencia.CargadorInventariosCSV;
import co.edu.unbosque.horarios.persistencia.ConstructorDominio;
import co.edu.unbosque.horarios.persistencia.InventarioCargado;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;

/** Acceso a los conjuntos de datos de la carpeta datos/ del repositorio. */
public final class Datos {

    public static final Path RAIZ = Path.of("..", "datos");

    private Datos() { }

    public static Path carpeta(String nombre) {
        return RAIZ.resolve(nombre);
    }

    public static InventarioCargado inventario(String nombre, ConfiguracionParametros cfg) throws IOException {
        Path c = carpeta(nombre);
        try (InputStream d = new FileInputStream(c.resolve("docentes.csv").toFile());
             InputStream a = new FileInputStream(c.resolve("aulas.csv").toFile());
             InputStream cu = new FileInputStream(c.resolve("cursos.csv").toFile());
             InputStream g = new FileInputStream(c.resolve("grupos.csv").toFile())) {
            return new CargadorInventariosCSV(cfg).cargar(d, a, cu, g);
        }
    }

    public static ConjuntoDatos dominio(String nombre, ConfiguracionParametros cfg) throws IOException {
        return ConstructorDominio.construir(inventario(nombre, cfg), cfg.generarFranjasValidas());
    }
}
