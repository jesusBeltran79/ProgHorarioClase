package co.edu.unbosque.horarios.app;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.datos.ConjuntoDatos;
import co.edu.unbosque.horarios.datos.GeneradorDatosSinteticos;
import co.edu.unbosque.horarios.dominio.FranjaHoraria;
import co.edu.unbosque.horarios.motor.MotorAsignacion;
import co.edu.unbosque.horarios.motor.OrdenExploracion;
import co.edu.unbosque.horarios.motor.ResultadoAsignacion;
import co.edu.unbosque.horarios.restricciones.RestriccionCapacidadAulaRD06;
import co.edu.unbosque.horarios.restricciones.RestriccionChoqueAulaRD02;
import co.edu.unbosque.horarios.restricciones.RestriccionChoqueDocenteRD01;
import co.edu.unbosque.horarios.restricciones.RestriccionDisponibilidadDocenteRD04;
import co.edu.unbosque.horarios.restricciones.RestriccionDura;
import co.edu.unbosque.horarios.restricciones.RestriccionIdoneidadAulaRD05;

import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

/** Ejecuta las corridas 1x, 2x y 3x con cinco semillas y escribe un CSV. */
public final class MedicionEscalabilidad {

    public static List<RestriccionDura> restriccionesMvp() {
        return List.of(new RestriccionDisponibilidadDocenteRD04(), new RestriccionIdoneidadAulaRD05(),
                new RestriccionCapacidadAulaRD06(), new RestriccionChoqueDocenteRD01(),
                new RestriccionChoqueAulaRD02());
    }

    public static void main(String[] args) throws IOException {
        long limiteMs = args.length > 0 ? Long.parseLong(args[0]) : 15_000;
        String salida = args.length > 1 ? args[1] : "mediciones.csv";
        boolean exigente = args.length > 2 && args[2].equals("exigente");
        ConfiguracionParametros cfg = new ConfiguracionParametros();
        List<FranjaHoraria> franjas = cfg.generarFranjasValidas();
        System.out.println("Franjas válidas generadas: " + franjas.size());
        GeneradorDatosSinteticos gen = new GeneradorDatosSinteticos();
        MotorAsignacion motor = new MotorAsignacion(restriccionesMvp(), cfg, limiteMs);

        // Calentamiento de la JVM para no medir la compilación JIT
        ConjuntoDatos calentamiento = gen.generar(1, 999, franjas);
        for (int i = 0; i < 3; i++) {
            motor.generarHorario(calentamiento.sesiones(), calentamiento.docentes(), calentamiento.aulas(),
                    franjas, OrdenExploracion.MAS_RESTRINGIDA_PRIMERO, false);
        }

        long[] semillas = {11, 22, 33, 44, 55};
        Object[][] variantes = {
                {"Orden ingenuo + lista", OrdenExploracion.INGENUO, false},
                {"Mas restringida + lista", OrdenExploracion.MAS_RESTRINGIDA_PRIMERO, false},
                {"Mas restringida + indice", OrdenExploracion.MAS_RESTRINGIDA_PRIMERO, true}};
        try (PrintWriter csv = new PrintWriter(new FileWriter(salida))) {
            csv.println("escala,variante,semilla,sesiones,completo,timeout,ms_total,ms_preconteo,nodos,eval_dominio,comparaciones_choque,conflictos");
            for (int k = 1; k <= 3; k++) {
                for (Object[] v : variantes) {
                    for (long semilla : semillas) {
                        ConjuntoDatos d = gen.generar(k, semilla, franjas, exigente);
                        ResultadoAsignacion r = motor.generarHorario(d.sesiones(), d.docentes(), d.aulas(), franjas,
                                (OrdenExploracion) v[1], (Boolean) v[2]);
                        String fila = String.join(",", k + "x", (String) v[0], String.valueOf(semilla),
                                String.valueOf(d.sesiones().size()), String.valueOf(r.completo()),
                                String.valueOf(r.agotoTiempo()), String.valueOf(r.msTotal()),
                                String.valueOf(r.msPreconteo()), String.valueOf(r.nodosExplorados()),
                                String.valueOf(r.evaluacionesDominioInicial()),
                                String.valueOf(r.estado().getComparacionesChoque()),
                                String.valueOf(r.conflictos().size()));
                        csv.println(fila);
                        System.out.println(fila);
                    }
                }
            }
        }
    }
}
