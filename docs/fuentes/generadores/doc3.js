// Documento 3. Manual Técnico (arquitectura, diccionario de datos, despliegue, operación y mantenimiento).
const L = require('./lib');
const K = require('./comun');
const { P, H1, H2, H3, PB, table, code, refs } = L;
const { PEND, DOCS } = K;

const portada = K.portada('Manual Técnico del Motor de Asignación Automática de Horarios de Clases',
  'Documento 3 de la Entrega Final del Módulo 3. Arquitectura, Despliegue, Operación y Mantenimiento');

const intro = [
  H1('Introducción'),
  P('Este manual explica cómo está construido el motor de horarios del Grupo 5 y cómo se instala, se opera y se mantiene. Está escrito para quien reciba el sistema después del equipo y tenga que levantarlo desde cero o cambiar una regla. Parte del diseño aprobado en el Módulo 2 (Beltrán Zárate et al., 2026c, 2026d) en su versión construida. No repite la justificación del diseño. Esa justificación está en el ' + DOCS.doc1 + '. Los diagramas UML y el diagrama entidad relación están en el ' + DOCS.doc2 + '. La operación desde la interfaz web para el administrador está en el ' + DOCS.doc4 + '.'),
  P('Todos los nombres de clases, paquetes, rutas y tablas de este documento se tomaron del código del repositorio. Si un nombre de este manual no coincide con el código, manda el código y el manual debe corregirse.'),
];

const requisitos = [
  H1('Requisitos del Sistema'),
  P('El sistema corre en tres contenedores. Uno sirve la interfaz web, otro ejecuta el backend y el tercero guarda los datos. La Tabla 1 fija las versiones de cada pieza. Son las mismas que declaran el archivo <c>backend/pom.xml</c> y el acuerdo técnico del equipo en <c>CONTRATO_M3.md</c>.'),
  ...table(1, 'Versiones de lenguajes, frameworks y bases de datos', [2600, 2900, 3860], [
    ['Capa', 'Tecnología', 'Versión'],
    ['Lenguaje del backend', 'Java (Eclipse Temurin)', '21'],
    ['Framework del backend', 'Spring Boot con los módulos web, jdbc, security, validation y actuator', '3.3.5'],
    ['Migraciones de la base', 'Flyway (flyway-core y flyway-database-postgresql)', 'La que gestiona Spring Boot 3.3.5'],
    ['Tokens de sesión', 'JJWT (io.jsonwebtoken) api, impl y jackson', '0.12.6'],
    ['Base de datos', 'PostgreSQL', '16'],
    ['Base de pruebas y de respaldo', 'H2 en modo PostgreSQL', 'La que gestiona Spring Boot 3.3.5'],
    ['Construcción del backend', 'Apache Maven', '3.9 o superior'],
    ['Interfaz web', 'Angular con componentes standalone', '18.2'],
    ['Compilación de la interfaz', 'Node.js', '20 LTS'],
    ['Servidor de la interfaz', 'nginx', '1.27'],
    ['Contenedores', 'Docker Engine con Docker Compose v2', 'Compose v2'],
    ['Integración continua', 'GitHub Actions (ubuntu-latest)', 'No aplica'],
  ], { note: 'Las versiones exactas de las librerías que gestiona Spring Boot y el equipo donde se tomaron las mediciones quedan registrados en docs/evidencias/entorno.txt.' }),
  PEND('versiones exactas de Flyway, H2, Maven y Docker tomadas de docs/evidencias/entorno.txt'),
  P('Para instalar con contenedores basta un equipo con Docker Desktop o Docker Engine, 4 GB de memoria libre y unos 3 GB de disco para las imágenes. No hace falta instalar Java ni Node.js en el equipo porque las imágenes compilan todo por dentro. Para trabajar sin Docker sí se necesitan Java 21, Maven 3.9 y Node.js 20. El navegador del administrador puede ser cualquier versión reciente de Chrome, Edge o Firefox.'),
  P('El sistema usa tres puertos. La interfaz web responde en el 4200. El backend responde en el 8080. PostgreSQL escucha en el 5432 con la base <c>horarios</c>, el usuario <c>horarios</c> y la clave <c>horarios</c>. Si alguno de esos puertos ya está ocupado en el equipo hay que liberarlo antes de arrancar.'),
];

