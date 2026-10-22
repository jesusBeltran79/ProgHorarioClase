package co.edu.unbosque.horarios.datos;

import co.edu.unbosque.horarios.dominio.Aula;
import co.edu.unbosque.horarios.dominio.CaracteristicaAula;
import co.edu.unbosque.horarios.dominio.Curso;
import co.edu.unbosque.horarios.dominio.Docente;
import co.edu.unbosque.horarios.dominio.FranjaHoraria;
import co.edu.unbosque.horarios.dominio.Grupo;
import co.edu.unbosque.horarios.dominio.Sesion;

import java.util.ArrayList;
import java.util.BitSet;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

/**
 * Genera conjuntos reproducibles por semilla. La escala k multiplica el
 * conjunto de sustentación (10 docentes, 5 aulas, 20 asignaturas, S-03).
 */
public final class GeneradorDatosSinteticos {
    private static final int[] CAPACIDADES = {25, 30, 35, 40, 45};

    public ConjuntoDatos generar(int k, long semilla, List<FranjaHoraria> franjas) {
        return generar(k, semilla, franjas, false);
    }

    /**
     * Con exigente = true los recursos especiales se vuelven escasos. Solo una de cada
     * cinco aulas tiene computadores y más de la mitad de los cursos los exige,
     * así que la ocupación de esas salas se acerca a su límite.
     */
    public ConjuntoDatos generar(int k, long semilla, List<FranjaHoraria> franjas, boolean exigente) {
        Random rnd = new Random(semilla);
        List<Docente> docentes = new ArrayList<>();
        for (int i = 0; i < 10 * k; i++) {
            BitSet disp = new BitSet(franjas.size());
            double perfil = rnd.nextDouble();
            for (FranjaHoraria f : franjas) {
                int h = f.getHoraInicio().getHour();
                boolean ok = perfil < 0.5 || (perfil < 0.75 ? h < 13 : h >= 15);
                if (ok) disp.set(f.getIndice());
            }
            docentes.add(new Docente("D" + (i + 1), "Docente " + (i + 1), disp));
        }
        List<Aula> aulas = new ArrayList<>();
        for (int i = 0; i < 5 * k; i++) {
            Set<CaracteristicaAula> c = EnumSet.noneOf(CaracteristicaAula.class);
            if (i % 5 == 0 || (!exigente && rnd.nextDouble() < 0.15)) c.add(CaracteristicaAula.COMPUTADORES);
            if (i % 5 == 1 || rnd.nextDouble() < 0.10) c.add(CaracteristicaAula.SILLAS_MOVILES);
            int cap = i % 5 == 0 ? 45 : CAPACIDADES[rnd.nextInt(CAPACIDADES.length)];
            aulas.add(new Aula("A" + (101 + i), cap, c));
        }
        List<Grupo> grupos = new ArrayList<>();
        List<Sesion> sesiones = new ArrayList<>();
        for (int i = 0; i < 20 * k; i++) {
            Set<CaracteristicaAula> req = EnumSet.noneOf(CaracteristicaAula.class);
            double r = rnd.nextDouble();
            if (r < (exigente ? 0.55 : 0.25)) req.add(CaracteristicaAula.COMPUTADORES);
            else if (r < 0.35) req.add(CaracteristicaAula.SILLAS_MOVILES);
            Set<String> habilitados = new HashSet<>();
            while (habilitados.size() < 3) habilitados.add("D" + (1 + rnd.nextInt(docentes.size())));
            int capMaxCompatible = 0;
            for (Aula a : aulas) if (a.cumpleRequisitos(req)) capMaxCompatible = Math.max(capMaxCompatible, a.getCapacidad());
            int matriculados = Math.min(exigente ? 25 + rnd.nextInt(20) : 15 + rnd.nextInt(30), capMaxCompatible);
            Curso curso = new Curso("C" + (i + 1), "Curso " + (i + 1), 2, req, habilitados);
            Grupo g = new Grupo("C" + (i + 1) + "-G1", curso, matriculados);
            grupos.add(g);
            for (int s = 1; s <= curso.getNumSesionesSemanales(); s++) {
                sesiones.add(new Sesion(g.getId() + "-S" + s, g, s));
            }
        }
        return new ConjuntoDatos(docentes, aulas, grupos, sesiones);
    }
}
