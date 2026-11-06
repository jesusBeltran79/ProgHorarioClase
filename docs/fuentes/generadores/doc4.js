// Documento 4. Manual de Usuario para el administrador. Las capturas salen de docs/evidencias/capturas.
const path = require('path');
const L = require('./lib');
const K = require('./comun');
const { P, H1, H2, table } = L;
const { DOCS } = K;
const CAP = path.join(__dirname, '../../evidencias/capturas/');
const CAPU = path.join(__dirname, '../../evidencias/capturas_usuarios/');

let nFig = 0;
const captura = (archivo, titulo, nota) => { nFig += 1; return K.figuraAjustada(nFig, titulo, CAP + archivo, 6.5, 6.6, nota); };
const capturaU = (archivo, titulo, nota) => { nFig += 1; return K.figuraAjustada(nFig, titulo, CAPU + archivo, 6.5, 6.6, nota); };

const portada = K.portada('Manual de Usuario del Motor de Asignación Automática de Horarios de Clases',
  'Documento 4 de la Entrega Final del Módulo 3. Guía del Administrador y del Docente');

const intro = [
  H1('Introducción'),
  P('Este manual guía al coordinador académico con perfil administrador por todo el ciclo del sistema. Empieza en el inicio de sesión y termina en la exportación del horario. No hace falta saber programar para seguirlo. Al final hay una sección para el administrador sobre la gestión de datos y cuentas desde la interfaz y otra para los docentes, que entran con su propia cuenta. Para instalar el sistema se usa el ' + DOCS.doc3 + '. Las decisiones de diseño detrás de cada pantalla se explican en el ' + DOCS.doc1 + '.'),
  P('El ciclo tiene siete pasos. Iniciar sesión, cargar los datos, revisar la validación, ajustar los parámetros, generar el horario, resolver los conflictos y exportar. Las capturas de este manual son pantallas reales del sistema tomadas con los datos de demostración de la carpeta datos/demo, que tienen 10 docentes, 5 aulas, 20 cursos y 21 grupos.'),
  H2('Antes de Empezar'),
  P('El sistema debe estar instalado y en marcha. Con la instalación por defecto se abre en el navegador la dirección http://localhost:4200. Además se necesitan los cuatro archivos de la Tabla 1 en formato CSV con codificación UTF-8. Se pueden preparar en una hoja de cálculo y guardar como CSV separado por comas.'),
  ...table(1, 'Archivos que necesita el administrador', [2000, 7360], [
    ['Archivo', 'Contenido'],
    ['docentes.csv', 'Cada docente con su identificador, nombre, dedicación, escalafón y las franjas en que puede dictar. Las franjas se escriben como día y hora separadas por punto y coma, por ejemplo MAR 07:00;MIE 09:00. La palabra TODAS equivale a todas las franjas'],
    ['aulas.csv', 'Cada aula con su identificador, su capacidad y sus características. Hoy existen COMPUTADORES y SILLAS_MOVILES'],
    ['cursos.csv', 'Cada curso con su número de sesiones semanales de 1 a 4, las características que exige del aula y los docentes habilitados. Si no se indica ningún docente cualquiera puede dictarlo'],
    ['grupos.csv', 'Cada grupo con su curso y el número de matriculados'],
  ], { note: 'El encabezado exacto de cada archivo y un ejemplo de fila están en la Tabla 23 del Documento 3.' }),
];

