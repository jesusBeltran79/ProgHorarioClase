const fs = require('fs');
const L = require('./lib');
const { d, P, H1, H2, C, PB, table, figure, code, header } = L;
const path = require('path');
const RAIZ = path.resolve(__dirname, '../../..');
const DG = path.join(RAIZ, 'docs/diagramas/');
const RES = path.join(RAIZ, 'motor-horarios/resultados/');

const LETTER = { width: 12240, height: 15840 };
const LAND = { width: 12240, height: 15840, orientation: d.PageOrientation.LANDSCAPE };
const TABLOID = { width: 15840, height: 24480, orientation: d.PageOrientation.LANDSCAPE };
const M = { top: 1080, bottom: 1080, left: 1080, right: 1080 };
const sec = (size, children) => ({ properties: { page: { size, margin: M } }, headers: { default: header() }, children });
const S = (t) => P(t, { line: 360 });

const portada = [
  C('', { before: 2400 }),
  C('<b>Documento de Anexos del Diseño de Software del Motor de Asignación Automática de Horarios de Clases</b>'),
  C('Artefactos de diseño del Entregable 2.3 del Módulo 2'),
  C(''),
  C('Jesús David Beltrán Zárate'), C('Juan Sebastián Albarracín Isaza'), C('Daniel Felipe Delgadillo Sepúlveda'), C('Martín Daniel Porto Gutiérrez'),
  C(''),
  C('Programa de Ingeniería de Sistemas, Facultad de Ingeniería, Universidad El Bosque'),
  C('Proyecto Núcleo 2 (15319), 2026-2, Grupo 5'),
  C('Ing. Samuel Galindo Pinzón'),
  C('22 de octubre de 2026'),
  PB(),
  H1('Índice de Artefactos'),
  S('Cada artefacto tiene título y numeración y se cita desde la sección del Documento Maestro que lo explica. Las fuentes editables de todos los diagramas están en el repositorio del equipo en la carpeta docs/diagramas con extensión .puml y se abren con PlantUML.'),
  ...table(1, 'Artefactos incluidos en este documento', [1300, 4280, 3500], [
    ['Anexo', 'Artefacto', 'Se cita en el Documento Maestro'],
    ['A', 'Figura A1. Clases del núcleo, capas y patrón Strategy\nFigura A2. Clases de las entidades del dominio', 'Secciones 6 y 7'],
    ['B', 'Figura B1. Diagrama de actividades del backtracking y de la resolución de conflictos', 'Sección 4'],
    ['C', 'Figura C1. Diagrama de secuencia de un intento de asignación que genera un choque', 'Secciones 4 y 8'],
    ['D', 'Figura D1. Diagrama entidad relación normalizado\nTablas D1 y D2. Diccionario de datos y formato de los archivos', 'Sección 10'],
    ['E', 'Figura E1. Diagrama de componentes y despliegue', 'Sección 3'],
    ['F', 'Evidencia del prototipo del motor y forma de reproducirla', 'Secciones 4 y 5'],
  ], { size: 20 }),
];

const anexoA1 = [
  H1('Anexo A. Diagramas de Clases'),
  ...figure('A1', 'Clases del núcleo, capas y patrón Strategy', DG + 'clases_nucleo.png', 15.3, { note: 'El diagrama se lee de izquierda a derecha siguiendo las capas. El cuadro rojo marca atributos y métodos privados y el círculo verde marca los públicos. El rombo blanco es agregación, el rombo negro es composición, la flecha punteada con triángulo es realización de interfaz y la flecha punteada abierta es dependencia. Las entidades aparecen resumidas y su detalle está en la Figura A2.' }),
];
const anexoA2 = [
  ...figure('A2', 'Clases de las entidades del dominio', DG + 'clases_entidades.png', 7.3, { note: 'Un curso compone uno o más grupos y cada grupo compone entre una y cuatro sesiones (RD-07). Una asignación une una sesión con un docente, un aula y una franja.' }),
  S('El diagrama se partió en dos para que se pueda leer sin ampliar. La Figura A1 muestra cómo se organiza el sistema y dónde vive el patrón Strategy. MotorAsignacion agrega una lista de RestriccionDura y cada restricción concreta realiza esa interfaz. ValidadorEntrada sigue la misma idea con ReglaValidacionEntrada. ControladorHorarios agrega los cuatro servicios y es el único que los conoce a todos. La Figura A2 muestra los datos del problema. Las clases son inmutables y sus atributos son privados. El atributo franjasDisponibles de Docente es un BitSet de 32 posiciones y por eso consultar la disponibilidad cuesta lo mismo sin importar cuántas franjas tenga libres el docente.'),
];

