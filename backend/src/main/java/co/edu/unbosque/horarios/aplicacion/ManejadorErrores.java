package co.edu.unbosque.horarios.aplicacion;

import co.edu.unbosque.horarios.aplicacion.dto.Dto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.util.List;

/** Convierte las excepciones en la forma de error del contrato { codigo, mensaje, detalles }. */
@RestControllerAdvice
public class ManejadorErrores {

    private static final Logger LOG = LoggerFactory.getLogger(ManejadorErrores.class);

    @ExceptionHandler(ExcepcionNegocio.class)
    public ResponseEntity<Dto.Error> negocio(ExcepcionNegocio e) {
        return ResponseEntity.status(e.getEstado()).body(new Dto.Error(e.getCodigo(), e.getMessage(), e.getDetalles()));
    }

    @ExceptionHandler(DuplicateKeyException.class)
    public ResponseEntity<Dto.Error> duplicado(DuplicateKeyException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new Dto.Error("RESTRICCION_BASE_DATOS",
                "La base de datos rechazó la operación porque generaría un choque de docente o de aula",
                List.of("RD-01 o RD-02 protegidas por las restricciones UNIQUE de la tabla asignacion")));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Dto.Error> validacion(MethodArgumentNotValidException e) {
        List<String> detalles = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + " " + f.getDefaultMessage()).toList();
        return ResponseEntity.badRequest().body(new Dto.Error("SOLICITUD_INVALIDA", "La solicitud tiene campos inválidos", detalles));
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<Dto.Error> archivoFaltante(MissingServletRequestPartException e) {
        return ResponseEntity.badRequest().body(new Dto.Error("ARCHIVO_FALTANTE",
                "Falta el archivo " + e.getRequestPartName() + ". Se necesitan docentes, aulas, cursos y grupos", List.of()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Dto.Error> tamano(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(new Dto.Error("ARCHIVO_GRANDE",
                "Los archivos superan el tamaño máximo permitido", List.of()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Dto.Error> inesperado(Exception e) {
        LOG.error("Error inesperado", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new Dto.Error("ERROR_INTERNO",
                "Ocurrió un error inesperado. Revise el registro del servidor", List.of()));
    }
}
