package co.edu.unbosque.horarios.persistencia;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.CaracteristicaAula;
import co.edu.unbosque.horarios.dominio.DiaSemana;
import co.edu.unbosque.horarios.dominio.FranjaHoraria;
import co.edu.unbosque.horarios.persistencia.InventarioCargado.Disponibilidad;
import co.edu.unbosque.horarios.persistencia.InventarioCargado.Rechazo;
import co.edu.unbosque.horarios.persistencia.InventarioCargado.RegistroAula;
import co.edu.unbosque.horarios.persistencia.InventarioCargado.RegistroCurso;
import co.edu.unbosque.horarios.persistencia.InventarioCargado.RegistroDocente;
import co.edu.unbosque.horarios.persistencia.InventarioCargado.RegistroGrupo;
import co.edu.unbosque.horarios.persistencia.csv.LectorCSV;
import co.edu.unbosque.horarios.persistencia.csv.LectorCSV.Archivo;
import co.edu.unbosque.horarios.persistencia.csv.LectorCSV.Fila;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Lee los cuatro archivos de inventario con el formato de la Tabla D2 (RF-01 a RF-04).
 * Cada fila inválida se rechaza con su número de línea y su motivo y el resto se acepta.
 * La disponibilidad del docente llega como pares de día y hora y se valida contra la
 * grilla vigente, así un cambio de grilla no obliga a rehacer los archivos.
 */
public final class CargadorInventariosCSV {

    static final List<String> ENC_DOCENTES = List.of("id_docente", "nombre", "dedicacion", "escalafon", "disponibilidad");
    static final List<String> ENC_AULAS = List.of("id_aula", "capacidad", "caracteristicas");
    static final List<String> ENC_CURSOS = List.of("id_curso", "nombre", "num_sesiones", "requisitos", "docentes_habilitados");
    static final List<String> ENC_GRUPOS = List.of("id_grupo", "id_curso", "matriculados");

    private final ConfiguracionParametros config;

    public CargadorInventariosCSV(ConfiguracionParametros config) {
        this.config = config;
    }

    public InventarioCargado cargar(InputStream docentes, InputStream aulas, InputStream cursos, InputStream grupos)
            throws IOException {
        List<Rechazo> rechazos = new ArrayList<>();
        List<RegistroDocente> rd = cargarDocentes(LectorCSV.leer(docentes), rechazos);
        List<RegistroAula> ra = cargarAulas(LectorCSV.leer(aulas), rechazos);
        Set<String> idsDocentes = new HashSet<>();
        rd.forEach(d -> idsDocentes.add(d.id()));
        List<RegistroCurso> rc = cargarCursos(LectorCSV.leer(cursos), idsDocentes, rechazos);
        Set<String> idsCursos = new HashSet<>();
        rc.forEach(c -> idsCursos.add(c.id()));
        List<RegistroGrupo> rg = cargarGrupos(LectorCSV.leer(grupos), idsCursos, rechazos);
        return new InventarioCargado(rd, ra, rc, rg, rechazos);
    }

    private boolean encabezadoValido(Archivo a, List<String> esperado, String nombre, List<Rechazo> rechazos) {
        if (!a.encabezado().equals(esperado)) {
            rechazos.add(new Rechazo(nombre, 1, "FORMATO",
                    "El encabezado debe ser " + String.join(",", esperado)));
            return false;
        }
        return true;
    }

    List<RegistroDocente> cargarDocentes(Archivo a, List<Rechazo> rechazos) {
        String archivo = "docentes.csv";
        List<RegistroDocente> salida = new ArrayList<>();
        if (!encabezadoValido(a, ENC_DOCENTES, archivo, rechazos)) return salida;
        List<FranjaHoraria> franjas = config.generarFranjasValidas();
        Set<String> vistos = new HashSet<>();
        for (Fila f : a.filas()) {
            String id = f.campo(0);
            String nombre = f.campo(1);
            if (id.isEmpty() || nombre.isEmpty()) {
                rechazos.add(new Rechazo(archivo, f.numero(), "FORMATO", "El identificador y el nombre son obligatorios"));
                continue;
            }
            if (!vistos.add(id)) {
                rechazos.add(new Rechazo(archivo, f.numero(), "FORMATO", "El docente " + id + " está repetido"));
                continue;
            }
            String texto = f.campo(4);
            List<Disponibilidad> disp = new ArrayList<>();
            String error = null;
            if (texto.equalsIgnoreCase("TODAS")) {
                franjas.forEach(fr -> disp.add(new Disponibilidad(fr.getDia(), fr.getHoraInicio())));
            } else if (!texto.isEmpty()) {
                for (String par : texto.split(";")) {
                    if (par.isBlank()) continue;
                    try {
                        String[] partes = par.trim().split("\\s+");
                        DiaSemana dia = DiaSemana.desdeTexto(partes[0]);
                        LocalTime hora = LocalTime.parse(partes[1].length() == 4 ? "0" + partes[1] : partes[1]);
                        boolean existe = franjas.stream().anyMatch(fr -> fr.getDia() == dia && fr.getHoraInicio().equals(hora));
                        if (!existe) {
                            error = "La franja " + par.trim() + " no pertenece a las " + franjas.size() + " franjas válidas";
                            break;
                        }
                        disp.add(new Disponibilidad(dia, hora));
                    } catch (RuntimeException e) {
                        error = "No se entiende la disponibilidad " + par.trim() + ". Use DIA HH:MM, por ejemplo MAR 07:00";
                        break;
                    }
                }
            }
            if (error != null) {
                rechazos.add(new Rechazo(archivo, f.numero(), error.startsWith("La franja") ? "RD-03" : "FORMATO", error));
                continue;
            }
            if (disp.isEmpty()) {
                rechazos.add(new Rechazo(archivo, f.numero(), "RD-04", "El docente " + id + " no declara ninguna franja disponible"));
                continue;
            }
            salida.add(new RegistroDocente(id, nombre, f.campo(2), f.campo(3), disp));
        }
        return salida;
    }

