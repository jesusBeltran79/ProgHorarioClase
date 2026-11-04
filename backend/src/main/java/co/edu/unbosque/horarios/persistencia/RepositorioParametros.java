package co.edu.unbosque.horarios.persistencia;

import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.FranjaHoraria;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Time;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Lee y guarda los parámetros configurables (RF-08) y mantiene el catálogo de franjas vigente. */
@Repository
public class RepositorioParametros {

    private final JdbcTemplate jdbc;

    public RepositorioParametros(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public ConfiguracionParametros cargar() {
        Map<String, String> v = new HashMap<>();
        jdbc.query("SELECT clave, valor FROM parametro_configuracion", rs -> {
            v.put(rs.getString("clave"), rs.getString("valor"));
        });
        ConfiguracionParametros c = new ConfiguracionParametros();
        if (v.containsKey("CAP_MAX")) c.setCapMax(Integer.parseInt(v.get("CAP_MAX")));
        if (v.containsKey("TOL")) c.setTol(Double.parseDouble(v.get("TOL")));
        if (v.containsKey("MIN_CIERRE")) c.setMinCierre(Integer.parseInt(v.get("MIN_CIERRE")));
        if (v.containsKey("MAX_SESIONES")) c.setMaxSesiones(Integer.parseInt(v.get("MAX_SESIONES")));
        if (v.containsKey("DUR_SESION")) c.setDurSesionHoras(Integer.parseInt(v.get("DUR_SESION")));
        if (v.containsKey("APERTURA_SEMANA")) c.setAperturaSemana(LocalTime.parse(v.get("APERTURA_SEMANA")));
        if (v.containsKey("CIERRE_SEMANA")) c.setCierreSemana(LocalTime.parse(v.get("CIERRE_SEMANA")));
        if (v.containsKey("CIERRE_SABADO")) c.setCierreSabado(LocalTime.parse(v.get("CIERRE_SABADO")));
        if (v.containsKey("INICIO_BLOQUEO")) c.setInicioBloqueo(LocalTime.parse(v.get("INICIO_BLOQUEO")));
        if (v.containsKey("FIN_BLOQUEO")) c.setFinBloqueo(LocalTime.parse(v.get("FIN_BLOQUEO")));
        return c;
    }

    public void guardar(ConfiguracionParametros c) {
        actualizar("CAP_MAX", String.valueOf(c.getCapMax()));
        actualizar("TOL", String.valueOf(c.getTol()));
        actualizar("MIN_CIERRE", String.valueOf(c.getMinCierre()));
        actualizar("MAX_SESIONES", String.valueOf(c.getMaxSesiones()));
        actualizar("DUR_SESION", String.valueOf(c.getDurSesionHoras()));
        actualizar("APERTURA_SEMANA", c.getAperturaSemana().toString());
        actualizar("CIERRE_SEMANA", c.getCierreSemana().toString());
        actualizar("CIERRE_SABADO", c.getCierreSabado().toString());
        actualizar("INICIO_BLOQUEO", c.getInicioBloqueo().toString());
        actualizar("FIN_BLOQUEO", c.getFinBloqueo().toString());
    }

    /** Reemplaza el catálogo franja_horaria por la grilla calculada con los parámetros vigentes. */
    public void sincronizarFranjas(List<FranjaHoraria> franjas) {
        jdbc.update("DELETE FROM franja_horaria");
        jdbc.batchUpdate("INSERT INTO franja_horaria (id_franja, dia, hora_inicio, hora_fin) VALUES (?, ?, ?, ?)",
                franjas, franjas.size(), (ps, f) -> {
                    ps.setInt(1, f.getIndice());
                    ps.setString(2, f.getDia().name());
                    ps.setTime(3, Time.valueOf(f.getHoraInicio()));
                    ps.setTime(4, Time.valueOf(f.getHoraFin()));
                });
    }

    private void actualizar(String clave, String valor) {
        jdbc.update("UPDATE parametro_configuracion SET valor = ? WHERE clave = ?", valor, clave);
    }
}