const anexoB = [
  H1('Anexo B. Diagrama de Actividades del Algoritmo'),
  ...figure('B1', 'Backtracking con la sesión más restringida primero y resolución de conflictos', DG + 'actividades.png', 7.3, { note: 'La rama de la derecha responde qué hace el sistema cuando se agotan las opciones de aula o de docente.' }),
  S('El flujo empieza con el conteo del dominio de cada sesión y el orden de menor a mayor. Dentro del ciclo hay tres salidas posibles. Si una tupla pasa todas las restricciones el motor la confirma y avanza a la siguiente sesión. Si se ubicaron todas las sesiones el horario está completo y se habilita la exportación. Si la sesión actual se queda sin tuplas el motor retrocede a la sesión anterior, que continúa con su siguiente opción. Cuando no hay a dónde retroceder o se supera el tiempo límite el motor no entrega un error genérico. Recupera la mejor asignación parcial, diagnostica cada sesión pendiente con todas las restricciones y deja el horario marcado como pendiente de resolución para que el coordinador decida.'),
];

const anexoC = [
  H1('Anexo C. Diagrama de Secuencia'),
  ...figure('C1', 'Intento de asignación que genera un choque de docente', DG + 'secuencia.png', 8.0, { note: 'Caso del Dr. Gómez de la Sección 4 del Documento Maestro. La franja 7 es martes de 09:00 a 11:00.' }),
  S('Se eligió este caso de uso porque es el más crítico del sistema. Muestra en un solo recorrido la validación previa, la delegación del motor en las estrategias, el uso de EstadoHorario para detectar el choque, el registro del código RD-01 y lo que pasa cuando ya no quedan opciones. Los mensajes 6 a 12 son el núcleo del patrón Strategy en ejecución. Los mensajes 20 a 22 conectan el diseño con la pantalla de la Figura 3 del Documento Maestro.'),
];