const arquitectura = [
  H1('Arquitectura del Motor'),
  H2('Capas y Paquetes'),
  P('El backend es un monolito modular en cuatro capas. La presentación es la interfaz web en Angular. La aplicación expone la API REST y coordina cada caso de uso. El dominio contiene el validador, el motor y las restricciones. La persistencia lee los archivos CSV, guarda los inventarios y el historial de ejecuciones y exporta el horario. La Figura E1 del ' + DOCS.doc2 + ' muestra los componentes y el nodo donde corre cada uno.'),
  P('Cada capa vive en un paquete de <c>co.edu.unbosque.horarios</c>. La Tabla 2 lista los paquetes y las clases principales de cada uno. La regla más importante de la estructura es que los paquetes del núcleo no importan Spring. Así el motor es el mismo que se midió en el Módulo 2 y se puede probar sin levantar la aplicación ni la base de datos.'),
  ...table(2, 'Paquetes del backend y responsabilidad de cada uno', [1900, 1300, 6160], [
    ['Paquete', 'Usa Spring', 'Clases principales y responsabilidad'],
    ['dominio', 'No', 'Docente, Aula, Curso, Grupo, Sesion, FranjaHoraria, Asignacion, DiaSemana y CaracteristicaAula. Entidades inmutables del problema en memoria'],
    ['configuracion', 'No', 'ConfiguracionParametros. Guarda los parámetros del semestre, genera las franjas válidas y calcula el umbral de RV-01'],
    ['restricciones', 'No', 'Interfaz RestriccionDura y sus estrategias RD-01, RD-02, RD-04, RD-05, RD-06 y RD-10. RestriccionMismoDiaRD09 existe solo para la prueba de modificabilidad'],
    ['validacion', 'No', 'ReglaValidacionEntrada, ReglaTopeMatriculadosRV01, ReglaCierreMinimoRV02, ValidadorEntrada y ReporteValidacion'],
    ['motor', 'No', 'MotorAsignacion, EstadoHorario, OrdenExploracion, OrdenFranjas, ReporteConflicto y ResultadoAsignacion'],
    ['datos', 'No', 'ConjuntoDatos y GeneradorDatosSinteticos para las mediciones con semilla fija'],
    ['persistencia', 'Sí', 'CargadorInventariosCSV, LectorCSV, ConstructorDominio, ExportadorHorarioCSV y los repositorios JDBC RepositorioInventarios, RepositorioParametros, RepositorioEjecuciones y RepositorioUsuarios'],
    ['aplicacion', 'Sí', 'ControladorInventarios, ControladorParametros, ControladorHorarios, sus servicios, ConfiguracionMotor, ManejadorErrores, ExcepcionNegocio y los DTO en dto.Dto'],
    ['seguridad', 'Sí', 'ConfiguracionSeguridad, FiltroJwt, ServicioJwt, ControladorAutenticacion e InicializadorDatos'],
    ['app', 'No', 'Programas de consola para medir y demostrar. MedicionEscalabilidad, PruebaEstres, PruebaDeCambio, DemostracionConflicto y EjecutarConjuntoCSV'],
  ], { note: 'Los cuatro primeros paquetes y motor forman el núcleo. Los paquetes persistencia, aplicacion y seguridad lo envuelven para la versión web.' }),
  P('El acceso a la base se hace con <c>JdbcTemplate</c> de Spring y consultas SQL explícitas en los repositorios. No se usan entidades JPA. Con eso el esquema queda definido en un solo lugar, que son los scripts de Flyway, y el núcleo no carga anotaciones de persistencia.'),

  H2('Ensamblaje del Núcleo'),
  P('La clase <c>ConfiguracionMotor</c> del paquete aplicacion es el único lugar donde se registran las reglas. Publica un bean <c>CatalogoRestricciones</c> con la lista de restricciones duras y un bean <c>ValidadorEntrada</c> con las reglas RV-01 y RV-02. <c>ServicioHorarios</c> recibe los dos por constructor y crea un <c>MotorAsignacion</c> nuevo en cada generación. El motor nunca crea reglas ni conoce sus clases concretas. Ese es el principio de inversión de dependencias que el diseño del Módulo 2 había ubicado en ControladorHorarios. En la construcción pasó a una clase de configuración para que el controlador no tenga lógica.'),
  ...code(`@Bean
public CatalogoRestricciones catalogoRestricciones() {
    return new CatalogoRestricciones(List.of(
            new RestriccionDisponibilidadDocenteRD04(),
            new RestriccionIdoneidadAulaRD05(),
            new RestriccionCapacidadAulaRD06(),
            new RestriccionChoqueDocenteRD01(),
            new RestriccionChoqueAulaRD02(),
            new RestriccionDocenteUnicoGrupoRD10()));
}`),

  H2('Flujo de una Generación'),
  P('Cuando el administrador pide generar un horario la petición llega a <c>POST /api/horarios/generar</c>. <c>ControladorHorarios</c> solo pasa el nombre del usuario autenticado a <c>ServicioHorarios.generar</c>. El servicio carga los parámetros vigentes con <c>RepositorioParametros</c> y genera la lista de franjas válidas. Luego reconstruye el problema en memoria con <c>ConstructorDominio</c> a partir de los inventarios guardados. Después corre <c>ValidadorEntrada</c> sobre los grupos y anota los hallazgos de RV-01 y RV-02, que no detienen la generación.'),
  P('Con todo en memoria el servicio llama a <c>MotorAsignacion.generarHorario</c> con el orden de la sesión más restringida primero y los mapas de ocupación activos. Al terminar guarda la ejecución con <c>RepositorioEjecuciones</c> en una sola transacción. Se guardan la fila de <c>ejecucion_horario</c>, las asignaciones, los conflictos con sus códigos y los hallazgos de validación. La respuesta es un objeto <c>Resultado</c> con el estado COMPLETO o PARCIAL. La Figura C1 del ' + DOCS.doc2 + ' sigue este flujo como diagrama de secuencia.'),

  H2('Algoritmo de Asignación'),
  P('El motor trata cada sesión como una variable cuyo dominio son las tuplas de docente, aula y franja. Trabaja en cuatro pasos. El primero cuenta para cada sesión cuántas tuplas pasan las restricciones locales, que son las que devuelven verdadero en <c>esLocal</c>. Hoy son RD-04, RD-05 y RD-06. El segundo ordena las sesiones de menor a mayor dominio para atender primero la más restringida. El tercero es el backtracking. Para cada sesión prueba tuplas y evalúa las reglas locales antes que las de choque porque son más baratas. Si ninguna tupla sirve deshace la última asignación y retrocede.'),
  P('El cuarto paso solo ocurre si el árbol se agota o se supera el tiempo límite. El motor recupera la asignación parcial más profunda que alcanzó e intenta ubicar sobre ella las sesiones que faltan. Para cada sesión que sigue sin lugar evalúa todas las reglas sin detenerse en la primera falla y cuenta cuántas tuplas bloquea cada código. Con eso arma un <c>ReporteConflicto</c>. La Figura B1 del ' + DOCS.doc2 + ' muestra los cuatro pasos como diagrama de actividades.'),
  P('Hay dos detalles de la construcción que conviene conocer. El primero es que las franjas no se prueban en el orden de la grilla. <c>OrdenFranjas.intercalarDias</c> las ordena por hora y luego por día, de modo que después del lunes a las 07:00 se prueba el martes a las 07:00. Así las sesiones de un mismo grupo tienden a caer en días distintos sin agregar una regla. Ese orden no cambia qué horarios son válidos. Solo cambia cuál encuentra primero el motor. El segundo detalle es que el conteo inicial sigue recorriendo todas las tuplas de cada sesión. El precálculo por franja que se planteó en el Módulo 2 no quedó implementado en esta versión.'),
  PEND('confirmar con la rama de código si el precálculo por franja de RD-04 a RD-06 se implementa antes del cierre y ajustar este párrafo'),
  P('<c>EstadoHorario</c> guarda las asignaciones confirmadas y dos listas de conjuntos, una de docentes ocupados y otra de aulas ocupadas, con un conjunto por franja. Responder si un docente o un aula ya están ocupados cuesta una consulta a un conjunto. Al deshacer una asignación se quita de la lista y de los dos conjuntos. El tiempo límite del motor se lee de la propiedad <c>app.motor.limite-ms</c>, que por defecto vale 60.000 ms para cumplir RNF-01.'),

  H2('Reubicación y Alternativas'),
  P('El ajuste manual no pasa por el backtracking. <c>ServicioHorarios.alternativas</c> reconstruye el horario guardado sin la sesión elegida y evalúa todas las tuplas contra las mismas restricciones del catálogo. Devuelve primero las tuplas válidas y después las que solo fallan por RD-01 o RD-02, con el campo <c>liberar</c> que indica qué choque habría que deshacer. <c>ServicioHorarios.reubicar</c> vuelve a evaluar la tupla que eligió el administrador. Si viola alguna regla responde 409 con el código <c>RESTRICCION_VIOLADA</c> y la lista de códigos RD. Si no viola ninguna actualiza la asignación y recalcula si el horario quedó completo.'),
  P('La base de datos es la segunda barrera. La tabla <c>asignacion</c> tiene dos restricciones UNIQUE, una sobre ejecución, docente, día y hora de inicio y otra sobre ejecución, aula, día y hora de inicio. Un choque de docente o de aula que llegue por un camino distinto del motor lo rechaza PostgreSQL.'),

  H2('Seguridad'),
  P('La seguridad es sin sesión de servidor. <c>ControladorAutenticacion</c> recibe usuario y contraseña en <c>POST /api/auth/login</c>, compara la contraseña con el hash bcrypt de la tabla <c>usuario</c> y entrega un token JWT firmado por <c>ServicioJwt</c>. El token dura 480 minutos por defecto. <c>FiltroJwt</c> lee la cabecera <c>Authorization: Bearer</c> en cada petición y deja pasar solo a usuarios con rol ADMIN. Las únicas rutas públicas son el inicio de sesión y <c>/actuator/health</c>. Al arrancar, <c>InicializadorDatos</c> crea el usuario administrador si no existe y guarda su clave con bcrypt.'),
  P('El horario exportado no lleva datos personales de estudiantes. El archivo de salida solo tiene curso, grupo, sesión, docente, aula, día y horas, como pide RNF-06.'),

  H2('API REST'),
  P('La Tabla 3 resume las rutas. Todas devuelven JSON salvo la exportación, que devuelve <c>text/csv</c>. Los errores tienen siempre la forma <c>{codigo, mensaje, detalles}</c>, que arma <c>ManejadorErrores</c>.'),
  ...table(3, 'Rutas de la API REST del backend', [3500, 2930, 2930], [
    ['Método y ruta', 'Respuesta', 'Requisito'],
    ['POST /api/auth/login', 'Token con fecha de expiración', 'RNF-06'],
    ['POST /api/inventarios (multipart con docentes, aulas, cursos y grupos)', 'ResumenCarga con cargados, rechazos y hallazgos', 'RF-01 a RF-05'],
    ['GET /api/inventarios/resumen', 'ResumenCarga de la última carga', 'RF-05'],
    ['GET /api/parametros', 'Parámetros y franjas válidas', 'RF-08'],
    ['PUT /api/parametros', 'Parámetros recalculados', 'RF-08'],
    ['POST /api/horarios/generar', 'Resultado COMPLETO o PARCIAL', 'RF-06, RF-07'],
    ['GET /api/horarios', 'Lista de ejecuciones con usuario y fecha', 'RNF-06'],
    ['GET /api/horarios/{id}', 'Resultado guardado', 'RF-06'],
    ['GET /api/horarios/{id}/alternativas/{idSesion}', 'Lista de alternativas', 'RF-07'],
    ['POST /api/horarios/{id}/reubicar', 'Resultado o 409 con códigos RD', 'RF-07, RNF-04'],
    ['GET /api/horarios/{id}/exportar', 'Archivo CSV o 409 si el horario es PARCIAL', 'RF-09, RD-08'],
  ], { note: 'Todas las rutas salvo el inicio de sesión exigen un token de un usuario con rol ADMIN. Sin token la respuesta es 401 con el código NO_AUTENTICADO.' }),
];

