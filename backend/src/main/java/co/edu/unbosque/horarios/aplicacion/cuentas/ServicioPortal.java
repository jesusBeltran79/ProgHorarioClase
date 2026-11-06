package co.edu.unbosque.horarios.aplicacion.cuentas;

import co.edu.unbosque.horarios.aplicacion.ExcepcionNegocio;
import co.edu.unbosque.horarios.aplicacion.ServicioHorarios;
import co.edu.unbosque.horarios.aplicacion.ServicioParametros;
import co.edu.unbosque.horarios.aplicacion.catalogos.DtoCatalogos.FranjaDisponible;
import co.edu.unbosque.horarios.aplicacion.catalogos.ServicioCatalogos;
import co.edu.unbosque.horarios.aplicacion.cuentas.DtoCuentas.MiDisponibilidad;
import co.edu.unbosque.horarios.aplicacion.cuentas.DtoCuentas.MiHorario;
import co.edu.unbosque.horarios.aplicacion.cuentas.DtoCuentas.Perfil;
import co.edu.unbosque.horarios.aplicacion.dto.Dto;
import co.edu.unbosque.horarios.persistencia.RepositorioCatalogos;
import co.edu.unbosque.horarios.persistencia.RepositorioUsuarios;
import co.edu.unbosque.horarios.persistencia.RepositorioUsuarios.Usuario;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Portal del docente (RF-12 y RF-14). Todo se resuelve con el docente ligado a la cuenta de la sesión,
 * así un docente nunca puede leer ni cambiar datos de otro.
 */
@Service
public class ServicioPortal {

    private final RepositorioUsuarios usuarios;
    private final RepositorioCatalogos catalogos;
    private final ServicioCatalogos servicioCatalogos;
    private final ServicioHorarios horarios;
    private final ServicioParametros parametros;

    public ServicioPortal(RepositorioUsuarios usuarios, RepositorioCatalogos catalogos, ServicioCatalogos servicioCatalogos,
                          ServicioHorarios horarios, ServicioParametros parametros) {
        this.usuarios = usuarios;
        this.catalogos = catalogos;
        this.servicioCatalogos = servicioCatalogos;
        this.horarios = horarios;
        this.parametros = parametros;
    }

    public Perfil perfil(String nombre) {
        Usuario u = usuario(nombre);
        return new Perfil(u.nombre(), u.rol(), u.idDocente(), usuarios.nombreDocente(u.idDocente()).orElse(null));
    }

    /** Solo las sesiones del docente en el horario publicado. */
    public MiHorario horario(String nombre) {
        Usuario u = usuario(nombre);
        Dto.Resultado r = horarios.publicado().orElseThrow(() -> new ExcepcionNegocio(HttpStatus.NOT_FOUND, "SIN_PUBLICAR",
                "Todavía no hay un horario publicado"));
        List<Dto.AsignacionDto> propias = r.asignaciones().stream().filter(a -> u.idDocente().equals(a.idDocente())).toList();
        return new MiHorario(r.idEjecucion(), r.fechaHora(), usuarios.nombreDocente(u.idDocente()).orElse(u.idDocente()), propias);
    }

    public MiDisponibilidad disponibilidad(String nombre) {
        Usuario u = usuario(nombre);
        List<FranjaDisponible> propias = catalogos.docentes().stream().filter(d -> d.id().equals(u.idDocente())).findFirst()
                .map(d -> d.disponibilidad().stream().map(x -> new FranjaDisponible(x.dia(), x.horaInicio().toString())).toList())
                .orElse(List.of());
        List<Dto.Franja> franjas = parametros.vigentes().generarFranjasValidas().stream().map(ServicioParametros::aDto).toList();
        return new MiDisponibilidad(franjas, propias);
    }

    /** Reemplaza la disponibilidad. No borra horarios. Se aplica en la próxima generación. */
    @Transactional
    public MiDisponibilidad guardarDisponibilidad(String nombre, List<FranjaDisponible> nuevas) {
        Usuario u = usuario(nombre);
        catalogos.reemplazarDisponibilidad(u.idDocente(), servicioCatalogos.validarDisponibilidad(nuevas));
        return disponibilidad(nombre);
    }

    private Usuario usuario(String nombre) {
        Usuario u = usuarios.buscar(nombre).orElseThrow(() ->
                new ExcepcionNegocio(HttpStatus.UNAUTHORIZED, "USUARIO_DESCONOCIDO", "El usuario no existe"));
        if (u.idDocente() == null) {
            throw new ExcepcionNegocio(HttpStatus.FORBIDDEN, "SIN_DOCENTE", "La cuenta no está ligada a un docente");
        }
        return u;
    }
}
