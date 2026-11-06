// Documento 2. Anexos Técnicos (diagramas UML finales y modelo de datos).
// Las figuras se exportan desde docs/diagramas/*.puml con PlantUML (ver docs/diagramas/README.md).
const path = require('path');
const L = require('./lib');
const K = require('./comun');
const { P, H1, table, refs } = L;
const { DOCS, figuraAjustada: F } = K;
const DG = path.join(__dirname, '../../diagramas/');

// Área útil en pulgadas. Vertical 6,5 x 7,5 y horizontal 9 x 5,2 (descontando título y nota).
const V = (n, t, a, nota) => F(n, t, DG + a, 6.5, 7.3, nota);
const Hz = (n, t, a, nota) => F(n, t, DG + a, 9.0, 5.0, nota);

const portada = K.portada('Anexos Técnicos del Motor de Asignación Automática de Horarios de Clases',
  'Documento 2 de la Entrega Final del Módulo 3. Diagramas UML Finales y Modelo de Datos');

const intro = [
  H1('Introducción'),
  P('Este documento reúne los diagramas finales del sistema construido. Reemplaza al Documento de Anexos del Módulo 2 (Beltrán Zárate et al., 2026d) y conserva su numeración para que las citas del ' + DOCS.doc1 + ' y del ' + DOCS.doc3 + ' sigan siendo válidas. Cada diagrama se actualizó contra el código de la rama principal del repositorio. Los nombres de clases, métodos, tipos y tablas son los del código. Las fuentes en PlantUML están en la carpeta docs/diagramas.'),
  P('Frente al Módulo 2 hay tres cambios en el conjunto de diagramas. El diagrama de clases se dividió en dos figuras porque el sistema construido tiene una capa de aplicación con servicios, seguridad y repositorios que no cabía en una sola página. El diagrama de secuencia ahora sigue una generación real a través de la API con el token JWT. Se agregó el diagrama de despliegue en contenedores, que en el Módulo 2 estaba combinado con el de componentes. La Tabla 1 lista los artefactos. Al final del módulo se agregó la Figura A4 con el módulo de usuarios por perfil y el diagrama entidad relación y el de componentes incluyen sus cambios.'),
  ...table(1, 'Índice de artefactos', [1100, 5260, 3000], [
    ['Figura', 'Artefacto', 'Fuente PlantUML'],
    ['A1', 'Clases del núcleo del motor con tipos y patrón Strategy', 'clases_nucleo.puml'],
    ['A2', 'Clases de las entidades del dominio con tipos', 'clases_entidades.puml'],
    ['A3', 'Clases de las capas de aplicación, seguridad y persistencia', 'clases_aplicacion.puml'],
    ['A4', 'Clases del módulo de usuarios por perfil', 'clases_usuarios.puml'],
    ['B1', 'Actividades del algoritmo de asignación', 'actividades.puml'],
    ['C1', 'Secuencia de una generación a través de la API', 'secuencia.puml'],
    ['D1', 'Diagrama entidad relación final con 19 tablas', 'der.puml'],
    ['E1', 'Componentes por capa', 'componentes.puml'],
    ['E2', 'Despliegue en contenedores con Docker Compose', 'despliegue.puml'],
  ]),
];

const vertical1 = [
  H1('Anexo A. Diagramas de Clases'),
  P('El diagrama de clases se presenta en cuatro figuras. La Figura A1 muestra el núcleo del motor, que no depende de Spring. La Figura A2 muestra las entidades del dominio que el núcleo manipula. La Figura A3 muestra cómo las capas de aplicación, seguridad y persistencia envuelven al núcleo para la versión web. La Figura A4 muestra el módulo de usuarios por perfil que se agregó al final del Módulo 3 con la gestión de catálogos, las cuentas y el portal del docente. Todas las clases del núcleo y del dominio son finales e inmutables salvo EstadoHorario, que cambia durante el backtracking, y ConfiguracionParametros, que se llena desde la base de datos.'),
];

const horizontalA1 = [
  ...Hz('A1', 'Clases del núcleo del motor y patrón Strategy', 'clases_nucleo.png',
    'MotorAsignacion depende solo de la interfaz RestriccionDura. Los estereotipos local y no local indican qué devuelve esLocal. RestriccionMismoDiaRD09 existe solo para la prueba de modificabilidad y no está registrada en ConfiguracionMotor. Los registros (record) de Java se muestran con sus componentes.'),
];

