// Documento 4. Manual de Usuario para el administrador. Las capturas salen de docs/evidencias/capturas (punto P2).
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const K = require('./comun');
const { P, H1, H2, figure, table } = L;
const { PEND, DOCS } = K;
const CAP = path.join(__dirname, '../../evidencias/capturas/');

let nFig = 0;
const captura = (archivo, titulo, nota) => {
  nFig += 1;
  return fs.existsSync(CAP + archivo)
    ? figure(nFig, titulo, CAP + archivo, 6.0, { note: nota })
    : [PEND(`captura ${archivo} de docs/evidencias/capturas`)];
};

const portada = K.portada('Manual de Usuario del Motor de Asignación Automática de Horarios de Clases',
  'Documento 4 de la Entrega Final del Módulo 3. Guía del Administrador');

const intro = [
  H1('Introducción'),
  P('Este manual guía al coordinador académico con perfil administrador por todo el ciclo del sistema. Empieza en el inicio de sesión y termina en la exportación del horario. No hace falta saber programar para seguirlo. Para instalar el sistema se usa el ' + DOCS.doc3 + '. Las decisiones de diseño detrás de cada pantalla se explican en el ' + DOCS.doc1 + '.'),
  P('El ciclo tiene siete pasos. Iniciar sesión, cargar los datos, revisar la validación, ajustar los parámetros, generar el horario, resolver los conflictos y exportar. Cada paso tiene una sección con su captura de pantalla.'),
  ...table(1, 'Archivos que necesita el administrador', [2000, 7360], [
    ['Archivo', 'Contenido'],
    ['docentes.csv', 'Cada docente con su nombre, dedicación, escalafón y las franjas en que puede dictar'],
    ['aulas.csv', 'Cada aula con su capacidad y sus características, como COMPUTADORES'],
    ['cursos.csv', 'Cada curso con su número de sesiones semanales, lo que exige del aula y los docentes habilitados'],
    ['grupos.csv', 'Cada grupo con su curso y el número de matriculados'],
  ], { note: 'El formato exacto de cada archivo está en la Tabla 23 del Documento 3. La carpeta datos/demo del repositorio trae un ejemplo completo con 10 docentes, 5 aulas y 20 asignaturas.' }),
];

const pasos = [
  H1('Paso 1. Iniciar Sesión'),
  ...captura('01_login.png', 'Pantalla de inicio de sesión', 'Solo el perfil administrador puede entrar.'),
  PEND('redacción del paso con la pantalla real'),
  H1('Paso 2. Cargar los Datos'),
  ...captura('02_carga_validacion.png', 'Carga de inventarios y resultado de la validación', 'Los rechazos aparecen por archivo y fila con su código.'),
  PEND('redacción del paso con la pantalla real'),
  H1('Paso 3. Revisar la Validación'),
  P('Después de cargar, el sistema muestra dos tipos de mensaje. Los rechazos son filas que no se cargaron porque tienen un error de formato o una referencia que no existe. Los hallazgos son grupos que sí se cargaron pero que el coordinador debe revisar. RV-01 marca un grupo que supera el tope de matriculados con su tolerancia. RV-02 marca un grupo con menos de 10 matriculados para un posible cierre. Los hallazgos no impiden generar. Dividir un grupo o cambiar la matrícula son trámites administrativos fuera del sistema.'),
  PEND('redacción ajustada a la pantalla real'),
  H1('Paso 4. Ajustar los Parámetros'),
  ...captura('03_parametros.png', 'Parámetros del semestre y franjas válidas', 'La vista previa recalcula las franjas cuando cambia la ventana de oferta.'),
  PEND('redacción del paso con la pantalla real'),
  H1('Paso 5. Generar el Horario'),
  ...captura('04_horario_completo.png', 'Horario generado completo', 'Grilla semanal con las franjas válidas.'),
  ...captura('05_vista_por_aula.png', 'Horario visto por aula', 'La misma grilla filtrada por un aula.'),
  PEND('redacción del paso con la pantalla real'),
  H1('Paso 6. Resolver los Conflictos'),
  ...captura('06_conflicto_pendiente.png', 'Sesión pendiente con sus causas por código', 'Cada causa dice cuántas opciones bloquea.'),
  ...captura('07_reubicar.png', 'Reubicación asistida de una sesión', 'El sistema solo ofrece alternativas válidas o que liberan un choque.'),
  PEND('redacción del paso con la pantalla real'),
  H1('Paso 7. Exportar el Horario'),
  ...captura('08_exportar.png', 'Exportación del horario en CSV', 'La exportación solo se habilita cuando el horario está completo (RD-08).'),
  PEND('redacción del paso con la pantalla real'),
];

const mensajes = [
  H1('Mensajes Frecuentes'),
  ...table(2, 'Mensajes del sistema y qué hacer', [3400, 5960], [
    ['Mensaje', 'Qué hacer'],
    ['Debe iniciar sesión para usar esta función', 'La sesión venció. Volver a iniciar sesión'],
    ['No hay sesiones para asignar', 'Cargar primero los cuatro archivos'],
    ['El sistema bloqueó la reubicación porque viola RD-xx', 'Elegir otra alternativa de la lista. El código dice qué regla se violaría'],
    ['El horario tiene sesiones sin asignar y no cumple RD-08', 'Resolver las sesiones pendientes antes de exportar'],
    ['La grilla de franjas cambió después de esta ejecución', 'Generar un horario nuevo con los parámetros vigentes'],
  ]),
];

K.guardar([...portada, ...intro, ...pasos, ...mensajes], 'Manual de Usuario', process.argv[2] || 'PN2_Grupo5_Doc4_ManualUsuario.docx');