    List<RegistroAula> cargarAulas(Archivo a, List<Rechazo> rechazos) {
        String archivo = "aulas.csv";
        List<RegistroAula> salida = new ArrayList<>();
        if (!encabezadoValido(a, ENC_AULAS, archivo, rechazos)) return salida;
        Set<String> vistos = new HashSet<>();
        for (Fila f : a.filas()) {
            String id = f.campo(0);
            if (id.isEmpty()) {
                rechazos.add(new Rechazo(archivo, f.numero(), "FORMATO", "El identificador del aula es obligatorio"));
                continue;
            }
            if (!vistos.add(id)) {
                rechazos.add(new Rechazo(archivo, f.numero(), "FORMATO", "El aula " + id + " está repetida"));
                continue;
            }
            Integer capacidad = entero(f.campo(1));
            if (capacidad == null || capacidad <= 0) {
                rechazos.add(new Rechazo(archivo, f.numero(), "FORMATO", "La capacidad del aula " + id + " debe ser un entero mayor que cero"));
                continue;
            }
            Set<CaracteristicaAula> carac;
            try {
                carac = caracteristicas(f.campo(2));
            } catch (IllegalArgumentException e) {
                rechazos.add(new Rechazo(archivo, f.numero(), "FORMATO", e.getMessage()));
                continue;
            }
            salida.add(new RegistroAula(id, capacidad, carac));
        }
        return salida;
    }

    List<RegistroCurso> cargarCursos(Archivo a, Set<String> idsDocentes, List<Rechazo> rechazos) {
        String archivo = "cursos.csv";
        List<RegistroCurso> salida = new ArrayList<>();
        if (!encabezadoValido(a, ENC_CURSOS, archivo, rechazos)) return salida;
        Set<String> vistos = new HashSet<>();
        for (Fila f : a.filas()) {
            String id = f.campo(0);
            if (id.isEmpty() || f.campo(1).isEmpty()) {
                rechazos.add(new Rechazo(archivo, f.numero(), "FORMATO", "El identificador y el nombre del curso son obligatorios"));
                continue;
            }
            if (!vistos.add(id)) {
                rechazos.add(new Rechazo(archivo, f.numero(), "FORMATO", "El curso " + id + " está repetido"));
                continue;
            }
            Integer sesiones = entero(f.campo(2));
            if (sesiones == null || sesiones < 1 || sesiones > config.getMaxSesiones()) {
                rechazos.add(new Rechazo(archivo, f.numero(), "RD-07",
                        "El curso " + id + " debe tener entre 1 y " + config.getMaxSesiones() + " sesiones semanales"));
                continue;
            }
            Set<CaracteristicaAula> req;
            try {
                req = caracteristicas(f.campo(3));
            } catch (IllegalArgumentException e) {
                rechazos.add(new Rechazo(archivo, f.numero(), "FORMATO", e.getMessage()));
                continue;
            }
            Set<String> habilitados = new LinkedHashSet<>();
            String desconocido = null;
            for (String d : f.campo(4).split(";")) {
                if (d.isBlank()) continue;
                if (!idsDocentes.contains(d.trim())) { desconocido = d.trim(); break; }
                habilitados.add(d.trim());
            }
            if (desconocido != null) {
                rechazos.add(new Rechazo(archivo, f.numero(), "REFERENCIA",
                        "El docente habilitado " + desconocido + " no existe en docentes.csv"));
                continue;
            }
            salida.add(new RegistroCurso(id, f.campo(1), sesiones, req, habilitados));
        }
        return salida;
    }

    List<RegistroGrupo> cargarGrupos(Archivo a, Set<String> idsCursos, List<Rechazo> rechazos) {
        String archivo = "grupos.csv";
        List<RegistroGrupo> salida = new ArrayList<>();
        if (!encabezadoValido(a, ENC_GRUPOS, archivo, rechazos)) return salida;
        Set<String> vistos = new HashSet<>();
        for (Fila f : a.filas()) {
            String id = f.campo(0);
            if (id.isEmpty()) {
                rechazos.add(new Rechazo(archivo, f.numero(), "FORMATO", "El identificador del grupo es obligatorio"));
                continue;
            }
            if (!vistos.add(id)) {
                rechazos.add(new Rechazo(archivo, f.numero(), "FORMATO", "El grupo " + id + " está repetido"));
                continue;
            }
            if (!idsCursos.contains(f.campo(1))) {
                rechazos.add(new Rechazo(archivo, f.numero(), "REFERENCIA",
                        "El curso " + f.campo(1) + " del grupo " + id + " no existe en cursos.csv"));
                continue;
            }
            Integer mat = entero(f.campo(2));
            if (mat == null || mat < 0) {
                rechazos.add(new Rechazo(archivo, f.numero(), "FORMATO", "Los matriculados del grupo " + id + " deben ser un entero no negativo"));
                continue;
            }
            salida.add(new RegistroGrupo(id, f.campo(1), mat));
        }
        return salida;
    }

    private static Integer entero(String texto) {
        try {
            return Integer.parseInt(texto.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Set<CaracteristicaAula> caracteristicas(String texto) {
        Set<CaracteristicaAula> salida = EnumSet.noneOf(CaracteristicaAula.class);
        for (String c : texto.split(";")) {
            if (c.isBlank()) continue;
            try {
                salida.add(CaracteristicaAula.valueOf(c.trim().toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("La característica " + c.trim() + " no existe. Use COMPUTADORES o SILLAS_MOVILES");
            }
        }
        return salida;
    }
}
