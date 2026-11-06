package co.edu.unbosque.horarios.aplicacion.cuentas;

import co.edu.unbosque.horarios.aplicacion.catalogos.DtoCatalogos.FranjaDisponible;
import co.edu.unbosque.horarios.aplicacion.dto.Dto;

import java.util.List;

/** Formas JSON de cuentas y del portal del docente. Fijadas en PLAN_USUARIOS_M3.md sección 2.2. */
public final class DtoCuentas {

    private DtoCuentas() { }

    public record UsuarioGestion(int id, String nombreUsuario, String rol, String idDocente, String nombreDocente,
                                 boolean activo) { }

    public record UsuarioNuevo(String nombreUsuario, String rol, String idDocente, String contrasena) { }

    public record UsuarioCambio(String rol, String idDocente, Boolean activo, String contrasena) { }

    public record Perfil(String usuario, String rol, String idDocente, String nombreDocente) { }

    public record MiHorario(int idEjecucion, String fechaPublicacion, String docente, List<Dto.AsignacionDto> asignaciones) { }

    public record MiDisponibilidad(List<Dto.Franja> franjasValidas, List<FranjaDisponible> disponibles) { }

    public record CambioContrasena(String actual, String nueva) { }
}
