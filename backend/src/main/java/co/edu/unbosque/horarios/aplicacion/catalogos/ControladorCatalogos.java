package co.edu.unbosque.horarios.aplicacion.catalogos;

import co.edu.unbosque.horarios.aplicacion.catalogos.DtoCatalogos.AulaGestion;
import co.edu.unbosque.horarios.aplicacion.catalogos.DtoCatalogos.DocenteGestion;
import co.edu.unbosque.horarios.aplicacion.catalogos.DtoCatalogos.GrupoGestion;
import co.edu.unbosque.horarios.aplicacion.catalogos.DtoCatalogos.MateriaGestion;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** API REST de catálogos del perfil ADMIN (RF-10). Sin lógica, delega en ServicioCatalogos. */
@RestController
@RequestMapping("/api/admin")
public class ControladorCatalogos {

    private final ServicioCatalogos servicio;

    public ControladorCatalogos(ServicioCatalogos servicio) {
        this.servicio = servicio;
    }

    @GetMapping("/docentes") public List<DocenteGestion> docentes() { return servicio.docentes(); }
    @PostMapping("/docentes") public DocenteGestion crearDocente(@RequestBody DocenteGestion d) { return servicio.guardarDocente(d, null); }
    @PutMapping("/docentes/{id}") public DocenteGestion editarDocente(@PathVariable String id, @RequestBody DocenteGestion d) { return servicio.guardarDocente(d, id); }
    @DeleteMapping("/docentes/{id}") public ResponseEntity<Void> borrarDocente(@PathVariable String id) { servicio.borrarDocente(id); return ResponseEntity.noContent().build(); }

    @GetMapping("/aulas") public List<AulaGestion> aulas() { return servicio.aulas(); }
    @PostMapping("/aulas") public AulaGestion crearAula(@RequestBody AulaGestion a) { return servicio.guardarAula(a, null); }
    @PutMapping("/aulas/{id}") public AulaGestion editarAula(@PathVariable String id, @RequestBody AulaGestion a) { return servicio.guardarAula(a, id); }
    @DeleteMapping("/aulas/{id}") public ResponseEntity<Void> borrarAula(@PathVariable String id) { servicio.borrarAula(id); return ResponseEntity.noContent().build(); }

    @GetMapping("/materias") public List<MateriaGestion> materias() { return servicio.materias(); }
    @PostMapping("/materias") public MateriaGestion crearMateria(@RequestBody MateriaGestion m) { return servicio.guardarMateria(m, null); }
    @PutMapping("/materias/{id}") public MateriaGestion editarMateria(@PathVariable String id, @RequestBody MateriaGestion m) { return servicio.guardarMateria(m, id); }
    @DeleteMapping("/materias/{id}") public ResponseEntity<Void> borrarMateria(@PathVariable String id) { servicio.borrarMateria(id); return ResponseEntity.noContent().build(); }

    @GetMapping("/grupos") public List<GrupoGestion> grupos() { return servicio.grupos(); }
    @PostMapping("/grupos") public GrupoGestion crearGrupo(@RequestBody GrupoGestion g) { return servicio.guardarGrupo(g, null); }
    @PutMapping("/grupos/{id}") public GrupoGestion editarGrupo(@PathVariable String id, @RequestBody GrupoGestion g) { return servicio.guardarGrupo(g, id); }
    @DeleteMapping("/grupos/{id}") public ResponseEntity<Void> borrarGrupo(@PathVariable String id) { servicio.borrarGrupo(id); return ResponseEntity.noContent().build(); }
}
