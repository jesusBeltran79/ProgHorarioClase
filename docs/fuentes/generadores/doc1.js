// Documento 1. Informe de Ingeniería (documento principal de la entrega final del Módulo 3).
const L = require('./lib');
const K = require('./comun');
const { P, H1, H2, H3, C, PB, table, code, refs } = L;
const { PEND, DOCS, VIDEO } = K;

const portada = K.portada('Informe de Ingeniería del Motor de Asignación Automática de Horarios de Clases',
  'Documento 1 de la Entrega Final del Módulo 3. Construcción, Validación y Sustentación',
  [C(''), C(`<b>Video de respaldo en YouTube</b> ${VIDEO}`)]);

// ---------------------------------------------------------------------------------------------
const intro = [
  H1('Introducción'),
  P('Este informe cierra el proyecto del Grupo 5. El Módulo 1 definió el problema y el alcance. El Módulo 2 diseñó el motor y lo midió con un prototipo (Beltrán Zárate et al., 2026c, 2026d). En el Módulo 3 el equipo construyó el sistema completo con una API REST, una interfaz web, una base de datos PostgreSQL y seguridad para el perfil administrador. Este documento presenta el diseño en su versión final, explica qué cambió y por qué, muestra con evidencia cómo responde el sistema construido y declara lo que no se logró.'),
  P('La entrega tiene cuatro documentos que se leen juntos. Este es el ' + DOCS.doc1 + '. Los diagramas UML finales y el modelo de datos están en el ' + DOCS.doc2 + ' con la numeración de figuras A1 a E2. La arquitectura en detalle, el diccionario de datos, la instalación desde cero y la guía para mantener las restricciones están en el ' + DOCS.doc3 + '. La operación paso a paso para el administrador está en el ' + DOCS.doc4 + '.'),
  P('El código está en el repositorio del equipo. Las cifras que aparecen aquí salen de los archivos de la carpeta docs/evidencias, que se generan con las pruebas automáticas y la integración continua. Cada cifra cita el archivo del que sale.'),
];

// ---------------------------------------------------------------------------------------------
const contexto = [
  H1('Problema y Alcance'),
  P('El problema no cambió desde el Módulo 1. El sistema debe asignar a cada sesión semanal de cada grupo una tupla formada por un docente, un aula y una franja horaria sin violar las restricciones duras del caso (Lopez-Cruz, s.f.-a). Las franjas válidas salen de una grilla que empieza a las 07:00 con bloques de dos horas, no cruza el intervalo de 12:00 a 13:00 y cierra el sábado a las 13:00. Con esos parámetros hay 32 franjas.'),
  P('El alcance comprometido incluye ocho restricciones duras y dos reglas de validación de los datos de entrada. RD-01 y RD-02 impiden los choques de docente y de aula. RD-03 limita las sesiones a las franjas válidas. RD-04 respeta la disponibilidad y la habilitación del docente. RD-05 exige las características del aula y RD-06 la capacidad suficiente. RD-07 limita cada curso a entre una y cuatro sesiones de dos horas. RD-08 exige que toda sesión quede asignada para que el horario sea válido. RV-01 marca los grupos que superan el tope de 40 con su tolerancia y RV-02 marca para cierre los grupos con menos de 10 matriculados. Las restricciones blandas RB-01 a RB-04 y las exclusiones RE-01 a RE-04 quedaron fuera del MVP desde el Módulo 1 y siguen fuera.'),
];

