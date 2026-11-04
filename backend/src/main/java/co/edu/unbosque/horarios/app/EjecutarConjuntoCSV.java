package co.edu.unbosque.horarios.app;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.datos.ConjuntoDatos;
import co.edu.unbosque.horarios.dominio.FranjaHoraria;
import co.edu.unbosque.horarios.motor.MotorAsignacion;
import co.edu.unbosque.horarios.motor.OrdenExploracion;
import co.edu.unbosque.horarios.motor.OrdenFranjas;
import co.edu.unbosque.horarios.motor.ReporteConflicto;
import co.edu.unbosque.horarios.motor.ResultadoAsignacion;
import co.edu.unbosque.horarios.persistencia.CargadorInventariosCSV;
import co.edu.unbosque.horarios.persistencia.ConstructorDominio;
import co.edu.unbosque.horarios.persistencia.ExportadorHorarioCSV;
import co.edu.unbosque.horarios.persistencia.InventarioCargado;
import co.edu.unbosque.horarios.validacion.ReglaCierreMinimoRV02;
import co.edu.unbosque.horarios.validacion.ReglaTopeMatriculadosRV01;
import co.edu.unbosque.horarios.validacion.ValidadorEntrada;

import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.List;

/**
 * Ejecuta el núcleo completo sobre una carpeta con docentes.csv, aulas.csv, cursos.csv y grupos.csv
 * sin levantar la aplicación web. Sirve para revisar un conjunto de datos desde la consola.
 * Uso: java -cp target/classes co.edu.unbosque.horarios.app.EjecutarConjuntoCSV ../datos/demo
 */
public final class EjecutarConjuntoCSV {
    public static void main(String[] args) throws Exception {
        Path carpeta = Path.of(args.length > 0 ? args[0] : "../datos/demo");
        ConfiguracionParametros cfg = new ConfiguracionParametros();
        InventarioCargado inv;
        try (InputStream d = new FileInputStream(carpeta.resolve("docentes.csv").toFile());
             InputStream a = new FileInputStream(carpeta.resolve("aulas.csv").toFile());
             InputStream c = new FileInputStream(carpeta.resolve("cursos.csv").toFile());
             InputStream g = new FileInputStream(carpeta.resolve("grupos.csv").toFile())) {
            inv = new CargadorInventariosCSV(cfg).cargar(d, a, c, g);
        }
        System.out.println("== Carga (RF-01 a RF-04) ==");
        System.out.printf("docentes %d | aulas %d | cursos %d | grupos %d%n",
                inv.docentes().size(), inv.aulas().size(), inv.cursos().size(), inv.grupos().size());
        inv.rechazos().forEach(r -> System.out.printf("  RECHAZO [%s] %s fila %d: %s%n", r.codigo(), r.archivo(), r.fila(), r.motivo()));

        List<FranjaHoraria> franjas = cfg.generarFranjasValidas();
        ConjuntoDatos datos = ConstructorDominio.construir(inv, franjas);
        System.out.println("== Validación previa (RF-05) ==");
        new ValidadorEntrada(List.of(new ReglaTopeMatriculadosRV01(), new ReglaCierreMinimoRV02()))
                .validarGrupos(datos.grupos(), cfg)
                .forEach(v -> System.out.printf("  [%s] %s: %s%n", v.codigoRegla(), v.idGrupo(), v.mensaje()));

        MotorAsignacion motor = new MotorAsignacion(MedicionEscalabilidad.restriccionesMvp(), cfg, 60_000);
        ResultadoAsignacion r = motor.generarHorario(datos.sesiones(), datos.docentes(), datos.aulas(),
                OrdenFranjas.intercalarDias(franjas),
                OrdenExploracion.MAS_RESTRINGIDA_PRIMERO, true);
        System.out.println("== Generación (RF-06) ==");
        System.out.printf("estado %s | sesiones %d/%d | nodos %d | %d ms%n", r.completo() ? "COMPLETO" : "PARCIAL",
                r.estado().cantidadAsignaciones(), datos.sesiones().size(), r.nodosExplorados(), r.msTotal());
        for (ReporteConflicto c : r.conflictos()) {
            System.out.println("  CONFLICTO (RF-07) " + c.idSesion() + " " + c.tuplasBloqueadasPorCodigo());
        }
        if (r.completo() && args.length > 1 && args[1].equals("--csv")) {
            System.out.print(new ExportadorHorarioCSV().exportar(r.estado().getAsignaciones()));
        }
    }
}
