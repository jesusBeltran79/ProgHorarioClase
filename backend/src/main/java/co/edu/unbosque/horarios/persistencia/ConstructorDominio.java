package co.edu.unbosque.horarios.persistencia;

import co.edu.unbosque.horarios.datos.ConjuntoDatos;
import co.edu.unbosque.horarios.dominio.Aula;
import co.edu.unbosque.horarios.dominio.Curso;
import co.edu.unbosque.horarios.dominio.Docente;
import co.edu.unbosque.horarios.dominio.FranjaHoraria;
import co.edu.unbosque.horarios.dominio.Grupo;
import co.edu.unbosque.horarios.dominio.Sesion;
import co.edu.unbosque.horarios.persistencia.InventarioCargado.Disponibilidad;
import co.edu.unbosque.horarios.persistencia.InventarioCargado.RegistroAula;
import co.edu.unbosque.horarios.persistencia.InventarioCargado.RegistroCurso;
import co.edu.unbosque.horarios.persistencia.InventarioCargado.RegistroDocente;
import co.edu.unbosque.horarios.persistencia.InventarioCargado.RegistroGrupo;

import java.util.ArrayList;
import java.util.BitSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Convierte los registros del inventario en los objetos del dominio que usa el motor.
 * Aquí se traduce cada par de día y hora al índice de la franja en la grilla vigente.
 * Una franja declarada que ya no existe en la grilla se ignora.
 */
public final class ConstructorDominio {

    private ConstructorDominio() { }

    public static ConjuntoDatos construir(InventarioCargado inv, List<FranjaHoraria> franjas) {
        Map<String, Integer> indicePorFranja = new HashMap<>();
        for (FranjaHoraria f : franjas) indicePorFranja.put(clave(f.getDia().name(), f.getHoraInicio().toString()), f.getIndice());

        List<Docente> docentes = new ArrayList<>();
        for (RegistroDocente r : inv.docentes()) {
            BitSet disp = new BitSet(franjas.size());
            for (Disponibilidad d : r.disponibilidad()) {
                Integer i = indicePorFranja.get(clave(d.dia().name(), d.horaInicio().toString()));
                if (i != null) disp.set(i);
            }
            docentes.add(new Docente(r.id(), r.nombre(), disp));
        }
        List<Aula> aulas = new ArrayList<>();
        for (RegistroAula r : inv.aulas()) aulas.add(new Aula(r.id(), r.capacidad(), r.caracteristicas()));

        Map<String, Curso> cursos = new HashMap<>();
        for (RegistroCurso r : inv.cursos()) {
            cursos.put(r.id(), new Curso(r.id(), r.nombre(), r.numSesiones(), r.requisitos(), r.docentesHabilitados()));
        }
        List<Grupo> grupos = new ArrayList<>();
        List<Sesion> sesiones = new ArrayList<>();
        for (RegistroGrupo r : inv.grupos()) {
            Curso c = cursos.get(r.idCurso());
            if (c == null) continue;
            Grupo g = new Grupo(r.id(), c, r.matriculados());
            grupos.add(g);
            for (int s = 1; s <= c.getNumSesionesSemanales(); s++) {
                sesiones.add(new Sesion(idSesion(g.getId(), s), g, s));
            }
        }
        return new ConjuntoDatos(docentes, aulas, grupos, sesiones);
    }

    public static String idSesion(String idGrupo, int numero) {
        return idGrupo + "-S" + numero;
    }

    private static String clave(String dia, String hora) {
        return dia + "|" + hora;
    }
}