const pasos = [
  H1('Paso 1. Iniciar Sesión'),
  P('La primera pantalla pide usuario y contraseña. El sistema tiene dos perfiles. El administrador entra a la pantalla de carga y el docente entra directo a Mi horario. En una instalación nueva el usuario es admin y la contraseña es Horarios2026*, a menos que quien instaló el sistema la haya cambiado. Se escriben los datos y se presiona Ingresar. Si los datos no son correctos el sistema lo avisa y no deja pasar.'),
  ...captura('01_login.png', 'Pantalla de inicio de sesión', 'La misma pantalla sirve para los perfiles administrador y docente.'),
  P('Una vez dentro el administrador ve a la izquierda la sección Crear el horario con los tres pasos del trabajo, Importar CSV y validar, Parámetros y Generar y resolver, cada uno con una línea que dice para qué sirve. Debajo está la sección Datos del semestre con Docentes, Aulas, Materias y grupos y Usuarios. Abajo del menú está el usuario con el que se entró y la opción Cerrar sesión. La sesión dura ocho horas. Después el sistema pide entrar de nuevo.'),

  H1('Paso 2. Cargar los Datos'),
  P('En la pantalla Cargar inventarios y validar datos hay un recuadro por cada archivo con lo que debe contener. Se presiona el botón Elegir de cada recuadro y se selecciona el archivo correspondiente. El recuadro se pone verde con el nombre del archivo y arriba se indica cuántos de los cuatro van elegidos. Cuando estén los cuatro se presiona Cargar y validar. El sistema lee los cuatro archivos de una vez y muestra el resultado debajo.'),
  P('Hay que tener en cuenta que una carga nueva reemplaza los datos anteriores y también borra el historial de horarios generados. Si se quiere conservar un horario se debe exportar antes de cargar datos nuevos.'),
  ...captura('02_carga_validacion.png', 'Carga de inventarios y resultado de la validación', 'Con los datos de demostración se cargan 10 docentes, 5 aulas, 20 cursos y 21 grupos, que dan 42 sesiones por asignar.'),

  H1('Paso 3. Revisar la Validación'),
  P('El resultado de la carga muestra dos tipos de mensaje. Los rechazos son filas que no se cargaron. Cada rechazo dice el archivo, el número de fila, un código y el motivo. El código FORMATO indica un dato vacío, repetido o mal escrito. REFERENCIA indica un identificador que no existe en otro archivo, como un grupo de un curso que no está en cursos.csv. RD-03 indica una franja que no existe y RD-07 un curso con un número de sesiones fuera del rango. Las demás filas sí se cargan. Para corregir un rechazo se arregla la fila en el archivo y se vuelve a cargar.'),
  ...captura('11_carga_con_errores.png', 'Carga con filas rechazadas', 'Cada fila rechazada aparece con su archivo, su número, su código y el motivo en lenguaje claro.'),
  P('Los avisos de la revisión de grupos son grupos que sí se cargaron pero que conviene revisar. RV-01 marca un grupo que supera el tope de matriculados con su tolerancia, que por defecto es 44. RV-02 marca un grupo con menos de 10 matriculados para un posible cierre. Los avisos no detienen la generación. Dividir un grupo o cerrarlo son trámites administrativos que se hacen fuera del sistema.'),

  H1('Paso 4. Ajustar los Parámetros'),
  P('Se presiona Continuar a parámetros o Parámetros en el menú. La pantalla tiene dos partes. A la izquierda están las reglas de grupos y sesiones. El tope de estudiantes por grupo, la tolerancia sobre el tope, el mínimo para no cerrar un grupo, el máximo de sesiones semanales y la duración de cada sesión. Debajo de los campos el sistema muestra a partir de cuántos estudiantes un grupo se marca por exceso (umbral de RV-01). Si hay cambios sin guardar aparece un aviso junto al botón Guardar parámetros. A la derecha está el horario de la semana con la hora de apertura, el cierre de lunes a viernes, el cierre del sábado y el rango del mediodía sin clases.'),
  P('Debajo del horario de la semana aparece la grilla de franjas válidas con un chulo en cada franja que existe. Con los valores por defecto son 32. Si se cambia un valor y se presiona Guardar parámetros la grilla se recalcula. Por ejemplo, si el cierre de lunes a viernes pasa a las 20:00 quedan 27 franjas. Los cambios se aplican en la siguiente generación. Un horario generado antes de cambiar la grilla ya no se puede modificar y hay que generar uno nuevo.'),
  ...captura('03_parametros.png', 'Parámetros del semestre y franjas válidas', 'La grilla de la derecha muestra las 32 franjas válidas con los valores por defecto.'),

  H1('Paso 5. Generar el Horario'),
  P('Se presiona Continuar a generar o Generar y resolver en el menú y luego el botón Generar horario. Con los datos de demostración el sistema responde en una fracción de segundo. En la parte superior aparece el estado. COMPLETO quiere decir que todas las sesiones quedaron ubicadas sin violar ninguna restricción. PARCIAL quiere decir que algunas sesiones no tienen lugar y hay que resolverlas en el paso siguiente. Debajo del estado se ven el número del horario, quién lo generó, la fecha, el tiempo y las combinaciones que revisó el motor.'),
  ...captura('04_horario_completo.png', 'Horario generado completo', 'Grilla semanal con las 42 sesiones. Cada bloque muestra el curso, el grupo, la sesión, el aula y el docente.'),
  P('La grilla muestra los días en columnas y las franjas en filas. Las celdas grises no son franjas válidas, como el mediodía o el sábado en la tarde. La lista Ver por permite mirar todo el horario o solo el de un aula, un docente o un grupo. La lista de la parte superior derecha permite volver a un horario generado antes.'),
  ...captura('05_vista_por_aula.png', 'Horario visto por aula', 'La misma ejecución filtrada para el aula A101.'),

  H1('Paso 6. Resolver los Conflictos y Ajustar el Horario'),
  P('Si el horario quedó PARCIAL aparece a la derecha el panel Sesiones pendientes. Al seleccionar una sesión pendiente el sistema muestra las causas detectadas. Cada causa tiene su código y el número de opciones que bloquea. En el ejemplo de la Figura 7 la sesión 2 de Cálculo II no tiene lugar porque el único docente habilitado no está disponible en casi ninguna franja (RD-04), porque el grupo debe conservar el mismo docente (RD-10) y porque varias aulas son pequeñas para 35 estudiantes (RD-06).'),
  ...captura('06_conflicto_pendiente.png', 'Sesión pendiente con sus causas por código', 'Las causas se ordenan de la que más opciones bloquea a la que menos.'),
  P('Debajo de las causas hay dos listas. Alternativas válidas son ubicaciones que cumplen todas las restricciones. Requieren liberar otra sesión son ubicaciones que solo fallan porque otra sesión ya ocupa el docente o el aula, y muestran el código RD-01 o RD-02 que habría que liberar. Para usar una alternativa válida se marca y se presiona Aplicar alternativa. Si no hay alternativas válidas hay que mover primero la sesión que estorba o corregir los datos, por ejemplo ampliando la disponibilidad del docente, y volver a generar.'),
  P('El mismo panel sirve para ajustar un horario completo. Al hacer clic en cualquier sesión de la grilla aparecen sus alternativas y las celdas a donde se puede mover quedan resaltadas en la grilla. Se escoge una y se presiona Aplicar alternativa. El horario sigue completo después del cambio.'),
  ...captura('07_reubicar.png', 'Reubicación asistida de una sesión', 'La sesión seleccionada queda marcada en la grilla y las celdas resaltadas en verde son los destinos posibles.'),
  P('La opción Asignación manual permite escoger a mano la franja, el aula y el docente. El sistema revisa todas las restricciones antes de aceptar el cambio. Si la combinación viola alguna, la rechaza y muestra los códigos de las reglas que se violarían. En la Figura 9 se intentó poner un grupo de 40 estudiantes en un aula de 32 puestos.'),
  ...captura('09_ruptura_capacidad.png', 'Asignación manual bloqueada', 'El sistema rechaza el cambio con RD-06 porque el aula es pequeña y con RD-02 porque ya está ocupada en esa franja.'),
  P('La forma más rápida de mover una sesión es arrastrarla. Se mantiene presionado el botón del ratón sobre la sesión y las celdas válidas se marcan con un borde verde punteado. Se suelta la sesión en una de esas celdas y el sistema la mueve. Si se suelta en una celda que no es válida el sistema no hace el cambio y muestra el código de la regla que se violaría. Las sesiones del panel Sesiones pendientes también se pueden arrastrar a la grilla.'),
  ...capturaU('u05_horario_celdas_sugeridas.png', 'Celdas válidas resaltadas antes de arrastrar', 'Al tomar la sesión las celdas con borde verde son los lugares donde puede quedar sin violar ninguna regla.'),
  ...capturaU('u06_horario_movido_arrastrando.png', 'Sesión movida arrastrándola a otra celda', 'El aviso verde confirma la reubicación y el horario sigue COMPLETO.'),

  H1('Paso 7. Exportar el Horario'),
  P('Cuando el horario está COMPLETO se presiona Exportar CSV. El navegador descarga el archivo con una fila por sesión y las columnas curso, grupo, sesión, docente, aula, día, hora de inicio y hora de fin. El archivo se puede abrir con cualquier hoja de cálculo. No incluye datos personales de estudiantes.'),
  ...captura('08_exportar.png', 'Exportación del horario', 'El aviso verde confirma la descarga del archivo horario_1.csv.'),
  P('Si el horario está PARCIAL el sistema no permite exportar y muestra el aviso HORARIO_PARCIAL. Un horario con sesiones sin asignar no cumple RD-08 y no debe publicarse. Primero se resuelven las sesiones pendientes como en el paso anterior.'),
  ...captura('10_exportar_bloqueado.png', 'Exportación bloqueada de un horario parcial', 'El botón de exportar aparece en rojo y el aviso explica qué falta.'),
];