// ---------------------------------------------------------------------------------------------
const cambios = [
  H1('Diseño Final y Cambios Justificados'),
  P('El diseño del Módulo 2 se mantiene en lo esencial. El motor sigue siendo un backtracking con la sesión más restringida primero, las restricciones duras siguen el patrón Strategy con la interfaz RestriccionDura y las reglas de validación tienen su propio contrato ReglaValidacionEntrada. Lo que cambió vino de la construcción. Algunos cambios corrigen errores que el equipo encontró en su autodiagnóstico. Otros aparecieron al conectar el motor con la API y la base de datos. La Tabla 1 los reúne y las secciones siguientes explican los más importantes.'),
  ...table(1, 'Cambios del diseño entre el Módulo 2 y el sistema construido', [1800, 2400, 2700, 2460], [
    ['Elemento', 'Diseño del Módulo 2', 'Sistema construido', 'Justificación'],
    ['Seguridad', 'Componente de seguridad de Spring Boot sin diseño detallado', 'JWT firmado con JJWT 0.12.6, contraseña con bcrypt y rol ADMIN en todas las rutas /api', 'Cumple RNF-06 sin sesión de servidor. Era el Ajuste 3 del autodiagnóstico'],
    ['Formato de intercambio', 'CSV o JSON', 'Solo CSV con el formato de la Tabla D2 de los Anexos del M2', 'JSON nunca tuvo especificación. Se declara fuera del alcance logrado'],
    ['Capa de aplicación', 'ControladorHorarios llamaba al dominio y ensamblaba las reglas', 'ControladorHorarios delega en ServicioHorarios y las reglas se registran en ConfiguracionMotor', 'El controlador REST queda sin lógica y el ensamblaje está en un solo lugar'],
    ['Umbral de RV-01', 'Math.floor que daba 38 con tope 35', 'Techo de CAP_MAX × (1 + TOL) que da 44 con tope 40 y 39 con tope 35', 'Corrige la discrepancia con el Módulo 1. Era el Ajuste 1 del autodiagnóstico'],
    ['Acceso a datos', 'Entidades JPA', 'Repositorios con JdbcTemplate y esquema definido en scripts de Flyway', 'El esquema queda en un solo lugar y el núcleo no carga anotaciones de persistencia'],
    ['Restricción RD-10', 'No existía', 'RestriccionDocenteUnicoGrupoRD10 exige el mismo docente en todas las sesiones de un grupo', 'La construcción mostró que el caso la daba por supuesta. Se agregó sin tocar el motor'],
    ['Orden de las franjas', 'Orden de la grilla', 'OrdenFranjas.intercalarDias prueba primero la misma hora en días distintos', 'Reparte las sesiones de un grupo en la semana sin agregar una regla nueva'],
    ['Modelo de datos', '19 tablas', '18 tablas en V1__esquema.sql', 'Ver la Figura D1 del Documento 2'],
    ['Conteo inicial', 'Precálculo por franja como decisión pendiente', 'Conteo completo de tuplas por sesión', 'No se implementó en esta versión. Se declara en el Acta de Cierre'],
  ], { note: 'Los nombres de clases y archivos son los del código del repositorio. RD = restricción dura. RV = regla de validación.' }),
  PEND('confirmar con la rama de código la fila de 19 a 18 tablas contra el DER del M2 y explicar qué tabla se fusionó o se quitó'),
  PEND('confirmar si el precálculo por franja (cambio 5 del contrato) entra antes del cierre; si entra, mover la última fila de la Tabla 1 a cambio logrado'),

  H2('Seguridad con JWT'),
  P('El Módulo 2 nombraba un componente de seguridad de Spring Boot pero no lo diseñaba. El autodiagnóstico reconoció que el equipo no sabía defenderlo. En la construcción se eligió un esquema sin sesión de servidor. El administrador envía usuario y contraseña a POST /api/auth/login. ControladorAutenticacion compara la contraseña con el hash bcrypt de la tabla usuario y ServicioJwt entrega un token firmado. FiltroJwt revisa ese token en cada petición y ConfiguracionSeguridad exige el rol ADMIN en todas las rutas /api salvo el inicio de sesión. Un token tiene vigencia de 480 minutos por defecto. Las pruebas de SeguridadTest verifican que generar sin token responde 401, que una contraseña errada no entrega token y que un token alterado no da acceso.'),

  H2('Servicio de Aplicación entre la API y el Dominio'),
  P('En el diseño del Módulo 2 ControladorHorarios recibía la petición, armaba la lista de reglas y llamaba al motor. Al construir la API ese controlador tenía que leer la base, reconstruir el problema en memoria, validar, generar, guardar y armar la respuesta. Eso mezclaba la capa web con la lógica. Se agregó ServicioHorarios para que haga ese trabajo y el controlador quedó con una línea por ruta. El ensamblaje de las reglas pasó a ConfiguracionMotor, que publica la lista de restricciones duras y el validador como componentes de Spring. El motor sigue recibiendo la lista por constructor y no conoce las clases concretas. La Figura A1 del ' + DOCS.doc2 + ' muestra la estructura final.'),

  H2('Umbral de RV-01 con Techo'),
  P('El Módulo 1 define el umbral de RV-01 como el techo de CAP_MAX × (1 + TOL). El prototipo del Módulo 2 usaba el piso y con tope 35 publicó 38 en lugar de 39. Con tope 40 los dos redondeos dan 44 y por eso el error no se veía. El método calcularUmbralMaximoGrupo de ConfiguracionParametros ahora usa el techo y resta un margen muy pequeño para que 40 por 1,10 no termine en 45 por el error del punto flotante. La prueba umbralConTecho de ConfiguracionParametrosTest confirma 44 con tope 40 y 39 con tope 35. La prueba tope35 de ParametrosApiTest confirma lo mismo a través de la API.'),

  H2('Restricción RD-10'),
  P('Con solo RD-01 a RD-08 nada impide que las sesiones de un mismo grupo queden con docentes distintos. El caso de estudio da por supuesto que un grupo tiene un solo docente, pero el Módulo 1 no lo escribió como restricción y la construcción lo hizo visible. Se agregó la clase RestriccionDocenteUnicoGrupoRD10 y se registró en ConfiguracionMotor. No fue necesario modificar MotorAsignacion. Es la segunda vez que el diseño admite una regla nueva sin tocar el motor y por eso se cita también como evidencia de modificabilidad. La prueba docenteUnico de RestriccionesDurasTest la verifica.'),

  H2('Hallazgos del Autodiagnóstico'),
  P('El autodiagnóstico del Módulo 2 dejó tres ajustes con fecha límite del 5 de noviembre. El Ajuste 1 pedía corregir el umbral de RV-01 y quedó resuelto como se explicó arriba. El Ajuste 2 pedía que CargadorInventariosCSV, ExportadorHorarioCSV y ControladorHorarios existieran en el código y que se decidiera el formato JSON. Las tres clases existen y las prueban CargadorInventariosCSVTest, MotorAsignacionTest y FlujoHorarioTest. JSON queda fuera del alcance y solo se intercambia CSV. El Ajuste 3 pedía diseñar la seguridad del administrador con JWT y bcrypt y quedó resuelto con las clases del paquete seguridad. El autodiagnóstico también señaló que la comparación de versiones de RD-09 no aparecía en los anexos. Esa comparación es la medida del escenario de modificabilidad de este informe.'),
  PEND('registro de las sesiones internas de explicación entre integrantes acordadas en el autodiagnóstico (Ajuste 3 y riesgo de conocimiento desigual)'),
];

