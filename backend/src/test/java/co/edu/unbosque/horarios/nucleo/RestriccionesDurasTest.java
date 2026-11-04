package co.edu.unbosque.horarios.nucleo;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.Asignacion;
import co.edu.unbosque.horarios.dominio.Aula;
import co.edu.unbosque.horarios.dominio.CaracteristicaAula;
import co.edu.unbosque.horarios.dominio.Curso;
import co.edu.unbosque.horarios.dominio.Docente;
import co.edu.unbosque.horarios.dominio.FranjaHoraria;
import co.edu.unbosque.horarios.dominio.Grupo;
import co.edu.unbosque.horarios.dominio.Sesion;
import co.edu.unbosque.horarios.motor.EstadoHorario;
import co.edu.unbosque.horarios.restricciones.RestriccionCapacidadAulaRD06;
import co.edu.unbosque.horarios.restricciones.RestriccionChoqueAulaRD02;
import co.edu.unbosque.horarios.restricciones.RestriccionChoqueDocenteRD01;
import co.edu.unbosque.horarios.restricciones.RestriccionDisponibilidadDocenteRD04;
import co.edu.unbosque.horarios.restricciones.RestriccionDocenteUnicoGrupoRD10;
import co.edu.unbosque.horarios.restricciones.RestriccionIdoneidadAulaRD05;
import co.edu.unbosque.horarios.soporte.Evidencia;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.BitSet;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Cada restricción dura acepta el caso válido y bloquea el caso que la viola. */
class RestriccionesDurasTest {

    private final ConfiguracionParametros cfg = new ConfiguracionParametros();
    private List<FranjaHoraria> franjas;
    private Docente gomez;
    private Docente ruiz;
    private Aula a204;
    private Aula a302;
    private Aula lab;
    private Sesion calculoS1;
    private Sesion calculoS2;
    private Sesion progS1;
    private EstadoHorario estado;

    @BeforeEach
    void preparar() {
        franjas = cfg.generarFranjasValidas();
        BitSet soloMartes = new BitSet();
        soloMartes.set(franjas.get(5).getIndice());
        soloMartes.set(franjas.get(6).getIndice());
        BitSet todas = new BitSet();
        todas.set(0, franjas.size());
        gomez = new Docente("D1", "Dr. Gómez", soloMartes);
        ruiz = new Docente("D2", "Dra. Ruiz", todas);
        a204 = new Aula("A204", 40, EnumSet.noneOf(CaracteristicaAula.class));
        a302 = new Aula("A302", 25, EnumSet.noneOf(CaracteristicaAula.class));
        lab = new Aula("A301", 45, EnumSet.of(CaracteristicaAula.COMPUTADORES));
        Curso calculo = new Curso("CAL2", "Cálculo II", 2, Set.of(), Set.of("D1", "D2"));
        Curso prog = new Curso("PRO2", "Programación II", 2, Set.of(CaracteristicaAula.COMPUTADORES), Set.of("D2"));
        Grupo gCal = new Grupo("CAL2-G2", calculo, 35);
        Grupo gProg = new Grupo("PRO2-G1", prog, 30);
        calculoS1 = new Sesion("CAL2-G2-S1", gCal, 1);
        calculoS2 = new Sesion("CAL2-G2-S2", gCal, 2);
        progS1 = new Sesion("PRO2-G1-S1", gProg, 1);
        estado = new EstadoHorario(franjas.size(), true);
    }

    @Test
    @DisplayName("RD-01 bloquea al mismo docente dos veces en la misma franja")
    void choqueDocente() {
        FranjaHoraria f = franjas.get(5);
        estado.agregarAsignacion(new Asignacion(progS1, ruiz, lab, f));
        RestriccionChoqueDocenteRD01 rd01 = new RestriccionChoqueDocenteRD01();
        assertFalse(rd01.esValida(new Asignacion(calculoS1, ruiz, a204, f), estado, cfg));
        assertTrue(rd01.esValida(new Asignacion(calculoS1, gomez, a204, f), estado, cfg));
        Evidencia.registrar("qa/restricciones.log", "RD-01 bloqueó a Dra. Ruiz en " + f + " porque ya dicta PRO2-G1-S1");
    }