const publicar = [
  H1('Paso 8. Publicar el Horario'),
  P('Cuando el horario está COMPLETO aparece el botón Publicar al lado de Generar horario. Al presionarlo los docentes pueden ver sus sesiones en su portal. Solo puede haber un horario publicado. Si se publica otro el anterior deja de estar publicado. Un horario PARCIAL no se puede publicar y el sistema muestra el aviso HORARIO_PARCIAL.'),
  ...capturaU('u07_horario_publicado.png', 'Horario publicado', 'La etiqueta Publicado a los docentes reemplaza al botón y el historial marca la ejecución como publicada.'),
];

const gestion = [
  H1('Gestión de Datos desde la Interfaz'),
  P('Además de cargar los archivos CSV el administrador puede crear, editar y borrar los datos uno por uno en la sección Gestión del menú. Las pantallas usan las mismas reglas que la carga por archivo. Antes de guardar el sistema avisa que se borrarán los horarios generados, porque un horario hecho con datos viejos ya no sirve. Después del cambio hay que generar de nuevo.'),
  H2('Docentes'),
  P('La pantalla Docentes muestra la tabla de docentes con un buscador. El botón Nuevo docente abre un formulario a la derecha con el código, el nombre, la dedicación y el escalafón. Debajo está la grilla de disponibilidad. Cada casilla es una franja válida. Se hace clic en una casilla para marcarla o se arrastra el ratón con el botón presionado para pintar varias de una vez. Los botones Todas y Ninguna marcan o limpian toda la grilla. Las casillas rayadas no son franjas válidas.'),
  ...capturaU('u01_docente_nuevo_disponibilidad.png', 'Nuevo docente con su disponibilidad pintada', 'Las casillas verdes son las franjas en que el docente puede dictar.'),
  H2('Aulas'),
  P('La pantalla Aulas funciona igual. Cada aula tiene su código, su capacidad y las casillas Computadores y Sillas móviles.'),
  H2('Materias y Grupos'),
  P('A la izquierda está la lista de materias. Al escoger una se ven su código, su nombre, sus sesiones por semana y los requisitos de aula. Los docentes habilitados se asignan arrastrando. La lista Docentes del catálogo tiene los docentes que todavía no pueden dictar la materia y la lista Habilitados tiene los que sí. Se arrastra una ficha de una lista a la otra y se presiona Guardar materia. Si la lista Habilitados queda vacía cualquier docente puede dictarla.'),
  P('Debajo aparecen los grupos de la materia. Se puede cambiar el número de matriculados, borrar un grupo o agregar uno nuevo. Cada grupo tiene tantas sesiones como diga la materia.'),
  ...capturaU('u03_materia_arrastrar_docente.png', 'Docente habilitado arrastrándolo a la lista de habilitados', 'D90 pasó de Docentes del catálogo a Habilitados para esta materia.'),
  H2('Usuarios'),
  P('La pantalla Usuarios muestra las cuentas con su perfil y su estado. Para crear una cuenta se escribe el usuario, se escoge el perfil y una contraseña inicial de al menos 8 caracteres. Si el perfil es DOCENTE se escoge el docente al que queda ligada. La lista solo muestra docentes que todavía no tienen cuenta. En cada fila se puede activar o desactivar la cuenta, restablecer la contraseña o borrarla. El sistema no deja borrar ni desactivar la propia cuenta ni al último administrador activo.'),
  ...capturaU('u04_usuarios.png', 'Cuentas de usuario por perfil', 'La cuenta docente.d03 quedó ligada a la docente D03.'),
];