// ---------------------------------------------------------------------------------------------
const arquitectura = [
  H1('Arquitectura Final'),
  P('El sistema es un monolito modular en cuatro capas que corre en tres contenedores. La interfaz web en Angular 18.2 la sirve nginx 1.27 en el puerto 4200 y redirige las rutas /api al backend. El backend en Java 21 con Spring Boot 3.3.5 corre en el puerto 8080. PostgreSQL 16 guarda los datos en el puerto 5432. Todo se levanta con docker compose up --build. La Figura E1 del ' + DOCS.doc2 + ' muestra los componentes y la Figura E2 el despliegue.'),
  P('La decisión que sostiene la arquitectura se mantuvo. Los paquetes dominio, configuracion, restricciones, validacion y motor no importan Spring. El motor trabaja solo en memoria. ServicioHorarios lee los inventarios y los parámetros de la base una vez antes de generar y guarda el resultado una vez al terminar. Dentro del ciclo del backtracking no hay acceso a disco ni a red. Por eso el núcleo es el mismo que se midió en el Módulo 2 y sus pruebas corren sin levantar la aplicación.'),
  P('La base de datos protege dos restricciones por su cuenta. La tabla asignacion tiene una restricción UNIQUE sobre ejecución, docente, día y hora y otra sobre ejecución, aula, día y hora. La prueba uniqueEnAsignacion de RestriccionesBaseDatosTest inserta a mano un choque de docente y uno de aula y comprueba que PostgreSQL los rechaza. RD-01 y RD-02 quedan así protegidas en el motor y en la base.'),
  P('El algoritmo no cambió en su estructura. Cuenta para cada sesión las tuplas que pasan las restricciones locales, ordena las sesiones de menor a mayor dominio, recorre con backtracking evaluando primero las reglas locales y, si no encuentra solución, diagnostica cada sesión pendiente con el número de tuplas que bloquea cada código. El ' + DOCS.doc3 + ' lo describe en detalle y la Figura B1 del ' + DOCS.doc2 + ' lo muestra como diagrama de actividades.'),
];