// Diccionario de datos tomado de backend/src/main/resources/db/migration/V1__esquema.sql
const dic = (n, tabla, desc, filas, nota) => [
  H3(tabla),
  P(desc),
  ...table(n, `Columnas de la tabla ${tabla}`, [2500, 1900, 1500, 3460], [['Columna', 'Tipo', 'Clave', 'Descripción y restricciones'], ...filas], nota ? { note: nota } : {}),
];

const diccionario = [
  H1('Diccionario de Datos'),
  P('El esquema lo crea Flyway al arrancar el backend con dos scripts. <c>V1__esquema.sql</c> crea las 18 tablas y <c>V2__datos_base.sql</c> carga los catálogos de características y de restricciones y los valores por defecto de los parámetros. El mismo SQL corre en PostgreSQL 16 y en H2 en modo PostgreSQL. Las tablas se agrupan en cuatro bloques. El bloque de inventarios guarda lo que llega en los CSV. El bloque de configuración guarda los parámetros y las franjas vigentes. El bloque de ejecuciones guarda cada horario generado con sus conflictos. El bloque de seguridad guarda el usuario administrador. El diagrama entidad relación está en la Figura D1 del ' + DOCS.doc2 + '.'),
  H2('Inventarios'),
  ...dic(4, 'docente', 'Un registro por docente del archivo docentes.csv.', [
    ['id_docente', 'VARCHAR(10)', 'PK', 'Identificador del docente, por ejemplo D01'],
    ['nombre', 'VARCHAR(80)', '', 'Obligatorio'],
    ['dedicacion', 'VARCHAR(20)', '', 'Dato informativo del archivo'],
    ['escalafon', 'VARCHAR(30)', '', 'Dato informativo del archivo'],
  ]),
  ...dic(5, 'disponibilidad_docente', 'Franjas en que el docente puede dictar. Se guardan por día y hora de inicio y no por índice de franja para que sobrevivan a un cambio de la grilla.', [
    ['id_docente', 'VARCHAR(10)', 'PK, FK', 'Referencia a docente'],
    ['dia', 'VARCHAR(10)', 'PK', 'Día de la semana'],
    ['hora_inicio', 'TIME', 'PK', 'Hora de inicio del bloque'],
  ]),
  ...dic(6, 'aula', 'Un registro por aula del archivo aulas.csv.', [
    ['id_aula', 'VARCHAR(10)', 'PK', 'Identificador del aula'],
    ['capacidad', 'SMALLINT', '', 'CHECK capacidad mayor que cero'],
  ]),
  ...dic(7, 'caracteristica', 'Catálogo de características de aula. Se carga con V2 y hoy tiene COMPUTADORES y SILLAS_MOVILES.', [
    ['id_caracteristica', 'VARCHAR(20)', 'PK', 'Código de la característica'],
    ['descripcion', 'VARCHAR(60)', '', 'Texto para la interfaz'],
  ]),
  ...dic(8, 'aula_caracteristica', 'Características que tiene cada aula. Resuelve la relación de muchos a muchos.', [
    ['id_aula', 'VARCHAR(10)', 'PK, FK', 'Referencia a aula'],
    ['id_caracteristica', 'VARCHAR(20)', 'PK, FK', 'Referencia a caracteristica'],
  ]),
  ...dic(9, 'curso', 'Un registro por asignatura del archivo cursos.csv.', [
    ['id_curso', 'VARCHAR(10)', 'PK', 'Identificador del curso'],
    ['nombre', 'VARCHAR(80)', '', 'Obligatorio'],
    ['num_sesiones_semanales', 'SMALLINT', '', 'CHECK entre 1 y 4 (RD-07)'],
  ]),
  ...dic(10, 'curso_requisito_aula', 'Características que el curso exige del aula (RD-05).', [
    ['id_curso', 'VARCHAR(10)', 'PK, FK', 'Referencia a curso'],
    ['id_caracteristica', 'VARCHAR(20)', 'PK, FK', 'Referencia a caracteristica'],
  ]),
  ...dic(11, 'habilitacion_docente', 'Docentes habilitados para dictar cada curso (S-06). Si un curso no tiene filas aquí cualquier docente puede dictarlo.', [
    ['id_curso', 'VARCHAR(10)', 'PK, FK', 'Referencia a curso'],
    ['id_docente', 'VARCHAR(10)', 'PK, FK', 'Referencia a docente'],
  ]),
  ...dic(12, 'grupo', 'Un registro por grupo del archivo grupos.csv.', [
    ['id_grupo', 'VARCHAR(15)', 'PK', 'Identificador del grupo, por ejemplo MAT1-G1'],
    ['id_curso', 'VARCHAR(10)', 'FK', 'Referencia a curso'],
    ['matriculados', 'SMALLINT', '', 'CHECK mayor o igual a cero'],
  ]),
  ...dic(13, 'sesion', 'Sesiones semanales de cada grupo. Las crea el cargador según num_sesiones_semanales del curso.', [
    ['id_sesion', 'VARCHAR(20)', 'PK', 'Identificador de la sesión'],
    ['id_grupo', 'VARCHAR(15)', 'FK', 'Referencia a grupo'],
    ['numero_sesion', 'SMALLINT', 'UNIQUE con id_grupo', 'Número de la sesión dentro del grupo'],
  ]),
  H2('Configuración'),
  ...dic(14, 'parametro_configuracion', 'Parámetros del semestre (S-04). Se editan desde la pantalla de parámetros.', [
    ['clave', 'VARCHAR(30)', 'PK', 'CAP_MAX, TOL, MIN_CIERRE, MAX_SESIONES, DUR_SESION, APERTURA_SEMANA, CIERRE_SEMANA, CIERRE_SABADO, INICIO_BLOQUEO o FIN_BLOQUEO'],
    ['valor', 'VARCHAR(30)', '', 'Valor como texto'],
    ['tipo_dato', 'VARCHAR(10)', '', 'CHECK ENTERO, DECIMAL u HORA'],
  ], 'Valores por defecto 40, 0.10, 10, 4, 2, 07:00, 22:00, 13:00, 12:00 y 13:00 en el orden de las claves.'),
  ...dic(15, 'franja_horaria', 'Franjas válidas vigentes. RepositorioParametros la reescribe cada vez que cambian los parámetros. Con los valores por defecto tiene 32 filas.', [
    ['id_franja', 'SMALLINT', 'PK', 'Índice de la franja desde 0'],
    ['dia', 'VARCHAR(10)', 'UNIQUE con hora_inicio', 'CHECK LUNES a SABADO'],
    ['hora_inicio', 'TIME', '', 'Inicio del bloque'],
    ['hora_fin', 'TIME', '', 'Fin del bloque'],
  ]),
  ...dic(16, 'restriccion', 'Catálogo de códigos de regla. Lo usan los conflictos y los hallazgos para mostrar la descripción de cada código.', [
    ['codigo', 'VARCHAR(6)', 'PK', 'RD-01 a RD-08, RD-10, RV-01 y RV-02'],
    ['tipo', 'VARCHAR(10)', '', 'CHECK DURA o VALIDACION'],
    ['descripcion', 'VARCHAR(160)', '', 'Texto que ve el administrador'],
  ]),
  H2('Ejecuciones'),
  ...dic(17, 'ejecucion_horario', 'Una fila por cada vez que se genera un horario. Permite saber quién generó cada horario y cuándo (RNF-06).', [
    ['id_ejecucion', 'INTEGER', 'PK', 'Identidad generada por la base'],
    ['id_usuario', 'INTEGER', 'FK', 'Referencia a usuario'],
    ['fecha_hora', 'TIMESTAMP', '', 'Momento de la generación'],
    ['estado', 'VARCHAR(10)', '', 'CHECK COMPLETO o PARCIAL'],
    ['nodos_explorados', 'BIGINT', '', 'Nodos del backtracking'],
    ['duracion_ms', 'INTEGER', '', 'Duración total en milisegundos'],
  ]),
  ...dic(18, 'asignacion', 'Una fila por sesión ubicada en una ejecución.', [
    ['id_ejecucion', 'INTEGER', 'PK, FK', 'Referencia a ejecucion_horario'],
    ['id_sesion', 'VARCHAR(20)', 'PK, FK', 'Referencia a sesion'],
    ['id_docente', 'VARCHAR(10)', 'FK', 'Referencia a docente'],
    ['id_aula', 'VARCHAR(10)', 'FK', 'Referencia a aula'],
    ['dia', 'VARCHAR(10)', '', 'Día asignado'],
    ['hora_inicio', 'TIME', '', 'Inicio asignado'],
    ['hora_fin', 'TIME', '', 'Fin asignado'],
  ], 'UNIQUE (id_ejecucion, id_docente, dia, hora_inicio) protege RD-01. UNIQUE (id_ejecucion, id_aula, dia, hora_inicio) protege RD-02.'),
  ...dic(19, 'conflicto', 'Una fila por sesión que quedó sin ubicar en una ejecución.', [
    ['id_conflicto', 'INTEGER', 'PK', 'Identidad generada por la base'],
    ['id_ejecucion', 'INTEGER', 'FK, UNIQUE con id_sesion', 'Referencia a ejecucion_horario'],
    ['id_sesion', 'VARCHAR(20)', 'FK', 'Referencia a sesion'],
  ]),
  ...dic(20, 'conflicto_restriccion', 'Causas de cada conflicto con el número de tuplas que bloqueó cada código.', [
    ['id_conflicto', 'INTEGER', 'PK, FK', 'Referencia a conflicto'],
    ['codigo', 'VARCHAR(6)', 'PK, FK', 'Referencia a restriccion'],
    ['tuplas_bloqueadas', 'INTEGER', '', 'CHECK mayor que cero'],
  ]),
  ...dic(21, 'hallazgo_validacion', 'Hallazgos de RV-01 y RV-02 encontrados antes de generar.', [
    ['id_ejecucion', 'INTEGER', 'PK, FK', 'Referencia a ejecucion_horario'],
    ['id_grupo', 'VARCHAR(15)', 'PK, FK', 'Referencia a grupo'],
    ['codigo', 'VARCHAR(6)', 'PK, FK', 'Referencia a restriccion'],
    ['mensaje', 'VARCHAR(200)', '', 'Texto del hallazgo'],
  ]),
  H2('Seguridad'),
  ...dic(22, 'usuario', 'Usuarios que pueden entrar al sistema. En el MVP solo existe el perfil administrador.', [
    ['id_usuario', 'INTEGER', 'PK', 'Identidad generada por la base'],
    ['nombre_usuario', 'VARCHAR(40)', 'UNIQUE', 'Nombre para iniciar sesión'],
    ['hash_contrasena', 'VARCHAR(100)', '', 'Hash bcrypt, nunca la clave en claro'],
    ['rol', 'VARCHAR(15)', '', 'CHECK igual a ADMIN'],
  ]),
  H2('Archivos de Intercambio'),
  P('El intercambio de archivos es solo en CSV. Los archivos usan coma como separador, codificación UTF-8 y una primera fila de encabezados. Las listas dentro de un campo van separadas por punto y coma. La Tabla 23 muestra el encabezado exacto que exige el cargador y un ejemplo de fila.'),
  ...table(23, 'Formato de los archivos CSV de entrada y salida', [1700, 3800, 3860], [
    ['Archivo', 'Encabezado', 'Ejemplo de fila'],
    ['docentes.csv', 'id_docente,nombre,dedicacion,escalafon,disponibilidad', 'D01,Dr. Gómez,MEDIO,ASOCIADO,MAR 07:00;MAR 09:00;MIE 09:00'],
    ['aulas.csv', 'id_aula,capacidad,caracteristicas', 'A301,45,COMPUTADORES'],
    ['cursos.csv', 'id_curso,nombre,num_sesiones,requisitos,docentes_habilitados', 'CAL2,Cálculo II,2,,D01'],
    ['grupos.csv', 'id_grupo,id_curso,matriculados', 'CAL2-G2,CAL2,35'],
    ['horario.csv (salida)', 'curso,grupo,sesion,docente,aula,dia,hora_inicio,hora_fin', 'Cálculo II,CAL2-G2,1,Dr. Gómez,A204,MIERCOLES,09:00,11:00'],
  ], { note: 'Los días válidos son LUN, MAR, MIE, JUE, VIE y SAB. En disponibilidad la palabra TODAS equivale a las 32 franjas. Un campo docentes_habilitados vacío significa que cualquier docente puede dictar el curso (S-06).' }),
  P('Cada fila que no cumple el formato se rechaza con el número de fila y un código. El código FORMATO indica un dato vacío, repetido o mal escrito. REFERENCIA indica un identificador que no existe en otro archivo. RD-03 indica una franja que no pertenece a la grilla. RD-04 indica un docente sin ninguna franja disponible. RD-07 indica un curso con un número de sesiones fuera del rango permitido. Las filas válidas se cargan aunque otras se rechacen.'),
];

