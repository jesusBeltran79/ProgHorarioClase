package co.edu.unbosque.horarios.app;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.datos.ConjuntoDatos;
import co.edu.unbosque.horarios.datos.GeneradorDatosSinteticos;
import co.edu.unbosque.horarios.dominio.FranjaHoraria;
import co.edu.unbosque.horarios.motor.MotorAsignacion;
import co.edu.unbosque.horarios.motor.OrdenExploracion;
import co.edu.unbosque.horarios.motor.OrdenFranjas;
import co.edu.unbosque.horarios.motor.ResultadoAsignacion;

import java.io.IOException;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Prueba de estrés con carga masiva. Ejecuta la configuración definitiva del motor
 * (sesión más restringida primero, mapas de ocupación y franjas intercaladas) sobre
 * 1x, 3x, 5x y 10x del conjunto de sustentación con dos perfiles y cinco semillas.
 * Uso: java -cp target/classes co.edu.unbosque.horarios.app.PruebaEstres carpetaSalida [limiteMs]
 */
public final class PruebaEstres {

    public static void main(String[] args) throws IOException {
        Path salida = Path.of(args.length > 0 ? args[0] : "target/evidencias/estres");
        long limiteMs = args.length > 1 ? Long.parseLong(args[1]) : 60_000;
        Files.createDirectories(salida);
        ConfiguracionParametros cfg = new ConfiguracionParametros();
        List<FranjaHoraria> franjas = cfg.generarFranjasValidas();
        List<FranjaHoraria> orden = OrdenFranjas.intercalarDias(franjas);
        GeneradorDatosSinteticos gen = new GeneradorDatosSinteticos();
        MotorAsignacion motor = new MotorAsignacion(MedicionEscalabilidad.restriccionesMvp(), cfg, limiteMs);

        ConjuntoDatos cal = gen.generar(1, 999, franjas);
        for (int i = 0; i < 3; i++) {
            motor.generarHorario(cal.sesiones(), cal.docentes(), cal.aulas(), orden, OrdenExploracion.MAS_RESTRINGIDA_PRIMERO, true);
        }

        int[] escalas = {1, 3, 5, 10};
        long[] semillas = {11, 22, 33, 44, 55};
        StringBuilder resumen = new StringBuilder();
        resumen.append(String.format("%-9s %-8s %9s %9s %9s %9s %12s %10s%n",
                "perfil", "escala", "sesiones", "prom_ms", "mediana", "peor_ms", "nodos_prom", "completos"));
        try (PrintWriter csv = new PrintWriter(Files.newBufferedWriter(salida.resolve("estres.csv")))) {
            csv.println("perfil,escala,semilla,docentes,aulas,sesiones,completo,limite_alcanzado,ms_total,ms_preconteo,nodos,conflictos");
            for (String perfil : new String[]{"holgado", "exigente"}) {
                for (int k : escalas) {
                    List<Long> tiempos = new ArrayList<>();
                    long nodos = 0;
                    int completos = 0;
                    int sesiones = 0;
                    for (long s : semillas) {
                        ConjuntoDatos d = gen.generar(k, s, franjas, perfil.equals("exigente"));
                        ResultadoAsignacion r = motor.generarHorario(d.sesiones(), d.docentes(), d.aulas(), orden,
                                OrdenExploracion.MAS_RESTRINGIDA_PRIMERO, true);
                        sesiones = d.sesiones().size();
                        csv.printf("%s,%dx,%d,%d,%d,%d,%b,%b,%d,%d,%d,%d%n", perfil, k, s, d.docentes().size(),
                                d.aulas().size(), sesiones, r.completo(), r.agotoTiempo(), r.msTotal(),
                                r.msPreconteo(), r.nodosExplorados(), r.conflictos().size());
                        csv.flush();
                        tiempos.add(r.msTotal());
                        nodos += r.nodosExplorados();
                        if (r.completo()) completos++;
                        System.out.printf("%s %dx semilla %d -> %s en %d ms (%d nodos)%n", perfil, k, s,
                                r.completo() ? "COMPLETO" : "PARCIAL", r.msTotal(), r.nodosExplorados());
                    }
                    Collections.sort(tiempos);
                    double prom = tiempos.stream().mapToLong(Long::longValue).average().orElse(0);
                    resumen.append(String.format("%-9s %-8s %9d %9.1f %9d %9d %12d %7d/%d%n", perfil, k + "x", sesiones,
                            prom, tiempos.get(tiempos.size() / 2), tiempos.get(tiempos.size() - 1),
                            nodos / semillas.length, completos, semillas.length));
                }
            }
        }
        resumen.append(String.format("%nLímite por corrida %d ms. RNF-01 exige 60 s o menos sobre el conjunto de sustentación (1x).%n", limiteMs));
        Files.writeString(salida.resolve("resumen.txt"), resumen.toString());
        System.out.print(resumen);
    }
}