// ---------------------------------------------------------------------------------------------
const calidad = [
  H1('Análisis Final de Atributos de Calidad'),
  P('El Módulo 2 eligió la arquitectura por dos atributos que se oponen. El desempeño del motor (RNF-01 y RNF-02) pide pocas capas dentro del ciclo de búsqueda. La facilidad para cambiar reglas (RNF-03) pide separar cada regla en su clase. Con el sistema construido el equipo puede decir cómo quedó cada uno.'),
  H2('Desempeño y Escalabilidad'),
  P('RNF-01 pide generar el horario del conjunto de sustentación en 60 segundos o menos. RNF-02 pide procesar el triple de datos sin cambiar la estructura. Las mediciones del Módulo 2 ya mostraban mucho margen en 1x, 2x y 3x. En el Módulo 3 se repitieron sobre el código final y se extendieron a 5x y 10x con la prueba de estrés. El escenario de escalabilidad de la sección siguiente presenta los resultados.'),
  PEND('lectura de los resultados de docs/evidencias/estres/resumen.txt: margen frente a RNF-01, cumplimiento de RNF-02 y hasta qué escala se mantiene'),
  P('El primer cuello de botella identificado en el Módulo 2 fue el conteo inicial, que crece con N × |D| × |A| × F. Ese conteo sigue completo en el código final. Si el tiempo en 10x lo muestra como problema, la mejora identificada es precalcular por franja y su costo pasa a N × F × (|D| + |A|).'),
  H2('Modificabilidad'),
  P('RNF-03 pide agregar una regla sin modificar el motor. La construcción lo probó dos veces. La primera fue RD-09, la regla de demostración que prohíbe dos sesiones del mismo grupo el mismo día. La segunda fue RD-10, que entró al sistema de verdad. En ambos casos el cambio fue una clase nueva y una línea de registro. Los parámetros del semestre también se cambian sin recompilar desde la pantalla de parámetros o con PUT /api/parametros.'),
  H2('Explicabilidad y Seguridad'),
  P('RNF-04 pide que cada conflicto diga qué regla lo causó. Cada RestriccionDura trae su código y el motor cuenta cuántas tuplas bloquea cada uno. La API devuelve esas causas en el campo conflictos del Resultado y la reubicación rechazada devuelve los códigos RD que violaría. RNF-06 pide acceso restringido y trazabilidad de quién generó cada horario. Lo cubren el JWT del perfil administrador y la columna id_usuario de ejecucion_horario.'),
  H2('Usabilidad'),
  P('RNF-05 pide que una persona no técnica complete el ciclo en 10 minutos o menos con el manual. La interfaz sigue las tres pantallas del Módulo 2 con la técnica de selección asistida.'),
  PEND('prueba con usuarios de la interfaz construida (pendiente de la Tabla 5 del M2, responsable Martín Daniel Porto Gutiérrez) o declararla no realizada en el Acta de Cierre'),
];

// ---------------------------------------------------------------------------------------------
const escenarios = [
  H1('Escenarios de Atributos de Calidad'),
  P('Los escenarios siguen el formato de estímulo, contexto, respuesta y medida de respuesta (Bass et al., 2021). Cada medida se tomó sobre el sistema construido y cita el archivo de evidencia.'),
  H2('Escenario de Escalabilidad'),
  ...table(2, 'Escenario de escalabilidad', [2000, 7360], [
    ['Parte', 'Descripción'],
    ['Fuente', 'Coordinador académico con perfil administrador'],
    ['Estímulo', 'Genera el horario con 1x, 3x, 5x y 10x del conjunto de sustentación de 10 docentes, 5 aulas y 20 asignaturas'],
    ['Artefacto', 'MotorAsignacion con EstadoHorario indexado y orden de la sesión más restringida primero'],
    ['Contexto', 'Operación normal con los perfiles de datos holgado y exigente del Módulo 2'],
    ['Respuesta', 'El motor entrega el horario completo o el reporte de conflictos sin cambiar código ni estructura de datos'],
    ['Medida', 'Tiempo de 60 s o menos en 1x (RNF-01), sin cambios de estructura hasta 3x (RNF-02) y tiempo y nodos reportados hasta 10x'],
  ]),
  PEND('Tabla 3 con escala, sesiones, promedio, mediana y peor caso en ms y nodos, tomada de docs/evidencias/estres/resumen.txt y estres.csv'),
  PEND('párrafo de lectura de la Tabla 3 y entorno de medición de docs/evidencias/entorno.txt'),
  H2('Escenario de Modificabilidad'),
  ...table(4, 'Escenario de modificabilidad', [2000, 7360], [
    ['Parte', 'Descripción'],
    ['Fuente', 'Desarrollador del equipo de mantenimiento'],
    ['Estímulo', 'Agrega una restricción dura nueva (RD-09) y cambia el tope de matriculados de 40 a 35'],
    ['Artefacto', 'Paquete restricciones, ConfiguracionMotor y ConfiguracionParametros'],
    ['Contexto', 'Tiempo de desarrollo para la regla y tiempo de operación para el tope'],
    ['Respuesta', 'La regla se agrega creando una clase y registrándola. El tope se cambia como parámetro'],
    ['Medida', 'MotorAsignacion con cero líneas cambiadas en el diff de RD-09. Umbral de RV-01 igual a 39 sin recompilar'],
  ]),
  PEND('fragmento del diff de docs/evidencias/modificabilidad/rd09.diff con el conteo de líneas por archivo'),
  PEND('salida de docs/evidencias/modificabilidad/rv01_tope35.txt con el umbral 39 y los grupos marcados'),
];