const instalacion = [
  H1('Guía de Instalación desde Cero'),
  P('Esta guía parte de un equipo que no tiene nada del proyecto. La forma recomendada es con Docker porque levanta los tres servicios con un solo comando. Al final hay una ruta alternativa sin Docker para el caso en que el equipo no pueda instalarlo.'),
  H2('Instalación con Docker'),
  P('<b>Paso 1. Instalar Docker.</b> En Windows y macOS se instala Docker Desktop desde la página oficial y se deja abierto. En Linux se instalan Docker Engine y el complemento Compose v2. Para comprobar la instalación se abre una terminal y se ejecutan los dos comandos siguientes. Ambos deben responder con un número de versión.'),
  ...code(`docker --version
docker compose version`),
  P('<b>Paso 2. Instalar Git y clonar el repositorio.</b> Se instala Git y se descarga el proyecto en una carpeta de trabajo.'),
  ...code(`git clone https://github.com/jesusBeltran79/ProgHorarioClase.git
cd ProgHorarioClase`),
  P('<b>Paso 3. Revisar los puertos.</b> Los puertos 4200, 8080 y 5432 deben estar libres. Si el equipo ya tiene un PostgreSQL local en el 5432 hay que detenerlo o cambiar el puerto publicado en <c>docker-compose.yml</c>.'),
  P('<b>Paso 4. Construir y arrancar.</b> Desde la raíz del repositorio se ejecuta el comando siguiente. La primera vez tarda varios minutos porque descarga las imágenes base, compila el backend con Maven y compila la interfaz con Node.js. Las siguientes veces es mucho más rápido.'),
  ...code('docker compose up --build'),
  P('<b>Paso 5. Comprobar que todo está arriba.</b> Cuando la terminal deje de mostrar mensajes de arranque se abre en el navegador la dirección de salud del backend. Debe responder con el estado UP. Después se abre la interfaz web.'),
  ...code(`http://localhost:8080/actuator/health   ->  {"status":"UP"}
http://localhost:4200                   ->  pantalla de inicio de sesión`),
  P('<b>Paso 6. Iniciar sesión.</b> El usuario inicial es <c>admin</c> con la clave <c>Horarios2026*</c>. Antes de usar el sistema fuera de una demostración se debe cambiar esa clave y el secreto de los tokens con las variables de entorno de la Tabla 24.'),
  P('<b>Paso 7. Cargar los datos de demostración.</b> En la carpeta <c>datos/demo</c> están los cuatro archivos del conjunto de sustentación con 10 docentes, 5 aulas y 20 asignaturas. El ' + DOCS.doc4 + ' explica cómo cargarlos y generar el primer horario.'),
  PEND('confirmar los nombres de los servicios y los volúmenes de docker-compose.yml cuando la sesión de código lo suba (punto P2)'),
  H2('Instalación sin Docker'),
  P('Esta ruta usa el perfil <c>h2</c> del backend, que reemplaza PostgreSQL por una base en memoria compatible. Los datos se pierden al detener el backend. Sirve como respaldo para una demostración o para desarrollo.'),
  P('<b>Paso 1.</b> Instalar Java 21 (Eclipse Temurin), Maven 3.9 y Node.js 20 LTS y comprobar las versiones con <c>java -version</c>, <c>mvn -v</c> y <c>node -v</c>.'),
  P('<b>Paso 2.</b> Compilar y arrancar el backend con el perfil de respaldo.'),
  ...code(`cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=h2`),
  P('<b>Paso 3.</b> En otra terminal instalar las dependencias de la interfaz y arrancarla.'),
  ...code(`cd frontend
npm ci
npm start`),
  PEND('confirmar el comando de arranque del frontend y su redirección de /api al backend cuando exista la carpeta frontend (punto P2)'),
  P('<b>Paso 4.</b> Para correr solo las pruebas automáticas del backend no hace falta la interfaz. Desde la carpeta <c>backend</c> se ejecuta <c>mvn verify</c>. Las pruebas usan H2 y no necesitan PostgreSQL.'),
];

