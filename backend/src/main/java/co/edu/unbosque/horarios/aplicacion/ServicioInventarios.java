package co.edu.unbosque.horarios.aplicacion;

import co.edu.unbosque.horarios.aplicacion.dto.Dto;
import co.edu.unbosque.horarios.configuracion.ConfiguracionParametros;
import co.edu.unbosque.horarios.datos.ConjuntoDatos;
import co.edu.unbosque.horarios.persistencia.CargadorInventariosCSV;
import co.edu.unbosque.horarios.persistencia.ConstructorDominio;
import co.edu.unbosque.horarios.persistencia.InventarioCargado;
import co.edu.unbosque.horarios.persistencia.RepositorioInventarios;
import co.edu.unbosque.horarios.persistencia.RepositorioParametros;
import co.edu.unbosque.horarios.validacion.ValidadorEntrada;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/** Carga de los cuatro inventarios y validación previa de los grupos (RF-01 a RF-05). */
@Service
public class ServicioInventarios {

    private final RepositorioInventarios inventarios;
    private final RepositorioParametros parametros;
    private final ValidadorEntrada validador;
    private volatile List<Dto.Rechazo> ultimosRechazos = List.of();

    public ServicioInventarios(RepositorioInventarios inventarios, RepositorioParametros parametros,
                               ValidadorEntrada validador) {
        this.inventarios = inventarios;
        this.parametros = parametros;
        this.validador = validador;
    }

    @Transactional
    public Dto.ResumenCarga cargar(MultipartFile docentes, MultipartFile aulas, MultipartFile cursos, MultipartFile grupos) {
        ConfiguracionParametros cfg = parametros.cargar();
        InventarioCargado inv;
        try (InputStream d = docentes.getInputStream(); InputStream a = aulas.getInputStream();
             InputStream c = cursos.getInputStream(); InputStream g = grupos.getInputStream()) {
            inv = new CargadorInventariosCSV(cfg).cargar(d, a, c, g);
        } catch (IOException e) {
            throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "ARCHIVO_ILEGIBLE", "No se pudieron leer los archivos", List.of(e.getMessage()));
        }
        List<Dto.Rechazo> rechazos = inv.rechazos().stream()
                .map(r -> new Dto.Rechazo(r.archivo(), r.fila(), r.codigo(), r.motivo())).toList();
        List<String> vacios = new ArrayList<>();
        if (inv.docentes().isEmpty()) vacios.add("docentes.csv");
        if (inv.aulas().isEmpty()) vacios.add("aulas.csv");
        if (inv.cursos().isEmpty()) vacios.add("cursos.csv");
        if (inv.grupos().isEmpty()) vacios.add("grupos.csv");
        if (!vacios.isEmpty()) {
            List<String> detalles = new ArrayList<>();
            detalles.add("Sin registros válidos en " + String.join(", ", vacios));
            rechazos.stream().limit(20).forEach(r -> detalles.add(r.archivo() + " fila " + r.fila() + " [" + r.codigo() + "] " + r.motivo()));
            throw new ExcepcionNegocio(HttpStatus.BAD_REQUEST, "CARGA_INCOMPLETA",
                    "La carga no se guardó porque algún archivo quedó sin registros válidos", detalles);
        }
        inventarios.reemplazar(inv);
        ultimosRechazos = rechazos;
        return resumen(inv, cfg);
    }

    public Dto.ResumenCarga resumen() {
        return resumen(inventarios.cargar(), parametros.cargar());
    }

    private Dto.ResumenCarga resumen(InventarioCargado inv, ConfiguracionParametros cfg) {
        RepositorioInventarios.Conteos n = inventarios.contar();
        ConjuntoDatos datos = ConstructorDominio.construir(inv, cfg.generarFranjasValidas());
        List<Dto.Hallazgo> hallazgos = validador.validarGrupos(datos.grupos(), cfg).stream()
                .map(h -> new Dto.Hallazgo(h.codigoRegla(), h.idGrupo(), h.mensaje())).toList();
        return new Dto.ResumenCarga(new Dto.Cargados(n.docentes(), n.aulas(), n.cursos(), n.grupos(), n.sesiones()),
                ultimosRechazos, hallazgos);
    }
}