// ---------------------------------------------------------------------------------------------
const qa = [
  H1('Informe de Calidad y Pruebas'),
  P('Las pruebas automáticas están en backend/src/test y corren con mvn verify en cada envío al repositorio mediante GitHub Actions. Se agrupan en dos paquetes. Las del paquete nucleo prueban el motor y las reglas sin Spring. Las del paquete api levantan la aplicación con H2 en modo PostgreSQL y prueban el sistema a través de la API con un token de administrador.'),
  H2('Pruebas Unitarias y de Integración'),
  PEND('Tabla 5 con clase de prueba, número de pruebas y resultado tomada de docs/evidencias/qa/pruebas_unitarias.txt'),
  H2('Pruebas de Restricciones y de Ruptura'),
  P('La guía pide demostrar que el sistema bloquea los choques de horario, aula y docente. El equipo preparó pruebas de ruptura que fuerzan cada error y comprueban la respuesta. La Tabla 6 resume qué fuerza cada una y qué debe responder el sistema.'),
  ...table(6, 'Pruebas de ruptura y respuesta esperada', [2200, 3700, 3460], [
    ['Prueba', 'Qué fuerza', 'Respuesta del sistema'],
    ['rupturaChoqueDocente (FlujoHorarioTest)', 'Mover una sesión a una franja donde su docente ya dicta', '409 RESTRICCION_VIOLADA con RD-01'],
    ['rupturaChoqueAula (FlujoHorarioTest)', 'Mover una sesión a un aula ocupada en esa franja', '409 RESTRICCION_VIOLADA con RD-02'],
    ['rupturaCapacidad (FlujoHorarioTest)', 'Mover un grupo grande a un aula pequeña', '409 RESTRICCION_VIOLADA con RD-06'],
    ['rupturaParcial (FlujoHorarioTest)', 'Generar el caso sobrerrestringido del Dr. Gómez', 'Horario PARCIAL con causas por código y exportación bloqueada con 409 HORARIO_PARCIAL'],
    ['rupturaCarga (FlujoHorarioTest)', 'Cargar archivos con filas inválidas', 'Cada fila rechazada con archivo, fila, código y motivo'],
    ['uniqueEnAsignacion (RestriccionesBaseDatosTest)', 'Insertar a mano un choque de docente y uno de aula en la base', 'PostgreSQL rechaza las dos filas por las restricciones UNIQUE'],
  ], { note: 'Los datos de ruptura están en datos/ruptura. Los choques directos se fuerzan sobre los datos de datos/demo.' }),
  PEND('fragmentos del log docs/evidencias/qa/ruptura.log que muestren el bloqueo de RD-01, RD-02 y RD-06 y la exportación parcial'),
  PEND('capturas 06_conflicto_pendiente y 07_reubicar de docs/evidencias/capturas'),
  H2('Pruebas de Estrés'),
  P('La prueba de estrés genera conjuntos de 1x, 3x, 5x y 10x con semillas fijas y ejecuta el motor con el mismo código del sistema. La corre el programa PruebaEstres en la integración continua y la prueba EstresTest en JUnit.'),
  PEND('resultados de docs/evidencias/estres/estres.csv (se presentan en la Tabla 3) y conclusión de carga masiva'),
];

