package co.edu.unbosque.horarios.app;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.datos.ConjuntoDatos;
import co.edu.unbosque.horarios.datos.GeneradorDatosSinteticos;
import co.edu.unbosque.horarios.dominio.Asignacion;
import co.edu.unbosque.horarios.dominio.FranjaHoraria;
import co.edu.unbosque.horarios.dominio.Grupo;
import co.edu.unbosque.horarios.motor.MotorAsignacion;
import co.edu.unbosque.horarios.motor.OrdenExploracion;
import co.edu.unbosque.horarios.motor.ResultadoAsignacion;
import co.edu.unbosque.horarios.restricciones.RestriccionDura;
import co.edu.unbosque.horarios.restricciones.RestriccionMismoDiaRD09;
import co.edu.unbosque.horarios.validacion.ReglaCierreMinimoRV02;
import co.edu.unbosque.horarios.validacion.ReglaTopeMatriculadosRV01;
import co.edu.unbosque.horarios.validacion.ValidadorEntrada;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Ejecuta los tres cambios de regla de la Sección 5.2 del Documento Maestro. */
public final class PruebaDeCambio {
    public static void main(String[] args) {
        // Cambio 1. El tope pasa de 40 a 35 con la misma tolerancia. Solo cambia un parámetro.
        ConfiguracionParametros cfg = new ConfiguracionParametros();
        GeneradorDatosSinteticos gen = new GeneradorDatosSinteticos();
        List<FranjaHoraria> franjas = cfg.generarFranjasValidas();
        ConjuntoDatos d = gen.generar(1, 11, franjas);
        ValidadorEntrada val = new ValidadorEntrada(List.of(new ReglaTopeMatriculadosRV01(), new ReglaCierreMinimoRV02()));
        long antes = val.validarGrupos(d.grupos(), cfg).stream().filter(v -> v.codigoRegla().equals("RV-01")).count();
        cfg.setCapMax(35);
        long despues = val.validarGrupos(d.grupos(), cfg).stream().filter(v -> v.codigoRegla().equals("RV-01")).count();
        System.out.println("Cambio 1 | umbral RV-01 = " + cfg.calcularUmbralMaximoGrupo()
                + " | grupos sobre el tope antes = " + antes + " | después = " + despues);

        // Cambio 2. La jornada entre semana cierra a las 20:00. Solo cambia la ventana de oferta.
        ConfiguracionParametros cfg2 = new ConfiguracionParametros();
        cfg2.setCierreSemana(LocalTime.of(20, 0));
        System.out.println("Cambio 2 | franjas válidas con cierre 22:00 = " + franjas.size()
                + " | con cierre 20:00 = " + cfg2.generarFranjasValidas().size());

        // Cambio 3. Nueva restricción dura RD-09 registrada en el ensamblaje, sin tocar el motor.
        List<RestriccionDura> conRd09 = new ArrayList<>(MedicionEscalabilidad.restriccionesMvp());
        conRd09.add(new RestriccionMismoDiaRD09());
        MotorAsignacion motor = new MotorAsignacion(conRd09, new ConfiguracionParametros(), 15_000);
        ResultadoAsignacion r = motor.generarHorario(d.sesiones(), d.docentes(), d.aulas(), franjas,
                OrdenExploracion.MAS_RESTRINGIDA_PRIMERO, true);
        Map<Grupo, Set<Object>> dias = new HashMap<>();
        int repetidos = 0;
        for (Asignacion a : r.estado().getAsignaciones()) {
            if (!dias.computeIfAbsent(a.getSesion().getGrupo(), g -> new HashSet<>()).add(a.getFranja().getDia())) repetidos++;
        }
        System.out.println("Cambio 3 | completo = " + r.completo() + " | sesiones = " + r.estado().cantidadAsignaciones()
                + " | grupos con dos sesiones el mismo día = " + repetidos
                + " | rechazos RD-09 = " + r.estado().getRechazosPorCodigo().getOrDefault("RD-09", 0));
    }
}
