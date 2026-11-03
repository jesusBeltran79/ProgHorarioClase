package co.edu.unbosque.horarios.soporte;

import co.edu.unbosque.horarios.dominio.Asignacion;
import co.edu.unbosque.horarios.dominio.Sesion;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Verificador independiente del motor. Revisa un horario terminado contra las restricciones duras
 * sin usar las clases de restricciones, para que la prueba no se califique a sí misma.
 */
public final class VerificadorHorario {

    private VerificadorHorario() { }

    public static List<String> violaciones(List<Asignacion> horario, List<Sesion> todas) {
        List<String> errores = new ArrayList<>();
        Set<String> docenteFranja = new HashSet<>();
        Set<String> aulaFranja = new HashSet<>();
        Map<String, String> docentePorGrupo = new HashMap<>();
        Set<String> sesionesUbicadas = new HashSet<>();
        for (Asignacion a : horario) {
            int f = a.getFranja().getIndice();
            String g = a.getSesion().getGrupo().getId();
            if (!docenteFranja.add(a.getDocente().getId() + "@" + f)) errores.add("RD-01 " + a.getSesion().getId());
            if (!aulaFranja.add(a.getAula().getId() + "@" + f)) errores.add("RD-02 " + a.getSesion().getId());
            if (!a.getDocente().estaDisponibleEn(f)) errores.add("RD-04 disponibilidad " + a.getSesion().getId());
            if (!a.getSesion().getGrupo().getCurso().habilitaA(a.getDocente().getId())) errores.add("RD-04 habilitación " + a.getSesion().getId());
            if (!a.getAula().cumpleRequisitos(a.getSesion().getGrupo().getCurso().getRequisitosAula())) errores.add("RD-05 " + a.getSesion().getId());
            if (a.getAula().getCapacidad() < a.getSesion().getGrupo().getMatriculados()) errores.add("RD-06 " + a.getSesion().getId());
            String previo = docentePorGrupo.putIfAbsent(g, a.getDocente().getId());
            if (previo != null && !previo.equals(a.getDocente().getId())) errores.add("RD-10 " + g);
            if (!sesionesUbicadas.add(a.getSesion().getId())) errores.add("Sesión duplicada " + a.getSesion().getId());
        }
        for (Sesion s : todas) if (!sesionesUbicadas.contains(s.getId())) errores.add("RD-08 " + s.getId());
        return errores;
    }
}