// ---------------------------------------------------------------------------------------------
const T = (id, cond, req, comp, codigo, prueba) => [id, cond, req, comp, codigo, prueba];
const trazabilidad = [
  H1('Matriz de Trazabilidad Actualizada'),
  P('La Tabla 7 completa la cadena que la guía exige verificar. Cada condición del Módulo 1 va a su requisito, al componente del diseño del Módulo 2, a la clase o archivo del código y a la prueba que la comprueba. Las pruebas se nombran por su clase y su método en backend/src/test.'),
  ...table(7, 'Matriz de trazabilidad de requisito a prueba', [800, 1450, 1150, 1900, 2150, 1910], [
    ['ID', 'Condición del M1', 'Requisito', 'Componente M2', 'Código', 'Prueba'],
    T('RD-01', 'Choque de docente', 'RF-06, RF-07, RNF-04', 'RestriccionChoqueDocenteRD01 y EstadoHorario', 'restricciones/RestriccionChoqueDocenteRD01.java y UNIQUE uq_asignacion_docente_franja', 'RestriccionesDurasTest.choqueDocente, FlujoHorarioTest.rupturaChoqueDocente, RestriccionesBaseDatosTest.uniqueEnAsignacion'),
    T('RD-02', 'Choque de aula', 'RF-06, RF-07, RNF-04', 'RestriccionChoqueAulaRD02 y EstadoHorario', 'restricciones/RestriccionChoqueAulaRD02.java y UNIQUE uq_asignacion_aula_franja', 'RestriccionesDurasTest.choqueAula, FlujoHorarioTest.rupturaChoqueAula, RestriccionesBaseDatosTest.uniqueEnAsignacion'),
    T('RD-03', 'Solo franjas válidas', 'RF-06, RF-08', 'ConfiguracionParametros y FranjaHoraria', 'ConfiguracionParametros.generarFranjasValidas y validación de idFranja en ServicioHorarios.reubicar', 'ConfiguracionParametrosTest.grillaPorDefecto y sinCruzarBloqueo'),
    T('RD-04', 'Disponibilidad y habilitación', 'RF-01, RF-06, RNF-04', 'RestriccionDisponibilidadDocenteRD04', 'restricciones/RestriccionDisponibilidadDocenteRD04.java', 'RestriccionesDurasTest.disponibilidad'),
    T('RD-05', 'Características del aula', 'RF-02, RF-03, RF-06', 'RestriccionIdoneidadAulaRD05', 'restricciones/RestriccionIdoneidadAulaRD05.java', 'RestriccionesDurasTest.idoneidad'),
    T('RD-06', 'Capacidad del aula', 'RF-02, RF-04, RF-06', 'RestriccionCapacidadAulaRD06', 'restricciones/RestriccionCapacidadAulaRD06.java', 'RestriccionesDurasTest.capacidad, FlujoHorarioTest.rupturaCapacidad'),
    T('RD-07', 'De 1 a 4 sesiones', 'RF-03, RF-08', 'CargadorInventariosCSV, Curso y Sesion', 'CargadorInventariosCSV.cargarCursos y CHECK ck_curso_sesiones', 'CargadorInventariosCSVTest.cargaConErrores'),
    T('RD-08', 'Toda sesión asignada', 'RF-06, RF-07', 'MotorAsignacion, ResultadoAsignacion y ReporteConflicto', 'MotorAsignacion.generarHorario y ServicioHorarios.exportar', 'MotorAsignacionTest.sobrerrestringido, FlujoHorarioTest.rupturaParcial'),
    T('RD-10', 'Mismo docente por grupo', 'RF-06', 'Nueva en el M3', 'restricciones/RestriccionDocenteUnicoGrupoRD10.java', 'RestriccionesDurasTest.docenteUnico'),
    T('RV-01', 'Tope de 44 con techo', 'RF-04, RF-05, RF-08', 'ReglaTopeMatriculadosRV01 y ValidadorEntrada', 'ConfiguracionParametros.calcularUmbralMaximoGrupo', 'ReglasValidacionTest.topeMatriculados, ConfiguracionParametrosTest.umbralConTecho, ParametrosApiTest.tope35'),
    T('RV-02', 'Cierre con menos de 10', 'RF-04, RF-05', 'ReglaCierreMinimoRV02 y ValidadorEntrada', 'validacion/ReglaCierreMinimoRV02.java', 'ReglasValidacionTest.cierreMinimo'),
    T('Oper.', 'Carga de inventarios', 'RF-01 a RF-05', 'CargadorInventariosCSV', 'CargadorInventariosCSV, ControladorInventarios y ServicioInventarios', 'CargadorInventariosCSVTest.demoSinRechazos, FlujoHorarioTest.rupturaCarga'),
    T('Oper.', 'Parámetros del semestre', 'RF-08', 'ConfiguracionParametros', 'ControladorParametros y ServicioParametros', 'ParametrosApiTest.cierre20 e invalido'),
    T('Oper.', 'Exportar el horario', 'RF-09', 'ExportadorHorarioCSV', 'ExportadorHorarioCSV y GET /api/horarios/{id}/exportar', 'MotorAsignacionTest.exportacion, FlujoHorarioTest.flujoCompleto'),
    T('Oper.', 'Acceso restringido', 'RNF-06', 'Seguridad de Spring Boot', 'ConfiguracionSeguridad, FiltroJwt y ServicioJwt', 'SeguridadTest.sinToken, credencialesInvalidas, tokenAlterado y tokenValido'),
    T('Oper.', 'Ajuste asistido', 'RF-07', 'Selección asistida', 'ServicioHorarios.alternativas y reubicar', 'FlujoHorarioTest.reubicacionValida'),
    T('RNF-01', 'Tiempo de 60 s', 'RNF-01', 'MotorAsignacion y EstadoHorario', 'MotorAsignacion y app.motor.limite-ms', 'MotorAsignacionTest.demoCompleta, EstresTest'),
    T('RNF-02', 'Triple de datos', 'RNF-02', 'MotorAsignacion y EstadoHorario', 'PruebaEstres', 'EstresTest y docs/evidencias/estres'),
    T('RNF-03', 'Regla nueva sin tocar el motor', 'RNF-03', 'RestriccionDura y lista inyectada', 'ConfiguracionMotor y RestriccionMismoDiaRD09', 'ModificabilidadTest.nuevaRestriccion y cambioDeTope'),
    T('RNF-05', 'Uso por un no técnico', 'RNF-05', 'Tres pantallas de la interfaz', 'frontend', 'Prueba con usuarios'),
  ], { size: 15, note: 'Oper. = condición operativa que no viene del caso de estudio y se declara para que ningún requisito quede huérfano. RB-01 a RB-04 y RE-01 a RE-04 siguen fuera del MVP por decisión heredada del Módulo 1.' }),
  PEND('componentes del frontend de la fila RNF-05 y prueba con usuarios cuando exista la carpeta frontend'),
];