const operacion = [
  H1('Operación'),
  H2('Variables de Entorno'),
  P('El backend lee su configuración de <c>application.yml</c> y permite reemplazar cada valor con una variable de entorno. La Tabla 24 lista las que importan para operar el sistema.'),
  ...table(24, 'Variables de entorno del backend', [2400, 3200, 3760], [
    ['Variable', 'Valor por defecto', 'Uso'],
    ['DB_URL', 'jdbc:postgresql://localhost:5432/horarios', 'Dirección de la base'],
    ['DB_USUARIO y DB_CLAVE', 'horarios y horarios', 'Credenciales de la base'],
    ['PUERTO', '8080', 'Puerto del backend'],
    ['JWT_SECRETO', 'Secreto de desarrollo del grupo', 'Firma de los tokens. Debe tener al menos 32 caracteres y cambiarse fuera de la demostración'],
    ['JWT_MINUTOS', '480', 'Duración del token'],
    ['ADMIN_USUARIO y ADMIN_CLAVE', 'admin y Horarios2026*', 'Usuario administrador que se crea al primer arranque'],
    ['MOTOR_LIMITE_MS', '60000', 'Tiempo máximo de una generación'],
    ['CORS_ORIGENES', 'http://localhost:4200', 'Orígenes que pueden llamar a la API'],
  ]),
  H2('Tareas Frecuentes'),
  P('Para detener el sistema se presiona Ctrl+C en la terminal donde corre o se ejecuta <c>docker compose down</c> en otra. Los datos de PostgreSQL se conservan entre arranques. Para empezar con una base vacía se ejecuta <c>docker compose down -v</c>, que borra también el volumen de datos.'),
  P('Los registros del backend se ven con <c>docker compose logs -f backend</c>. Cada generación deja en la tabla <c>ejecucion_horario</c> el usuario, la fecha, el estado, los nodos explorados y la duración. Eso permite revisar el historial sin abrir los registros.'),
  P('Las mediciones de estrés se repiten fuera de la aplicación con el programa de consola <c>PruebaEstres</c>. La integración continua lo ejecuta en cada envío al repositorio después de las pruebas JUnit y publica los resultados como artefacto.'),
  ...code(`cd backend
mvn -q package -DskipTests
java -Xss64m -cp target/classes co.edu.unbosque.horarios.app.PruebaEstres target/evidencias/estres 60000`),
  P('El parámetro <c>-Xss64m</c> amplía la pila de la máquina virtual porque el backtracking es recursivo y en 10x la profundidad llega a cientos de sesiones.'),
];