const dic = [
  ['Tabla', 'Columna', 'Tipo', 'Nulo', 'Clave', 'Descripción'],
  ['franja_horaria', 'id_franja', 'SMALLINT', 'No', 'PK', 'Índice de 0 a 31 en la grilla vigente'],
  ['', 'dia', 'VARCHAR(10)', 'No', 'CHECK', 'LUNES a SABADO'],
  ['', 'hora_inicio, hora_fin', 'TIME', 'No', 'UNIQUE con dia', 'Bloque de dos horas'],
  ['docente', 'id_docente', 'VARCHAR(10)', 'No', 'PK', 'Identificador institucional'],
  ['', 'nombre', 'VARCHAR(80)', 'No', '', 'Nombre para mostrar y exportar'],
  ['', 'dedicacion, escalafon', 'VARCHAR(20), VARCHAR(30)', 'Sí', '', 'Datos informativos fuera del modelo de restricciones (S-05)'],
  ['disponibilidad_docente', 'id_docente, id_franja', 'VARCHAR(10), SMALLINT', 'No', 'PK y FK', 'Una fila por franja libre del docente (RD-04)'],
  ['aula', 'id_aula', 'VARCHAR(10)', 'No', 'PK', 'Código del aula'],
  ['', 'capacidad', 'SMALLINT', 'No', 'CHECK mayor que 0', 'Puestos disponibles (RD-06)'],
  ['caracteristica', 'id_caracteristica', 'VARCHAR(20)', 'No', 'PK', 'COMPUTADORES o SILLAS_MOVILES'],
  ['', 'descripcion', 'VARCHAR(60)', 'No', '', 'Texto para la interfaz'],
  ['aula_caracteristica', 'id_aula, id_caracteristica', 'VARCHAR(10), VARCHAR(20)', 'No', 'PK y FK', 'Características que tiene cada aula (RD-05)'],
  ['curso', 'id_curso', 'VARCHAR(10)', 'No', 'PK', 'Código de la asignatura'],
  ['', 'nombre', 'VARCHAR(80)', 'No', '', 'Nombre de la asignatura'],
  ['', 'num_sesiones_semanales', 'SMALLINT', 'No', 'CHECK 1 a 4', 'Sesiones de dos horas por semana (RD-07)'],
  ['curso_requisito_aula', 'id_curso, id_caracteristica', 'VARCHAR(10), VARCHAR(20)', 'No', 'PK y FK', 'Características que exige el curso (RD-05)'],
  ['habilitacion_docente', 'id_curso, id_docente', 'VARCHAR(10), VARCHAR(10)', 'No', 'PK y FK', 'Docentes que pueden dictar el curso. Sin filas significa todos (S-06)'],
  ['grupo', 'id_grupo', 'VARCHAR(15)', 'No', 'PK', 'Sección del curso'],
  ['', 'id_curso', 'VARCHAR(10)', 'No', 'FK', 'Curso al que pertenece'],
  ['', 'matriculados', 'SMALLINT', 'No', 'CHECK mayor o igual a 0', 'Dato fijo de entrada (S-07)'],
  ['sesion', 'id_sesion', 'VARCHAR(20)', 'No', 'PK', 'Sesión semanal del grupo'],
  ['', 'id_grupo, numero_sesion', 'VARCHAR(15), SMALLINT', 'No', 'FK y UNIQUE', 'Posición de la sesión dentro del grupo'],
  ['usuario', 'id_usuario', 'INTEGER', 'No', 'PK', 'Usuario del sistema'],
  ['', 'nombre_usuario', 'VARCHAR(40)', 'No', 'UNIQUE', 'Nombre de acceso'],
  ['', 'hash_contrasena', 'CHAR(60)', 'No', '', 'Hash bcrypt, nunca la contraseña en claro (RNF-06)'],
  ['', 'rol', 'VARCHAR(15)', 'No', 'CHECK ADMIN', 'Perfil autorizado para generar'],
  ['ejecucion_horario', 'id_ejecucion', 'INTEGER', 'No', 'PK', 'Corrida del motor'],
  ['', 'id_usuario', 'INTEGER', 'No', 'FK', 'Quién la ejecutó'],
  ['', 'fecha_hora', 'TIMESTAMP', 'No', '', 'Momento de la corrida'],
  ['', 'estado', 'VARCHAR(10)', 'No', 'CHECK', 'COMPLETO o PARCIAL (RD-08)'],
  ['', 'nodos_explorados, duracion_ms', 'BIGINT, INTEGER', 'No', '', 'Métricas para RNF-01 y RNF-02'],
  ['asignacion', 'id_ejecucion, id_sesion', 'INTEGER, VARCHAR(20)', 'No', 'PK y FK', 'Una tupla por sesión y corrida'],
  ['', 'id_docente, id_aula, id_franja', 'VARCHAR(10), VARCHAR(10), SMALLINT', 'No', 'FK y dos UNIQUE', 'UNIQUE por docente y franja (RD-01) y por aula y franja (RD-02)'],
  ['restriccion', 'codigo', 'VARCHAR(6)', 'No', 'PK', 'RD-01 a RD-08, RV-01 y RV-02'],
  ['', 'tipo, descripcion', 'VARCHAR(10), VARCHAR(120)', 'No', 'CHECK en tipo', 'DURA o VALIDACION'],
  ['conflicto', 'id_conflicto', 'INTEGER', 'No', 'PK', 'Sesión que quedó sin lugar'],
  ['', 'id_ejecucion, id_sesion', 'INTEGER, VARCHAR(20)', 'No', 'FK y UNIQUE', 'Corrida y sesión afectadas (RF-07)'],
  ['conflicto_restriccion', 'id_conflicto, codigo', 'INTEGER, VARCHAR(6)', 'No', 'PK y FK', 'Causa del conflicto (RNF-04)'],
  ['', 'tuplas_bloqueadas', 'INTEGER', 'No', 'CHECK mayor que 0', 'Cuántas tuplas bloquea esa causa'],
  ['hallazgo_validacion', 'id_ejecucion, id_grupo, codigo', 'INTEGER, VARCHAR(15), VARCHAR(6)', 'No', 'PK y FK', 'Resultado de RV-01 o RV-02 (RF-05)'],
  ['', 'mensaje', 'VARCHAR(200)', 'No', '', 'Texto mostrado al coordinador'],
  ['parametro_configuracion', 'clave', 'VARCHAR(30)', 'No', 'PK', 'CAP_MAX, TOL, MIN_CIERRE y demás (RF-08)'],
  ['', 'valor, tipo_dato', 'VARCHAR(30), VARCHAR(10)', 'No', 'CHECK en tipo_dato', 'Valor vigente y cómo interpretarlo'],
];