// ---------------------------------------------------------------------------------------------
const acta = [
  H1('Acta de Cierre y Lecciones Aprendidas'),
  H2('Alcance Realmente Logrado'),
  P('El sistema carga los cuatro inventarios en CSV y rechaza fila por fila lo que no cumple el formato. Valida los grupos con RV-01 y RV-02 antes de generar. Genera el horario con backtracking respetando RD-01 a RD-08 y RD-10. Cuando no encuentra solución entrega un horario parcial con las causas de cada sesión pendiente por código y bloquea la exportación. Permite reubicar una sesión con alternativas que filtra el motor y bloquea la reubicación que viola una regla. Exporta el horario completo en CSV. Todo esto se hace a través de una API protegida con JWT para el perfil administrador y queda registrado quién generó cada horario.'),
  PEND('confirmar al punto P3 que la interfaz web cubre las tres pantallas y el ciclo completo con las capturas 01 a 08'),
  H2('Brecha entre el Diseño y la Implementación'),
  P('La brecha más grande está en la persistencia. El diseño planteaba entidades JPA y el sistema usa repositorios con JdbcTemplate. El cambio no afecta al dominio pero sí al diagrama de componentes, que se actualizó en el Documento 2. La segunda brecha es el precálculo por franja del conteo inicial. Quedó como decisión pendiente en el Módulo 2 y el contrato del Módulo 3 lo incluía, pero el código final conserva el conteo completo. La tercera es RD-10, una regla que el Módulo 1 no tenía y que la construcción hizo visible. Las tres se explican en la Tabla 1.'),
  P('Los pendientes de la Tabla 5 del Módulo 2 quedaron así. El conteo factorizado no se implementó. El orden dinámico de sesiones no se comparó con el orden fijo. La prueba con usuarios de la interfaz construida se presenta en la sección de usabilidad o se declara no realizada.'),
  PEND('estado final de la prueba con usuarios y del precálculo por franja'),
  H2('Limitaciones Conocidas'),
  P('El motor no tiene verificación hacia adelante ni orden dinámico de sesiones. Todas las mediciones usan datos sintéticos del generador del equipo y un horario real puede tener restricciones más cruzadas. El intercambio es solo CSV y JSON quedó fuera. No hay restricciones blandas, de modo que el horario es válido pero no busca ser el mejor según preferencias. Solo existe el perfil administrador. Si los parámetros cambian después de generar un horario, ese horario ya no se puede consultar ni reubicar y el sistema pide generar uno nuevo con el código GRILLA_CAMBIADA.'),
  H2('Lecciones Aprendidas'),
  P('La primera lección es que medir antes de decidir evitó errores. El Módulo 2 mostró que el orden ingenuo era más rápido en promedio y aun así se mantuvo la heurística por su peor caso. La segunda es que un diseño con Strategy sí se puede extender sin miedo. RD-10 entró al final del proyecto y no rompió nada. La tercera es que un autodiagnóstico honesto paga. Los tres ajustes que el equipo se puso quedaron cerrados con pruebas. La cuarta es que las afirmaciones del documento deben salir de la evidencia y no al revés. Por eso este informe cita el archivo de cada cifra.'),
  PEND('lecciones propias del equipo sobre la integración del frontend y el trabajo en paralelo'),
];