const mantenimiento = [
  H1('Guía de Mantenimiento del Algoritmo de Restricciones'),
  P('Esta sección explica cómo cambiar las reglas del motor sin romperlo. El diseño se pensó para que los cambios frecuentes no toquen <c>MotorAsignacion</c>. La Tabla 25 dice dónde se hace cada tipo de cambio.'),
  ...table(25, 'Dónde se hace cada tipo de cambio', [3000, 3400, 2960], [
    ['Cambio', 'Dónde se hace', 'Recompilar'],
    ['Tope de matriculados, tolerancia o mínimo de cierre', 'Pantalla de parámetros o PUT /api/parametros', 'No'],
    ['Horario de apertura, cierre, bloqueo del mediodía o duración de la sesión', 'Pantalla de parámetros o PUT /api/parametros', 'No'],
    ['Nueva restricción dura', 'Clase nueva en restricciones, una línea en ConfiguracionMotor y un script de Flyway', 'Sí'],
    ['Nueva regla de validación de entrada', 'Clase nueva en validacion y una línea en ConfiguracionMotor', 'Sí'],
    ['Nueva característica de aula', 'Valor en el enum CaracteristicaAula y fila en el catálogo caracteristica', 'Sí'],
  ]),
  H2('Cómo Agregar una Restricción Dura'),
  P('El ejemplo es RD-09, que prohíbe que dos sesiones del mismo grupo queden el mismo día. Es la regla que el equipo usó para demostrar la modificabilidad. Los pasos son cinco y ninguno toca el motor.'),
  P('<b>Paso 1. Decidir si la regla es local.</b> Una regla es local si para decidir le basta la tupla candidata de docente, aula y franja. RD-04, RD-05 y RD-06 son locales. Una regla no es local si necesita mirar el horario ya construido, como los choques. RD-09 no es local porque debe revisar las otras sesiones del grupo. La decisión importa porque el motor usa las reglas locales en el conteo inicial y las evalúa primero en el backtracking. Si una regla que mira el horario se declara local, el motor la llama en el conteo inicial con el estado en nulo y falla.'),
  P('<b>Paso 2. Crear la clase.</b> La clase va en el paquete <c>restricciones</c>, implementa <c>RestriccionDura</c>, es final y no guarda estado propio. El nombre sigue la convención Restriccion más el concepto más el código.'),
  ...code(`public final class RestriccionMismoDiaRD09 implements RestriccionDura {
    @Override public String getCodigo() { return "RD-09"; }
    @Override public boolean esLocal() { return false; }
    @Override
    public boolean esValida(Asignacion c, EstadoHorario e, ConfiguracionParametros cfg) {
        for (Asignacion a : e.getAsignaciones())
            if (a.getSesion().getGrupo() == c.getSesion().getGrupo()
                    && a.getFranja().getDia() == c.getFranja().getDia()) return false;
        return true;
    }
}`),
  P('<b>Paso 3. Registrar la regla.</b> Se agrega una línea con <c>new RestriccionMismoDiaRD09()</c> en la lista de <c>ConfiguracionMotor.catalogoRestricciones</c>. El orden de la lista no altera el resultado porque el motor pone primero las reglas locales al construirse.'),
  P('<b>Paso 4. Registrar el código en la base.</b> Las tablas <c>conflicto_restriccion</c> y <c>hallazgo_validacion</c> tienen una clave foránea hacia <c>restriccion</c>. Si el código nuevo no está en ese catálogo, la primera ejecución con un conflicto causado por la regla falla al guardarse. Por eso se crea un script nuevo de Flyway. Nunca se edita V1 ni V2 porque Flyway rechaza un script ya aplicado que cambió.'),
  ...code(`-- backend/src/main/resources/db/migration/V3__restriccion_rd09.sql
INSERT INTO restriccion (codigo, tipo, descripcion) VALUES
    ('RD-09', 'DURA', 'Dos sesiones del mismo grupo no pueden quedar el mismo día');`),
  P('<b>Paso 5. Probar.</b> Se agrega un caso en <c>RestriccionesDurasTest</c> con dos sesiones del mismo grupo el mismo día y se comprueba que la regla responde falso. Luego se corre <c>mvn verify</c> completo para confirmar que las demás reglas y el motor siguen en verde. La diferencia de versiones de este cambio debe mostrar cero líneas modificadas en <c>MotorAsignacion</c>. La evidencia de ese diff está en el escenario de modificabilidad del ' + DOCS.doc1 + '.'),
  H2('Cómo Agregar una Regla de Validación'),
  P('Las reglas RV no forman parte del backtracking. Se evalúan una vez por grupo antes de generar y sus hallazgos no detienen el proceso. Para agregar una se crea una clase en el paquete <c>validacion</c> que implemente <c>ReglaValidacionEntrada</c>, se registra en el bean <c>validadorEntrada</c> de <c>ConfiguracionMotor</c> y se agrega su código al catálogo <c>restriccion</c> con tipo VALIDACION mediante un script de Flyway nuevo.'),
  H2('Qué no Conviene Tocar'),
  P('Hay tres puntos sensibles. El primero es el ciclo de <c>MotorAsignacion.backtrack</c>. Cambiarlo afecta a todas las reglas a la vez y obliga a repetir las pruebas de estrés. El segundo es <c>EstadoHorario</c>. Si se agrega una estructura de ocupación nueva hay que mantenerla también en <c>removerUltimaAsignacion</c> o el retroceso deja datos sucios. El tercero es el cálculo de <c>calcularUmbralMaximoGrupo</c>. Usa el techo de CAP_MAX por uno más TOL con un pequeño margen para que 40 por 1,10 no termine en 45 por el error del punto flotante. Con tope 40 da 44 y con tope 35 da 39.'),
  P('Si se quiere mejorar el desempeño del conteo inicial, el camino que quedó identificado es precalcular por franja cuántos docentes y cuántas aulas sirven. Eso exige que cada regla declare de qué elemento de la tupla depende y por tanto cambia el contrato de <c>RestriccionDura</c>. Es un cambio mayor que debe medirse otra vez en 1x, 3x, 5x y 10x antes de adoptarse.'),
];

