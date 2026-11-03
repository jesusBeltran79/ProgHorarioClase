const fs = require('fs');
const d = require('docx');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType,
  ShadingType, ImageRun, Header, PageNumber, PageBreak, BorderStyle, PageOrientation, HeadingLevel,
  TableLayoutType, VerticalAlign, ExternalHyperlink } = d;

const FONT = 'Times New Roman';
const LINE_BODY = 480;          // doble espacio APA
function runs(text, base = {}) {
  // marcado mínimo <b>..</b> <i>..</i> <c>..</c> (código)
  const out = [];
  const re = /<(b|i|c)>(.*?)<\/\1>/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), font: FONT, size: base.size || 24, bold: base.bold, italics: base.italics }));
    const o = { text: m[2], font: m[1] === 'c' ? 'Courier New' : FONT, size: m[1] === 'c' ? (base.size || 24) - 2 : (base.size || 24), bold: base.bold || m[1] === 'b', italics: base.italics || m[1] === 'i' };
    out.push(new TextRun(o));
    last = re.lastIndex;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), font: FONT, size: base.size || 24, bold: base.bold, italics: base.italics }));
  return out;
}
const P = (t, o = {}) => new Paragraph({ children: runs(t, o), alignment: o.align || AlignmentType.LEFT,
  indent: o.noIndent ? undefined : { firstLine: 720 }, spacing: { line: o.line || LINE_BODY, after: o.after || 0, before: o.before || 0 }, keepNext: o.keepNext });
const H1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, keepNext: true,
  spacing: { line: LINE_BODY, before: 240 }, children: [new TextRun({ text: t, font: FONT, size: 24, bold: true, color: '000000' })] });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { line: LINE_BODY, before: 120 },
  children: [new TextRun({ text: t, font: FONT, size: 24, bold: true, color: '000000' })] });
const H3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, keepNext: true, spacing: { line: LINE_BODY },
  children: [new TextRun({ text: t, font: FONT, size: 24, bold: true, italics: true, color: '000000' })] });
const C = (t, o = {}) => new Paragraph({ children: runs(t, o), alignment: AlignmentType.CENTER, spacing: { line: o.line || LINE_BODY, after: o.after || 0, before: o.before || 0 } });
const PB = () => new Paragraph({ children: [new PageBreak()] });
const border = { style: BorderStyle.SINGLE, size: 4, color: '808080' };
const noB = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

function label(kind, n, title) {
  return [new Paragraph({ keepNext: true, spacing: { before: 240, line: 240, after: 60 }, children: [new TextRun({ text: `${kind} ${n}`, font: FONT, size: 24, bold: true })] }),
    new Paragraph({ keepNext: true, spacing: { line: 240, after: 120 }, children: [new TextRun({ text: title, font: FONT, size: 24, italics: true })] })];
}
function note(t) { return new Paragraph({ spacing: { line: 240, before: 80, after: 240 }, children: [new TextRun({ text: 'Nota. ', font: FONT, size: 20, italics: true }), ...runs(t, { size: 20 })] }); }

function table(n, title, widths, rows, opts = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const sz = opts.size || 18;
  const trs = rows.map((r, i) => new TableRow({ tableHeader: i === 0, cantSplit: true,
    children: r.map((c, j) => new TableCell({ width: { size: widths[j], type: WidthType.DXA },
      margins: { top: 50, bottom: 50, left: 80, right: 80 },
      shading: i === 0 ? { type: ShadingType.CLEAR, fill: 'E7ECF3', color: 'auto' } : undefined,
      borders: { top: border, bottom: border, left: border, right: border },
      children: String(c).split('\n').map(line => new Paragraph({ spacing: { line: 240, after: 20 }, children: runs(line, { size: sz, bold: i === 0 }) })) })) }));
  const out = [];
  if (n) out.push(...label('Tabla', n, title));
  out.push(new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, rows: trs }));
  if (opts.note) out.push(note(opts.note)); else out.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  return out;
}
function figure(n, title, path, widthIn, opts = {}) {
  const buf = fs.readFileSync(path);
  const { w, h } = pngSize(buf);
  const wpx = widthIn * 96, hpx = Math.round(wpx * h / w);
  const out = label('Figura', n, title);
  out.push(new Paragraph({ alignment: AlignmentType.CENTER, keepNext: !!opts.note, children: [new ImageRun({ type: 'png', data: buf, transformation: { width: wpx, height: hpx } })] }));
  out.push(opts.note ? note(opts.note) : new Paragraph({ spacing: { after: 200 }, children: [] }));
  return out;
}
function pngSize(buf) { return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }; }
function code(text) {
  return text.split('\n').map((l, i, a) => new Paragraph({ spacing: { line: 240, after: i === a.length - 1 ? 200 : 0 },
    shading: { type: ShadingType.CLEAR, fill: 'F4F6F8', color: 'auto' }, indent: { left: 360 },
    children: [new TextRun({ text: l.length ? l : ' ', font: 'Courier New', size: 17 })] }));
}
function header() {
  return new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 24 })] })] });
}
function refs(list) {
  return list.map(t => new Paragraph({ spacing: { line: LINE_BODY }, indent: { left: 720, hanging: 720 }, children: runs(t) }));
}
module.exports = { d, P, H1, H2, H3, C, PB, table, figure, code, header, refs, runs, note, label, FONT, Paragraph, TextRun, AlignmentType };