const autoevaluacion = [
  H1('Autoevaluación del Equipo'),
  P('Lo que más facilitó esta entrega fue lo aprendido en Programación Orientada a Objetos y en Estructuras de Datos. Lo primero permitió que cada regla fuera una clase intercambiable y que RD-10 se agregara sin tocar el motor. Lo segundo permitió escoger mapas de ocupación por franja en lugar de recorrer listas. Bases de Datos fue la base del modelo y de las restricciones UNIQUE que bloquean los choques también en PostgreSQL. Ingeniería de Software dio el vocabulario de atributos de calidad y escenarios que organiza este informe. El tema técnico donde el equipo siente que le falta profundidad es la propagación de restricciones, como la verificación hacia adelante y la consistencia de arcos, que podría reducir el retroceso en casos más difíciles. También falta práctica en seguridad con JWT y en el desarrollo con Angular, que fueron nuevos para varios integrantes en este módulo.'),
  PEND('el equipo debe revisar y ajustar este párrafo con sus propias palabras antes de la entrega'),
];

const ia = [
  H1('Anexo. Uso de Inteligencia Artificial'),
  P('El equipo usó Claude, un asistente de inteligencia artificial de Anthropic, en dos sesiones de trabajo en paralelo. Una sesión se encargó del código y otra de los documentos. Las dos trabajaron sobre el mismo repositorio con un acuerdo técnico escrito en CONTRATO_M3.md. La Tabla 8 resume para qué se usó y qué validó el equipo a mano. La lógica combinatoria del motor viene del diseño del Módulo 2, que el equipo midió y defendió, y las decisiones de este módulo son responsabilidad del equipo.'),
  ...table(8, 'Uso de inteligencia artificial y validación del equipo', [2200, 3580, 3580], [
    ['Tarea', 'Uso de la herramienta', 'Validación manual del equipo'],
    ['Backend y API', 'Escritura de los servicios, controladores, repositorios, seguridad JWT y migraciones', 'Revisar cada restricción contra el Módulo 1 y ejecutar las pruebas en un equipo propio'],
    ['Pruebas', 'Escritura de las pruebas JUnit, de ruptura y de estrés', 'Leer qué fuerza cada prueba y confirmar que el resultado esperado es el correcto'],
    ['Interfaz web', 'Escritura de los componentes Angular', 'Recorrer el ciclo completo con los datos de demostración'],
    ['Documentos', 'Borradores de los cuatro documentos y actualización de los diagramas', 'Contrastar cada nombre con el código y cada cifra con su archivo de evidencia'],
  ]),
  PEND('el equipo confirma qué validó cada integrante y lo anota en la tercera columna'),
];

const referencias = [
  H1('Referencias'),
  ...refs([
    'Bass, L., Clements, P. y Kazman, R. (2021). <i>Software architecture in practice</i> (4.ª ed.). Addison-Wesley.',
    K.REF_EQUIPO_M2,
    K.REF_EQUIPO_M2_ANEXOS,
    'Lopez-Cruz, O. (s.f.-a). <i>Programación de horarios de clases</i> [Documento base del reto]. Universidad El Bosque.',
  ]),
];

const children = [...portada, ...intro, ...contexto, ...cambios, ...arquitectura, ...calidad, ...escenarios, ...qa, ...trazabilidad, ...acta, ...autoevaluacion, ...ia, ...referencias];
K.guardar(children, 'Informe de Ingeniería', process.argv[2] || 'PN2_Grupo5_Doc1_Informe.docx');
