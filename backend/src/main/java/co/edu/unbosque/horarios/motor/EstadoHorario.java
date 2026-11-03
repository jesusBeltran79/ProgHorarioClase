package co.edu.unbosque.horarios.motor;

import co.edu.unbosque.horarios.dominio.Asignacion;
import co.edu.unbosque.horarios.dominio.Sesion;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Horario en construcción. Guarda las asignaciones confirmadas y responde
 * si un docente o un aula ya están ocupados en una franja.
 * Con indexado = false recorre la lista (versión medida en la Fase 2).
 * Con indexado = true consulta mapas de ocupación por franja en O(1).
 */
public final class EstadoHorario {
    private final List<Asignacion> confirmadas = new ArrayList<>();
    private final boolean indexado;
    private final List<Set<String>> docentesPorFranja = new ArrayList<>();
    private final List<Set<String>> aulasPorFranja = new ArrayList<>();
    private final Map<String, Integer> rechazosPorCodigo = new HashMap<>();
    private long comparacionesChoque = 0;

    public EstadoHorario(int totalFranjas, boolean indexado) {
        this.indexado = indexado;
        for (int f = 0; f < totalFranjas; f++) {
            docentesPorFranja.add(new HashSet<>());
            aulasPorFranja.add(new HashSet<>());
        }
    }

    public void agregarAsignacion(Asignacion a) {
        confirmadas.add(a);
        docentesPorFranja.get(a.getFranja().getIndice()).add(a.getDocente().getId());
        aulasPorFranja.get(a.getFranja().getIndice()).add(a.getAula().getId());
    }

    public void removerUltimaAsignacion() {
        Asignacion a = confirmadas.remove(confirmadas.size() - 1);
        docentesPorFranja.get(a.getFranja().getIndice()).remove(a.getDocente().getId());
        aulasPorFranja.get(a.getFranja().getIndice()).remove(a.getAula().getId());
    }

    public boolean docenteOcupado(String idDocente, int franja) {
        if (indexado) {
            comparacionesChoque++;
            return docentesPorFranja.get(franja).contains(idDocente);
        }
        for (Asignacion a : confirmadas) {
            comparacionesChoque++;
            if (a.getFranja().getIndice() == franja && a.getDocente().getId().equals(idDocente)) return true;
        }
        return false;
    }

    public boolean aulaOcupada(String idAula, int franja) {
        if (indexado) {
            comparacionesChoque++;
            return aulasPorFranja.get(franja).contains(idAula);
        }
        for (Asignacion a : confirmadas) {
            comparacionesChoque++;
            if (a.getFranja().getIndice() == franja && a.getAula().getId().equals(idAula)) return true;
        }
        return false;
    }

    public void registrarRechazo(Sesion s, String codigo) {
        rechazosPorCodigo.merge(codigo, 1, Integer::sum);
    }

    public List<Asignacion> getAsignaciones() { return Collections.unmodifiableList(confirmadas); }
    public int cantidadAsignaciones() { return confirmadas.size(); }
    public Map<String, Integer> getRechazosPorCodigo() { return rechazosPorCodigo; }
    public long getComparacionesChoque() { return comparacionesChoque; }
    public boolean isIndexado() { return indexado; }
}