const anexoD1 = [
  H1('Anexo D. Modelo de Datos'),
  ...figure('D1', 'Diagrama entidad relación normalizado', DG + 'der.png', 15.3, { note: 'Notación de pata de gallo. El punto negro marca columnas obligatorias. Las dos restricciones UNIQUE de asignacion protegen RD-01 y RD-02 desde la base de datos.' }),
];
const anexoD2 = [
  S('El modelo está en tercera forma normal. Las listas que en las clases son conjuntos, como las características de un aula o las franjas libres de un docente, se volvieron tablas intermedias con clave compuesta. Así ninguna columna guarda listas y cada dato se escribe en un solo lugar. La Tabla D1 es el diccionario de datos y la Tabla D2 muestra cómo cada archivo de entrada se proyecta sobre el modelo.'),
  ...table('D1', 'Diccionario de datos', [2000, 2150, 1900, 650, 1250, 2130], dic, { size: 16 }),
  ...table('D2', 'Formato de los archivos de entrada y salida', [2100, 4180, 3800], [
    ['Archivo', 'Columnas', 'Ejemplo de fila'],
    ['docentes.csv (RF-01)', 'id_docente, nombre, dedicacion, escalafon, disponibilidad', 'D1, Dr. Gómez, MEDIO, ASOCIADO, MAR 07:00;MAR 09:00;MIE 09:00'],
    ['aulas.csv (RF-02)', 'id_aula, capacidad, caracteristicas', 'A301, 45, COMPUTADORES'],
    ['cursos.csv (RF-03)', 'id_curso, nombre, num_sesiones, requisitos, docentes_habilitados', 'CAL2, Cálculo II, 2, , D1'],
    ['grupos.csv (RF-04)', 'id_grupo, id_curso, matriculados', 'CAL2-G2, CAL2, 35'],
    ['horario.csv (RF-09)', 'curso, grupo, sesion, docente, aula, dia, hora_inicio, hora_fin', 'Cálculo II, CAL2-G2, 1, Dr. Gómez, A204, MIERCOLES, 09:00, 11:00'],
  ], { size: 17, note: 'La disponibilidad se escribe como pares de día y hora separados por punto y coma. CargadorInventariosCSV los traduce al índice de franja vigente. Una columna vacía de docentes habilitados significa que todos pueden dictar el curso (S-06). El archivo exportado no incluye datos personales de estudiantes (RNF-06).' }),
];

const anexoE = [
  H1('Anexo E. Diagrama de Componentes y Despliegue'),
  ...figure('E1', 'Componentes por capa y nodos de ejecución', DG + 'componentes.png', 7.2, { note: 'El motor, las restricciones y EstadoHorario corren en memoria dentro del servidor. Los archivos se leen una vez y el horario se escribe al final.' }),
  S('Este diagrama es el soporte visual del análisis de escalabilidad y modificabilidad del Documento Maestro. Deja ver que ningún componente de persistencia está conectado al motor durante la búsqueda. También muestra que la interfaz web solo habla con la API REST, así que cambiar la presentación no toca el dominio. Las restricciones aparecen como un componente propio porque son el punto de extensión del sistema.'),
];

