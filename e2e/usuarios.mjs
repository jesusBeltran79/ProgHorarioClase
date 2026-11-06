// Recorrido del módulo de usuarios. Gestión de catálogos con arrastrar y soltar, cuentas por perfil,
// movimiento de sesiones arrastrando en el horario, publicación y portal del docente.
// Uso: node usuarios.mjs [urlBase] [carpetaSalida]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = process.argv[2] ?? 'http://localhost:4200';
const salida = resolve(process.argv[3] ?? resolve(raiz, 'docs/evidencias/capturas_usuarios'));
mkdirSync(salida, { recursive: true });
const registro = [];
const nota = t => { registro.push(`${new Date().toISOString()} ${t}`); console.log(t); };

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
pagina.on('dialog', d => d.accept(d.type() === 'prompt' ? 'Restablecida2026' : undefined));
const foto = async nombre => { await pagina.waitForTimeout(500); await pagina.screenshot({ path: `${salida}/${nombre}.png`, fullPage: true }); nota(`captura ${nombre}`); };

/** Arrastre con el ratón real para que Angular CDK lo reconozca. */
async function arrastrar(origen, destino) {
  const a = await origen.boundingBox();
  const b = await destino.boundingBox();
  await pagina.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await pagina.mouse.down();
  await pagina.mouse.move(a.x + a.width / 2 + 8, a.y + a.height / 2 + 8, { steps: 4 });
  await pagina.waitForTimeout(300);
  await pagina.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 20 });
  await pagina.waitForTimeout(300);
  await pagina.mouse.up();
}

async function entrar(usuario, clave, destino) {
  await pagina.goto(`${base}/ingresar`);
  await pagina.getByLabel('Usuario').fill(usuario);
  await pagina.getByLabel('Contraseña').fill(clave);
  await pagina.getByRole('button', { name: 'Ingresar' }).click();
  await pagina.waitForURL(`**${destino}`);
}

try {
  await entrar('admin', 'Horarios2026*', '/carga');
  await pagina.goto(`${base}/carga`);
  for (const c of ['docentes', 'aulas', 'cursos', 'grupos']) {
    await pagina.setInputFiles(`input[data-prueba="${c}"]`, resolve(raiz, 'datos', 'demo', `${c}.csv`));
  }
  const subida = pagina.waitForResponse(r => r.url().endsWith('/api/inventarios') && r.request().method() === 'POST');
  await pagina.getByRole('button', { name: 'Cargar y validar' }).click();
  await subida;
  await pagina.getByText('Resultado de la carga').waitFor();

  // Docentes con disponibilidad pintada en la grilla
  await pagina.goto(`${base}/gestion/docentes`);
  await pagina.locator('td.codigo').first().waitFor();
  await pagina.getByRole('button', { name: 'Nuevo docente' }).click();
  await pagina.locator('input[name="id"]').fill('D90');
  await pagina.locator('input[name="nombre"]').fill('Laura Méndez');
  await pagina.locator('select[name="dedicacion"]').selectOption('CATEDRA');
  await arrastrar(pagina.locator('[data-franja="LUNES 07:00"]'), pagina.locator('[data-franja="LUNES 15:00"]'));
  await arrastrar(pagina.locator('[data-franja="MIERCOLES 07:00"]'), pagina.locator('[data-franja="VIERNES 09:00"]'));
  await foto('u01_docente_nuevo_disponibilidad');
  await pagina.getByRole('button', { name: 'Guardar' }).click();
  await pagina.getByText('Docente D90 guardado').waitFor();
  nota('docente D90 creado con disponibilidad pintada');

  await pagina.goto(`${base}/gestion/aulas`);
  await pagina.locator('td.codigo').first().waitFor();
  await foto('u02_aulas');

  // Materias. Habilitar a D90 arrastrándolo a la lista de habilitados
  await pagina.goto(`${base}/gestion/materias`);
  await pagina.locator('.item-materia').first().click();
  await pagina.locator('.ficha', { hasText: 'D90' }).waitFor();
  await arrastrar(pagina.locator('.ficha', { hasText: 'D90' }), pagina.locator('#habilitados'));
  await pagina.locator('#habilitados .ficha', { hasText: 'D90' }).waitFor();
  await foto('u03_materia_arrastrar_docente');
  await pagina.getByRole('button', { name: 'Guardar materia' }).click();
  await pagina.getByText('guardada con').waitFor();
  nota('D90 habilitado en la materia arrastrando');

  // Cuenta DOCENTE ligada a D03
  await pagina.goto(`${base}/gestion/usuarios`);
  await pagina.locator('input[name="u"]').fill('docente.d03');
  await pagina.locator('select[name="d"]').selectOption('D03');
  await pagina.locator('input[name="c"]').fill('Clave2026*');
  await pagina.getByRole('button', { name: 'Crear cuenta' }).click();
  await pagina.getByText('Cuenta docente.d03 creada').waitFor();
  await foto('u04_usuarios');

  // Horario. Generar, mover arrastrando y publicar
  await pagina.goto(`${base}/horario`);
  await pagina.getByRole('button', { name: 'Generar horario' }).click();
  await pagina.getByText('Horario completo.').waitFor();
  const sesion = pagina.locator('button.sesion').first();
  const antes = await sesion.innerText();
  await sesion.click();
  await pagina.locator('.celda.sugerida').first().waitFor();
  await foto('u05_horario_celdas_sugeridas');
  await arrastrar(pagina.locator('button.sesion', { hasText: antes.split('\n')[0] }).first(), pagina.locator('.celda.sugerida').nth(1));
  await pagina.getByText('Sesión reubicada.').waitFor();
  await foto('u06_horario_movido_arrastrando');
  nota('sesión movida arrastrando a una celda sugerida');
  await pagina.getByRole('button', { name: 'Publicar (RF-12)' }).click();
  await pagina.getByText('Horario publicado.').waitFor();
  await foto('u07_horario_publicado');

  // Portal del docente
  await pagina.evaluate(() => localStorage.clear());
  await entrar('docente.d03', 'Clave2026*', '/mi/horario');
  await pagina.locator('.sesion.propia').first().waitFor();
  await foto('u08_mi_horario');
  await pagina.goto(`${base}/mi/disponibilidad`);
  await pagina.locator('.casilla').first().waitFor();
  await arrastrar(pagina.locator('[data-franja="SABADO 07:00"]'), pagina.locator('[data-franja="SABADO 09:00"]'));
  await pagina.getByRole('button', { name: 'Guardar' }).click();
  await pagina.getByText('Disponibilidad guardada').waitFor();
  await foto('u09_mi_disponibilidad');
  await pagina.goto(`${base}/mi/cuenta`);
  await pagina.getByText('Cambiar contraseña').first().waitFor();
  await foto('u10_mi_cuenta');
  const token = await pagina.evaluate(() => { for (const v of Object.values(localStorage)) { try { const t = JSON.parse(v); if (t.token) return t.token; } catch { } } return ''; });
  const r = await pagina.request.post(`${base}/api/horarios/generar`, { headers: { Authorization: `Bearer ${token}` } });
  nota(`el DOCENTE intenta generar y recibe ${r.status()}`);
  if (r.status() !== 403) throw new Error('el DOCENTE debía recibir 403');
  nota('RECORRIDO DE USUARIOS COMPLETO');
} catch (e) {
  nota(`FALLO ${e.message}`);
  await pagina.screenshot({ path: `${salida}/fallo.png`, fullPage: true });
  process.exitCode = 1;
} finally {
  writeFileSync(`${salida}/recorrido_usuarios.log`, registro.join('\n') + '\n');
  await navegador.close();
}
