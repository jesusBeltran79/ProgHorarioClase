// Piezas comunes de los cuatro documentos del Módulo 3 (portada, marcadores y armado).
const fs = require('fs');
const L = require('./lib');
const { d, C, PB, FONT } = L;

const REPO = 'https://github.com/jesusBeltran79/ProgHorarioClase';
const FECHA = '5 de noviembre de 2026';
const VIDEO = '[ENLACE DEL VIDEO]';

const DOCS = {
  doc1: 'Documento 1. Informe de Ingeniería (PN2_Grupo5_Doc1_Informe.pdf)',
  doc2: 'Documento 2. Anexos Técnicos (PN2_Grupo5_Doc2_Anexos.pdf)',
  doc3: 'Documento 3. Manual Técnico (PN2_Grupo5_Doc3_ManualTecnico.pdf)',
  doc4: 'Documento 4. Manual de Usuario (PN2_Grupo5_Doc4_ManualUsuario.pdf)',
};

// Marcador visible para lo que depende de una evidencia que todavía no existe.
function PEND(texto) {
  return new d.Paragraph({ spacing: { line: 480 }, indent: { firstLine: 720 }, children: [
    new d.TextRun({ text: `[PENDIENTE: ${texto}]`, font: FONT, size: 24, bold: true, color: 'C00000' })] });
}

function portada(titulo, subtitulo, extra = []) {
  return [
    C('', { before: 2000 }),
    C(`<b>${titulo}</b>`),
    C(subtitulo),
    ...extra,
    C(''),
    C('Jesús David Beltrán Zárate'),
    C('Juan Sebastián Albarracín Isaza'),
    C('Daniel Felipe Delgadillo Sepúlveda'),
    C('Martín Daniel Porto Gutiérrez'),
    C(''),
    C('Programa de Ingeniería de Sistemas, Facultad de Ingeniería, Universidad El Bosque'),
    C('Proyecto Núcleo 2 (15319), 2026-2, Grupo 5'),
    C('Ing. Samuel Galindo Pinzón'),
    C(FECHA),
    C(''),
    C(`Repositorio ${REPO}`),
    C('Normas APA 7.ª edición'),
    PB(),
  ];
}

// Recibe una lista de párrafos o una lista de secciones { children, horizontal }.
// Las secciones horizontales sirven para los diagramas anchos.
function guardar(contenido, titulo, salida) {
  const esSecciones = contenido.length && contenido[0] && Array.isArray(contenido[0].children);
  const secciones = esSecciones ? contenido : [{ children: contenido }];
  const margen = { top: 1440, bottom: 1440, left: 1440, right: 1440 };
  const doc = new d.Document({
    creator: 'Grupo 5', title: titulo,
    styles: { default: { document: { run: { font: FONT, size: 24 } } } },
    sections: secciones.map(sec => ({
      properties: { page: sec.horizontal
        ? { size: { width: 12240, height: 15840, orientation: d.PageOrientation.LANDSCAPE }, margin: margen }
        : { size: { width: 12240, height: 15840 }, margin: margen } },
      headers: { default: L.header() }, children: sec.children })),
  });
  return d.Packer.toBuffer(doc).then(b => { fs.writeFileSync(salida, b); console.log('ok', salida); });
}

// Figura que cabe en un área máxima en pulgadas (ancho y alto) sin deformarse.
function figuraAjustada(n, titulo, ruta, maxAncho, maxAlto, nota) {
  const buf = fs.readFileSync(ruta);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  const ancho = Math.min(maxAncho, maxAlto * w / h);
  return L.figure(n, titulo, ruta, ancho, nota ? { note: nota } : {});
}

// Referencias que comparten los cuatro documentos.
const REF_EQUIPO_M2 = 'Beltrán Zárate, J. D., Albarracín Isaza, J. S., Delgadillo Sepúlveda, D. F. y Porto Gutiérrez, M. D. (2026c). <i>Documento de diseño de software del motor de asignación automática de horarios de clases. Documento maestro del entregable 2.3</i> [Informe de curso no publicado]. Universidad El Bosque.';
const REF_EQUIPO_M2_ANEXOS = 'Beltrán Zárate, J. D., Albarracín Isaza, J. S., Delgadillo Sepúlveda, D. F. y Porto Gutiérrez, M. D. (2026d). <i>Documento de anexos del entregable 2.3</i> [Informe de curso no publicado]. Universidad El Bosque.';

module.exports = { REPO, FECHA, VIDEO, DOCS, PEND, portada, guardar, figuraAjustada, REF_EQUIPO_M2, REF_EQUIPO_M2_ANEXOS };
