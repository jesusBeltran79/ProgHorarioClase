package co.edu.unbosque.horarios.aplicacion;

import co.edu.unbosque.horarios.aplicacion.dto.Dto;
import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.dominio.FranjaHoraria;
import co.edu.unbosque.horarios.persistencia.RepositorioParametros;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

/** Consulta y cambio de los parámetros del semestre sin tocar código (RF-08). */
@Service
public class ServicioParametros {

    private final RepositorioParametros repositorio;

    public ServicioParametros(RepositorioParametros repositorio) {
        this.repositorio = repositorio;
    }

    public ConfiguracionParametros vigentes() {
        return repositorio.cargar();
    }

    public Dto.Parametros obtener() {
        return aDto(repositorio.cargar());
    }

    @Transactional
    public Dto.Parametros actualizar(Dto.Parametros p) {
        List<String> errores = new ArrayList<>();
        ConfiguracionParametros c = new ConfiguracionParametros();
        if (p.capMax() < 1 || p.capMax() > 200) errores.add("CAP_MAX debe estar entre 1 y 200");
        if (p.tol() < 0 || p.tol() > 1) errores.add("TOL debe estar entre 0 y 1");
        if (p.minCierre() < 0 || p.minCierre() > p.capMax()) errores.add("MIN_CIERRE debe estar entre 0 y CAP_MAX");
        if (p.maxSesiones() < 1 || p.maxSesiones() > 4) errores.add("MAX_SESIONES debe estar entre 1 y 4");
        if (p.durSesionHoras() < 1 || p.durSesionHoras() > 4) errores.add("DUR_SESION debe estar entre 1 y 4 horas");
        LocalTime apertura = hora(p.aperturaSemana(), "APERTURA_SEMANA", errores);
        LocalTime cierre = hora(p.cierreSemana(), "CIERRE_SEMANA", errores);
        LocalTime cierreSab = hora(p.cierreSabado(), "CIERRE_SABADO", errores);
        LocalTime iniBloq = hora(p.inicioBloqueo(), "INICIO_BLOQUEO", errores);
        LocalTime finBloq = hora(p.finBloqueo(), "FIN_BLOQUEO", errores);
        if (errores.isEmpty()) {
            if (!apertura.isBefore(cierre)) errores.add("La apertura debe ser anterior al cierre de lunes a viernes");
            if (!apertura.isBefore(cierreSab)) errores.add("La apertura debe ser anterior al cierre del sábado");
            if (!iniBloq.isBefore(finBloq)) errores.add("El inicio del bloqueo debe ser anterior a su fin");
        }
        if (!errores.isEmpty()) {
            throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "PARAMETROS_INVALIDOS", "Los parámetros no son válidos", errores);
        }
        c.setCapMax(p.capMax());
        c.setTol(p.tol());
        c.setMinCierre(p.minCierre());
        c.setMaxSesiones(p.maxSesiones());
        c.setDurSesionHoras(p.durSesionHoras());
        c.setAperturaSemana(apertura);
        c.setCierreSemana(cierre);
        c.setCierreSabado(cierreSab);
        c.setInicioBloqueo(iniBloq);
        c.setFinBloqueo(finBloq);
        List<FranjaHoraria> franjas = c.generarFranjasValidas();
        if (franjas.isEmpty()) {
            throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "SIN_FRANJAS",
                    "Con esos parámetros no queda ninguna franja válida", List.of());
        }
        repositorio.guardar(c);
        repositorio.sincronizarFranjas(franjas);
        return aDto(c);
    }

    public static Dto.Parametros aDto(ConfiguracionParametros c) {
        List<Dto.Franja> franjas = c.generarFranjasValidas().stream().map(ServicioParametros::aDto).toList();
        return new Dto.Parametros(c.getCapMax(), c.getTol(), c.getMinCierre(), c.getMaxSesiones(), c.getDurSesionHoras(),
                c.getAperturaSemana().toString(), c.getCierreSemana().toString(), c.getCierreSabado().toString(),
                c.getInicioBloqueo().toString(), c.getFinBloqueo().toString(), c.calcularUmbralMaximoGrupo(), franjas);
    }

    public static Dto.Franja aDto(FranjaHoraria f) {
        return new Dto.Franja(f.getIndice(), f.getDia().name(), f.getHoraInicio().toString(), f.getHoraFin().toString());
    }

    private static LocalTime hora(String texto, String nombre, List<String> errores) {
        try {
            return LocalTime.parse(texto);
        } catch (DateTimeParseException | NullPointerException e) {
            errores.add(nombre + " debe tener el formato HH:MM");
            return null;
        }
    }
}
