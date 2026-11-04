// Documento 2. Anexos Técnicos (diagramas UML finales y modelo de datos).
// Las figuras se exportan desde docs/diagramas/*.puml. Se actualizan al código real en el punto P1.
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const K = require('./comun');
const { P, H1, H2, PB, figure, table, refs } = L;
const { PEND, DOCS } = K;
const DG = path.join(__dirname, '../../diagramas/');

// Inserta la figura si el PNG existe. Si no, deja el marcador visible.
const fig = (n, titulo, archivo, ancho, nota) => fs.existsSync(DG + archivo)
  ? figure(n, titulo, DG + archivo, ancho, { note: nota })
  : [PEND(`Figura ${n} ${titulo} (${archivo})`)];

const portada = K.portada('Anexos Técnicos del Motor de Asignación Automática de Horarios de Clases',
  'Documento 2 de la Entrega Final del Módulo 3. Diagramas UML Finales y Modelo de Datos');

const intro = [
  H1('Introducción'),
  P('Este documento reúne los diagramas finales del sistema construido. Reemplaza al Documento de Anexos del Módulo 2 (Beltrán Zárate et al., 2026d) y conserva su numeración para que las citas del ' + DOCS.doc1 + ' y del ' + DOCS.doc3 + ' sigan siendo válidas. Cada diagrama se actualizó contra el código del repositorio y sus fuentes en PlantUML están en la carpeta docs/diagramas.'),
  ...table(1, 'Índice de artefactos', [1200, 5000, 3160], [
    ['Figura', 'Artefacto', 'Se cita en'],
    ['A1', 'Clases del núcleo, capas y patrón Strategy con tipos', 'Documento 1 y Documento 3'],
    ['A2', 'Clases de las entidades del dominio con tipos', 'Documento 3'],
    ['B1', 'Actividades del algoritmo de asignación', 'Documento 1 y Documento 3'],
    ['C1', 'Secuencia de una generación a través de la API', 'Documento 3'],
    ['D1', 'Diagrama entidad relación final', 'Documento 1 y Documento 3'],
    ['E1', 'Componentes por capa', 'Documento 1 y Documento 3'],
    ['E2', 'Despliegue en contenedores', 'Documento 1'],
  ]),
];

const cuerpo = [
  H1('Anexo A. Diagramas de Clases'),
  ...fig('A1', 'Clases del núcleo, capas y patrón Strategy', 'clases_nucleo.png', 6.5, 'Los paquetes dominio, configuracion, restricciones, validacion y motor no dependen de Spring.'),
  PEND('actualizar clases_nucleo.puml con ServicioHorarios, ConfiguracionMotor, RD-10 y los repositorios JDBC (punto P1)'),
  ...fig('A2', 'Clases de las entidades del dominio', 'clases_entidades.png', 6.0, 'Un curso compone uno o más grupos y cada grupo compone entre una y cuatro sesiones (RD-07).'),
  PB(),
  H1('Anexo B. Diagrama de Actividades del Algoritmo'),
  ...fig('B1', 'Backtracking con la sesión más restringida primero y diagnóstico de conflictos', 'actividades.png', 6.0, 'Incluye el orden intercalado de franjas de OrdenFranjas.'),
  PEND('actualizar actividades.puml con el orden intercalado de franjas y RD-10 (punto P1)'),
  PB(),
  H1('Anexo C. Diagrama de Secuencia'),
  ...fig('C1', 'Generación de un horario a través de la API', 'secuencia.png', 6.5, 'Recorre ControladorHorarios, ServicioHorarios, los repositorios y MotorAsignacion.'),
  PEND('rehacer secuencia.puml desde POST /api/horarios/generar con FiltroJwt y ServicioHorarios (punto P1)'),
  PB(),
  H1('Anexo D. Modelo de Datos'),
  ...fig('D1', 'Diagrama entidad relación final', 'der.png', 6.5, 'Corresponde a backend/src/main/resources/db/migration/V1__esquema.sql. Las dos restricciones UNIQUE de asignacion protegen RD-01 y RD-02.'),
  PEND('regenerar der.puml desde V1__esquema.sql con las 18 tablas (punto P1)'),
  P('El diccionario de datos completo de cada tabla está en el ' + DOCS.doc3 + '.'),
  PB(),
  H1('Anexo E. Diagramas de Componentes y Despliegue'),
  ...fig('E1', 'Componentes por capa', 'componentes.png', 6.0, 'La persistencia usa JdbcTemplate y Flyway.'),
  PEND('actualizar componentes.puml con JWT, ServicioHorarios y JDBC (punto P1)'),
  ...fig('E2', 'Despliegue en contenedores', 'despliegue.png', 6.0, 'nginx con Angular en el puerto 4200, backend en el 8080 y PostgreSQL en el 5432, levantados con docker compose.'),
];

const referencias = [
  H1('Referencias'),
  ...refs([K.REF_EQUIPO_M2_ANEXOS]),
];

K.guardar([...portada, ...intro, ...cuerpo, ...referencias], 'Anexos Técnicos', process.argv[2] || 'PN2_Grupo5_Doc2_Anexos.docx');