const problemas = [
  H1('Solución de Problemas'),
  ...table(26, 'Problemas frecuentes y cómo resolverlos', [3100, 3100, 3160], [
    ['Síntoma', 'Causa probable', 'Solución'],
    ['docker compose falla con un puerto en uso', 'Otro programa usa el 4200, el 8080 o el 5432', 'Detener ese programa o cambiar el puerto publicado en docker-compose.yml'],
    ['El backend no arranca y menciona Flyway', 'Un script de migración ya aplicado fue modificado', 'Restaurar el script original y crear uno nuevo con la versión siguiente'],
    ['La API responde 401 NO_AUTENTICADO', 'Falta el token o venció', 'Iniciar sesión de nuevo'],
    ['Generar responde 409 SIN_DATOS', 'No se han cargado inventarios', 'Cargar los cuatro archivos CSV'],
    ['Exportar responde 409 HORARIO_PARCIAL', 'Quedan sesiones sin ubicar y no se cumple RD-08', 'Resolver los conflictos con la reubicación asistida y exportar de nuevo'],
    ['Consultar un horario responde 409 GRILLA_CAMBIADA', 'Los parámetros cambiaron después de generar ese horario', 'Generar un horario nuevo con la grilla vigente'],
    ['El motor termina con StackOverflowError en escalas grandes', 'La pila por defecto de la JVM es corta para la recursión', 'Ejecutar con -Xss64m'],
  ]),
];

const referencias = [
  H1('Referencias'),
  ...refs([
    K.REF_EQUIPO_M2,
    K.REF_EQUIPO_M2_ANEXOS,
    'Gamma, E., Helm, R., Johnson, R. y Vlissides, J. (1994). <i>Design patterns: Elements of reusable object-oriented software</i>. Addison-Wesley.',
    'Martin, R. C. (2003). <i>Agile software development: Principles, patterns, and practices</i>. Prentice Hall.',
    'Russell, S. y Norvig, P. (2021). <i>Artificial intelligence: A modern approach</i> (4.ª ed.). Pearson.',
  ]),
];

const children = [...portada, ...intro, ...requisitos, ...arquitectura, ...diccionario, ...instalacion, ...operacion, ...mantenimiento, ...problemas, ...referencias];
K.guardar(children, 'Manual Técnico', process.argv[2] || 'PN2_Grupo5_Doc3_ManualTecnico.docx');