// ---------- Anexo F ----------
const csv = require('fs').readFileSync;
function resumen(file) {
  const rows = csv(file, 'utf8').trim().split('\n').slice(1).map(l => l.split(','));
  const g = {};
  for (const r of rows) { const k = r[0] + '|' + r[1]; (g[k] = g[k] || []).push(r); }
  return Object.entries(g).map(([k, rs]) => {
    const [esc, varr] = k.split('|');
    const ms = rs.map(r => +r[6]), pre = rs.map(r => +r[7]), nodos = rs.map(r => +r[8]), comp = rs.map(r => +r[10]), ev = rs.map(r => +r[9]);
    const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
    const fmt = n => Math.round(n).toLocaleString('es-CO');
    const v = varr.replace('Mas restringida + lista', 'Más restringida con lista').replace('Mas restringida + indice', 'Más restringida con mapas').replace('Orden ingenuo + lista', 'Orden ingenuo con lista');
    return [esc, v, ms.join(' · '), fmt(avg(nodos)), fmt(avg(ev)), fmt(avg(comp)), String(rs.filter(r => r[5] === 'true').length)];
  });
}
const hdr = ['Escala', 'Variante', 'Tiempo de las 5 corridas (ms)', 'Nodos prom.', 'Evaluaciones del conteo inicial', 'Comparaciones de choque prom.', 'Corridas en el límite'];
const W = [800, 1900, 2300, 1300, 1300, 1400, 1080];
const demo = fs.readFileSync(RES + 'demostracion_conflicto.txt', 'utf8').trim();
const cambio = fs.readFileSync(RES + 'prueba_de_cambio.txt', 'utf8').trim();

const anexoF = [
  H1('Anexo F. Evidencia del Prototipo del Motor'),
  S('El código del motor está en la carpeta motor-horarios del repositorio. Implementa las clases de las Figuras A1 y A2 en Java 21 sin dependencias externas. Incluye tres programas. MedicionEscalabilidad genera los conjuntos de datos con semillas fijas y escribe un CSV por perfil. DemostracionConflicto ejecuta el caso del Dr. Gómez. PruebaDeCambio aplica los tres cambios de regla de la Sección 5.2 del Documento Maestro. Las mediciones se tomaron en una máquina virtual con 2 núcleos Intel Xeon a 2,1 GHz y OpenJDK 21.'),
  ...table('F1', 'Resultados por corrida con el perfil holgado', W, [hdr, ...resumen(RES + 'mediciones_1x_2x_3x.csv')], { size: 16 }),
  ...table('F2', 'Resultados por corrida con el perfil exigente', W, [hdr, ...resumen(RES + 'mediciones_exigente.csv')], { size: 16, note: 'En el perfil exigente la segunda corrida de 1x con orden ingenuo exploró 488.428.098 nodos y se detuvo al llegar a los 15 segundos. La misma instancia con la heurística terminó en 3 ms. Las semillas usadas fueron 11, 22, 33, 44 y 55.' }),
  H2('Salida de la Demostración del Caso Sobrerrestringido'),
  ...code(demo),
  H2('Salida de la Prueba de Cambio'),
  ...code(cambio),
  H2('Cómo Reproducir las Mediciones'),
  S('Desde la carpeta motor-horarios se compila y se ejecuta con los comandos siguientes. El primer argumento es el límite de tiempo en milisegundos, el segundo es el archivo de salida y el tercero activa el perfil exigente.'),
  ...code(`javac -d out $(find src -name "*.java")
java -Xss64m -cp out co.edu.unbosque.horarios.app.MedicionEscalabilidad 15000 resultados/mediciones_1x_2x_3x.csv
java -Xss64m -cp out co.edu.unbosque.horarios.app.MedicionEscalabilidad 15000 resultados/mediciones_exigente.csv exigente
java -cp out co.edu.unbosque.horarios.app.DemostracionConflicto
java -cp out co.edu.unbosque.horarios.app.PruebaDeCambio`),
  S('Los tiempos absolutos cambian de un equipo a otro. Los nodos explorados, las evaluaciones del conteo inicial y las comparaciones de choque no cambian porque dependen solo de los datos y del algoritmo.'),
];

const doc = new d.Document({
  creator: 'Grupo 5', title: 'Documento de Anexos de Diseño de Software',
  styles: { default: { document: { run: { font: L.FONT, size: 24 } } } },
  sections: [
    sec(LETTER, [...portada]),
    sec(TABLOID, anexoA1),
    sec(LETTER, anexoA2),
    sec(LETTER, anexoB),
    sec(LAND, anexoC),
    sec(TABLOID, anexoD1),
    sec(LETTER, anexoD2),
    sec(LAND, anexoE),
    sec(LETTER, anexoF),
  ],
});
d.Packer.toBuffer(doc).then(b => { fs.writeFileSync(process.argv[2] || 'anexos.docx', b); console.log('ok'); });