const portal = [
  H1('Guía para el Docente'),
  P('El docente entra con el usuario y la contraseña que le dio la coordinación. Su menú tiene tres opciones. Mi horario, Mi disponibilidad y Mi cuenta. El docente no puede generar horarios ni ver los datos de otros docentes.'),
  H2('Mi Horario'),
  P('Muestra solo las sesiones del docente en el horario que publicó la coordinación. Arriba está la grilla de la semana y abajo un listado con el día, la hora, la materia, el grupo y el aula. Si todavía no hay horario publicado aparece un aviso.'),
  ...capturaU('u08_mi_horario.png', 'Horario publicado visto por la docente', 'La docente D03 ve sus seis sesiones con el aula y el número de estudiantes.'),
  H2('Mi Disponibilidad'),
  P('Es la misma grilla de casillas del administrador. El docente pinta las franjas en que puede dictar y presiona Guardar. El horario publicado no cambia. La coordinación usa la nueva disponibilidad la próxima vez que genere.'),
  ...capturaU('u09_mi_disponibilidad.png', 'Disponibilidad marcada por el docente', 'Las casillas verdes se guardan y se aplican en la siguiente generación.'),
  H2('Mi Cuenta'),
  P('Muestra el usuario, el perfil y el docente ligado. Para cambiar la contraseña se escribe la actual y dos veces la nueva, que debe tener al menos 8 caracteres. Si la actual no coincide el sistema muestra CONTRASENA_INCORRECTA.'),
];