const verticalA2 = [
  ...V('A2', 'Clases de las entidades del dominio', 'clases_entidades.png',
    'Un curso compone uno o más grupos y cada grupo compone entre una y cuatro sesiones (RD-07). La disponibilidad del docente es un BitSet indexado por la franja vigente.'),
];

const horizontalA3 = [
  ...Hz('A3', 'Clases de las capas de aplicación, seguridad y persistencia', 'clases_aplicacion.png',
    'Los controladores REST no tienen lógica y delegan en los servicios. ConfiguracionMotor es el único lugar donde se registran las reglas. Los repositorios usan JdbcTemplate con SQL explícito.'),
];

const horizontalA4 = [
  ...Hz('A4', 'Clases del módulo de usuarios por perfil', 'clases_usuarios.png',
    'ServicioCatalogos valida con las mismas reglas del cargador CSV y cada cambio borra los horarios generados. ServicioPortal busca el docente de la cuenta autenticada en la base, así un docente solo ve sus propios datos. El núcleo del motor no cambió.'),
];

const verticalB = [
  H1('Anexo B. Diagrama de Actividades del Algoritmo'),
  ...V('B1', 'Backtracking con la sesión más restringida primero y diagnóstico de conflictos', 'actividades.png',
    'La rama de la derecha responde qué hace el sistema cuando se agotan las opciones de aula o de docente. El orden intercalado de franjas reparte las sesiones de un grupo en días distintos sin agregar una regla.'),
];

const horizontalC = [
  H1('Anexo C. Diagrama de Secuencia'),
  ...Hz('C1', 'Generación de un horario a través de la API', 'secuencia.png',
    'El filtro rechaza la petición con 401 si el token falta, está alterado o venció. ServicioHorarios crea un MotorAsignacion nuevo en cada generación con la lista de reglas que recibe de ConfiguracionMotor.'),
];

const horizontalD = [
  H1('Anexo D. Modelo de Datos'),
  ...Hz('D1', 'Diagrama entidad relación final', 'der.png',
    'Generado desde backend/src/main/resources/db/migration/V1__esquema.sql con los cambios de V3__usuarios_y_publicacion.sql. Una cuenta DOCENTE queda ligada a un docente por id_docente y la columna publicado marca la única ejecución que ven los docentes. Notación de pata de gallo. El punto marca columnas obligatorias. Las dos restricciones UNIQUE de asignacion protegen RD-01 y RD-02 en la base de datos.'),
];

const verticalD2 = [
  P('El modelo tiene 19 tablas en tercera forma normal. Frente al Módulo 2 cambió la forma de guardar el tiempo. La disponibilidad del docente y las asignaciones se guardan por día y hora de inicio y no por índice de franja. Así un cambio de la grilla en la pantalla de parámetros no deja datos que apunten a franjas que ya no existen. Por la misma razón las restricciones UNIQUE de asignacion quedaron sobre ejecución, docente, día y hora y sobre ejecución, aula, día y hora. El diccionario de datos completo de cada tabla está en el ' + DOCS.doc3 + '.'),
  H1('Anexo E. Diagramas de Componentes y Despliegue'),
  ...V('E1', 'Componentes por capa', 'componentes.png',
    'El núcleo corre en memoria dentro del backend. La persistencia lee los CSV una vez, guarda cada ejecución en PostgreSQL y Flyway crea el esquema al arrancar.'),
  ...V('E2', 'Despliegue en contenedores', 'despliegue.png',
    'Los tres contenedores se levantan con docker compose up --build. El orden de arranque lo controlan las verificaciones de salud de cada servicio.'),
  H1('Referencias'),
  ...refs([K.REF_EQUIPO_M2_ANEXOS]),
];

K.guardar([
  { children: [...portada, ...intro, ...vertical1] },
  { children: [...horizontalA1], horizontal: true },
  { children: verticalA2 },
  { children: [...horizontalA3], horizontal: true },
  { children: [...horizontalA4], horizontal: true },
  { children: verticalB },
  { children: horizontalC, horizontal: true },
  { children: horizontalD, horizontal: true },
  { children: verticalD2 },
], 'Anexos Técnicos', process.argv[2] || 'PN2_Grupo5_Doc2_Anexos.docx');
