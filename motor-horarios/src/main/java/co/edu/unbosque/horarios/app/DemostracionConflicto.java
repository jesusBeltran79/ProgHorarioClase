package co.edu.unbosque.horarios.app;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.Aula;
import co.edu.unbosque.horarios.dominio.CaracteristicaAula;
import co.edu.unbosque.horarios.dominio.Curso;
import co.edu.unbosque.horarios.dominio.DiaSemana;
import co.edu.unbosque.horarios.dominio.Docente;
import co.edu.unbosque.horarios.dominio.FranjaHoraria;
import co.edu.unbosque.horarios.dominio.Grupo;
import co.edu.unbosque.horarios.dominio.Sesion;
import co.edu.unbosque.horarios.motor.MotorAsignacion;
import co.edu.unbosque.horarios.motor.OrdenExploracion;
import co.edu.unbosque.horarios.motor.ReporteConflicto;
import co.edu.unbosque.horarios.motor.ResultadoAsignacion;
import co.edu.unbosque.horarios.validacion.ReglaCierreMinimoRV02;
import co.edu.unbosque.horarios.validacion.ReglaTopeMatriculadosRV01;
import co.edu.unbosque.horarios.validacion.ValidadorEntrada;

import java.util.ArrayList;
import java.util.BitSet;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Caso sobrerrestringido inspirado en el boceto de la Fase 1. El Dr. Gómez es el único
 * habilitado para Cálculo I y Cálculo II y solo declara tres franjas libres,
 * pero los dos grupos suman cuatro sesiones. El motor no puede cumplir RD-08
 * y debe explicar el bloqueo con los códigos de cada restricción.
 */
public final class DemostracionConflicto {
    public static void main(String[] args) {
        ConfiguracionParametros cfg = new ConfiguracionParametros();
        List<FranjaHoraria> franjas = cfg.generarFranjasValidas();
        BitSet dispGomez = new BitSet();
        for (FranjaHoraria f : franjas) {
            int h = f.getHoraInicio().getHour();
            if ((f.getDia() == DiaSemana.MARTES && h < 12) || (f.getDia() == DiaSemana.MIERCOLES && h == 9)) {
                dispGomez.set(f.getIndice());
            }
        }
        BitSet completa = new BitSet();
        completa.set(0, franjas.size());
        Docente gomez = new Docente("D1", "Dr. Gómez", dispGomez);
        Docente ruiz = new Docente("D2", "Dra. Ruiz", completa);
        List<Aula> aulas = List.of(
                new Aula("A204", 40, EnumSet.noneOf(CaracteristicaAula.class)),
                new Aula("A302", 25, EnumSet.noneOf(CaracteristicaAula.class)),
                new Aula("A301", 45, EnumSet.of(CaracteristicaAula.COMPUTADORES)));
        Curso calc1 = new Curso("CAL1", "Cálculo I", 2, Set.of(), Set.of("D1"));
        Curso calc2 = new Curso("CAL2", "Cálculo II", 2, Set.of(), Set.of("D1"));
        Curso prog = new Curso("PRO2", "Programación II", 2, Set.of(CaracteristicaAula.COMPUTADORES), Set.of("D2"));
        Curso club = new Curso("TAL1", "Taller de lectura", 2, Set.of(), Set.of("D2"));
        List<Grupo> grupos = List.of(new Grupo("CAL1-G1", calc1, 30), new Grupo("CAL2-G2", calc2, 35),
                new Grupo("PRO2-G1", prog, 38), new Grupo("TAL1-G1", club, 8));
        List<Sesion> sesiones = new ArrayList<>();
        for (Grupo g : grupos)
            for (int s = 1; s <= 2; s++) sesiones.add(new Sesion(g.getId() + "-S" + s, g, s));

        ValidadorEntrada validador = new ValidadorEntrada(List.of(new ReglaTopeMatriculadosRV01(), new ReglaCierreMinimoRV02()));
        System.out.println("== Validación previa (RF-05) ==");
        validador.validarGrupos(grupos, cfg).forEach(v -> System.out.println("[" + v.codigoRegla() + "] " + v.idGrupo() + ": " + v.mensaje()));

        MotorAsignacion motor = new MotorAsignacion(MedicionEscalabilidad.restriccionesMvp(), cfg, 15_000);
        ResultadoAsignacion r = motor.generarHorario(sesiones, List.of(gomez, ruiz), aulas, franjas,
                OrdenExploracion.MAS_RESTRINGIDA_PRIMERO, true);
        System.out.println("== Resultado del motor ==");
        System.out.println("Horario completo: " + r.completo() + " | sesiones ubicadas: "
                + r.estado().cantidadAsignaciones() + "/" + sesiones.size() + " | nodos: " + r.nodosExplorados());
        r.estado().getAsignaciones().forEach(a -> System.out.println("  " + a.getSesion().getId() + " -> "
                + a.getFranja() + " | " + a.getAula().getId() + " | " + a.getDocente().getNombre()));
        for (ReporteConflicto c : r.conflictos()) {
            System.out.println("== Conflicto (RF-07) en " + c.idSesion() + " ==");
            c.tuplasBloqueadasPorCodigo().forEach((cod, n) -> System.out.println("  [" + cod + "] bloquea " + n + " tuplas"));
            c.alternativasPorLiberacion().forEach(a -> System.out.println("  Alternativa por liberación: " + a));
        }
    }
}
