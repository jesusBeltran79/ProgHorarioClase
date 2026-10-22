package co.edu.unbosque.horarios.datos;

import co.edu.unbosque.horarios.dominio.Aula;
import co.edu.unbosque.horarios.dominio.Docente;
import co.edu.unbosque.horarios.dominio.Grupo;
import co.edu.unbosque.horarios.dominio.Sesion;

import java.util.List;

public record ConjuntoDatos(List<Docente> docentes, List<Aula> aulas, List<Grupo> grupos, List<Sesion> sesiones) { }