    @Test
    @DisplayName("RD-02 bloquea dos sesiones en la misma aula y franja")
    void choqueAula() {
        FranjaHoraria f = franjas.get(5);
        estado.agregarAsignacion(new Asignacion(progS1, ruiz, a204, f));
        RestriccionChoqueAulaRD02 rd02 = new RestriccionChoqueAulaRD02();
        assertFalse(rd02.esValida(new Asignacion(calculoS1, gomez, a204, f), estado, cfg));
        assertTrue(rd02.esValida(new Asignacion(calculoS1, gomez, lab, f), estado, cfg));
        Evidencia.registrar("qa/restricciones.log", "RD-02 bloqueó el aula A204 en " + f + " porque ya la ocupa PRO2-G1-S1");
    }

    @Test
    @DisplayName("RD-04 respeta la disponibilidad y la habilitación del docente")
    void disponibilidad() {
        RestriccionDisponibilidadDocenteRD04 rd04 = new RestriccionDisponibilidadDocenteRD04();
        assertTrue(rd04.esValida(new Asignacion(calculoS1, gomez, a204, franjas.get(5)), estado, cfg));
        assertFalse(rd04.esValida(new Asignacion(calculoS1, gomez, a204, franjas.get(0)), estado, cfg));
        assertFalse(rd04.esValida(new Asignacion(progS1, gomez, lab, franjas.get(5)), estado, cfg));
        Evidencia.registrar("qa/restricciones.log", "RD-04 bloqueó al Dr. Gómez fuera de su disponibilidad y en un curso para el que no está habilitado");
    }

    @Test
    @DisplayName("RD-05 exige las características que pide el curso")
    void idoneidad() {
        RestriccionIdoneidadAulaRD05 rd05 = new RestriccionIdoneidadAulaRD05();
        assertFalse(rd05.esValida(new Asignacion(progS1, ruiz, a204, franjas.get(0)), estado, cfg));
        assertTrue(rd05.esValida(new Asignacion(progS1, ruiz, lab, franjas.get(0)), estado, cfg));
        Evidencia.registrar("qa/restricciones.log", "RD-05 bloqueó Programación II en A204 porque el aula no tiene computadores");
    }

    @Test
    @DisplayName("RD-06 bloquea un grupo más grande que el aula")
    void capacidad() {
        RestriccionCapacidadAulaRD06 rd06 = new RestriccionCapacidadAulaRD06();
        assertFalse(rd06.esValida(new Asignacion(calculoS1, gomez, a302, franjas.get(5)), estado, cfg));
        assertTrue(rd06.esValida(new Asignacion(calculoS1, gomez, a204, franjas.get(5)), estado, cfg));
        Evidencia.registrar("qa/restricciones.log", "RD-06 bloqueó CAL2-G2 de 35 estudiantes en A302 de 25 puestos");
    }

    @Test
    @DisplayName("RD-10 exige el mismo docente en todas las sesiones de un grupo")
    void docenteUnico() {
        estado.agregarAsignacion(new Asignacion(calculoS1, gomez, a204, franjas.get(5)));
        RestriccionDocenteUnicoGrupoRD10 rd10 = new RestriccionDocenteUnicoGrupoRD10();
        assertFalse(rd10.esValida(new Asignacion(calculoS2, ruiz, a204, franjas.get(7)), estado, cfg));
        assertTrue(rd10.esValida(new Asignacion(calculoS2, gomez, a204, franjas.get(6)), estado, cfg));
        Evidencia.registrar("qa/restricciones.log", "RD-10 bloqueó a Dra. Ruiz en CAL2-G2-S2 porque la sesión 1 la dicta el Dr. Gómez");
    }
}
