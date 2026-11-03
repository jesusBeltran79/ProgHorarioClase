package co.edu.unbosque.horarios.aplicacion;

import org.springframework.http.HttpStatus;

import java.util.List;

/** Error esperado del negocio. Lleva el estado HTTP, un código corto y los detalles para el usuario. */
public class ExcepcionNegocio extends RuntimeException {
    private final HttpStatus estado;
    private final String codigo;
    private final List<String> detalles;

    public ExcepcionNegocio(HttpStatus estado, String codigo, String mensaje, List<String> detalles) {
        super(mensaje);
        this.estado = estado;
        this.codigo = codigo;
        this.detalles = detalles == null ? List.of() : List.copyOf(detalles);
    }

    public ExcepcionNegocio(HttpStatus estado, String codigo, String mensaje) {
        this(estado, codigo, mensaje, List.of());
    }

    public HttpStatus getEstado() { return estado; }
    public String getCodigo() { return codigo; }
    public List<String> getDetalles() { return detalles; }
}