const mensajes = [
  H1('Mensajes Frecuentes'),
  ...table(2, 'Mensajes del sistema y qué hacer', [3600, 5760], [
    ['Mensaje', 'Qué hacer'],
    ['El usuario o la contraseña no son correctos', 'Revisar los datos de ingreso. Si se olvidó la clave hay que pedir al responsable técnico que la restablezca'],
    ['Debe iniciar sesión para usar esta función', 'La sesión venció. Volver a iniciar sesión'],
    ['No hay sesiones para asignar. Cargue primero los inventarios', 'Hacer el paso 2'],
    ['El sistema bloqueó la reubicación porque viola RD-xx', 'Elegir otra alternativa de la lista. El código dice qué regla se violaría'],
    ['El horario tiene sesiones sin asignar y no cumple RD-08', 'Resolver las sesiones pendientes antes de exportar'],
    ['La grilla de franjas cambió después de esta ejecución', 'Generar un horario nuevo con los parámetros vigentes'],
    ['Todavía no hay un horario publicado', 'El docente debe esperar a que la coordinación publique el horario'],
    ['El docente ya tiene la cuenta ...', 'Cada docente tiene una sola cuenta. Usar la que ya existe o borrarla primero'],
    ['Debe quedar al menos un ADMIN activo', 'Crear o activar otro administrador antes de desactivar o borrar este'],
    ['La contraseña debe tener al menos 8 caracteres', 'Escribir una contraseña más larga'],
  ]),
  H1('Significado de los Códigos'),
  ...table(3, 'Códigos de las reglas que muestra el sistema', [1400, 7960], [
    ['Código', 'Significado'],
    ['RD-01', 'El docente ya tiene otra sesión en esa franja'],
    ['RD-02', 'El aula ya tiene otra sesión en esa franja'],
    ['RD-03', 'La franja no pertenece a la grilla de franjas válidas'],
    ['RD-04', 'El docente no está disponible en esa franja o no está habilitado para el curso'],
    ['RD-05', 'El aula no tiene las características que exige el curso'],
    ['RD-06', 'La capacidad del aula es menor que los matriculados del grupo'],
    ['RD-07', 'El curso debe tener entre 1 y 4 sesiones semanales'],
    ['RD-08', 'Toda sesión debe quedar asignada para que el horario sea válido'],
    ['RD-10', 'Las sesiones de un grupo deben tener el mismo docente'],
    ['RV-01', 'El grupo supera el tope de matriculados con su tolerancia'],
    ['RV-02', 'El grupo tiene menos matriculados que el mínimo y se marca para cierre'],
  ], { note: 'Los textos son los del catálogo de restricciones del sistema.' }),
];

K.guardar([...portada, ...intro, ...pasos, ...publicar, ...gestion, ...portal, ...mensajes], 'Manual de Usuario', process.argv[2] || 'PN2_Grupo5_Doc4_ManualUsuario.docx');
