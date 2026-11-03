// Recorrido de punta a punta sobre la aplicación corriendo. Inicia sesión, carga los datos,
// genera, reubica, exporta y fuerza las rupturas. Cada paso deja una captura en la carpeta de salida.
// Uso: node capturas.mjs [urlBase] [carpetaSalida]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = process.argv[2] ?? 'http://localhost:4200';
const salida = resolve(process.argv[3] ?? resolve(raiz, 'docs/evidencias/capturas'));
mkdirSync(salida, { recursive: true });
const registro = [];
const nota = t => { registro.push(`${new Date().toISOString()} ${t}`); console.log(t); };

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5, acceptDownloads: true });
const foto = async nombre => { await pagina.waitForTimeout(400); await pagina.screenshot({ path: `${salida}/${nombre}.png`, fullPage: true }); nota(`captura ${nombre}`); };

async function cargar(conjunto) {
  await pagina.goto(`${base}/carga`);
  for (const c of ['docentes', 'aulas', 'cursos', 'grupos']) {
    await pagina.setInputFiles(`input[data-prueba="${c}"]`, resolve(raiz, 'datos', conjunto, `${c}.csv`));
  }
  await pagina.getByRole('button', { name: 'Cargar y validar' }).click();
  await pagina.getByText('Resultado de la carga').waitFor();
}

async function generar() {
  await pagina.goto(`${base}/horario`);
  await pagina.getByRole('button', { name: 'Generar horario' }).click();
  await pagina.locator('.banda').waitFor();
}

try {
  await pagina.goto(`${base}/ingresar`);
  await pagina.getByLabel('Usuario').fill('admin');
  await pagina.getByLabel('Contraseña').fill('Horarios2026*');
  await foto('01_login');
  await pagina.getByRole('button', { name: 'Ingresar' }).click();
  await pagina.waitForURL('**/carga');

  await cargar('demo');
  await foto('02_carga_validacion');

  await pagina.goto(`${base}/parametros`);
  await pagina.getByText('Franjas válidas guardadas').waitFor();
  await foto('03_parametros');

  await generar();
  await pagina.getByText('Horario completo.').waitFor();
  await foto('04_horario_completo');

  await pagina.locator('.filtros select').first().selectOption('aula');
  await foto('05_vista_por_aula');
  await pagina.locator('.filtros select').first().selectOption('todo');

  // Reubicación válida con una alternativa sugerida por el motor
  await pagina.locator('button.sesion').first().click();
  await pagina.locator('label.opcion').nth(1).waitFor();
  await pagina.locator('label.opcion').nth(1).click();
  await foto('07_reubicar');
  await pagina.getByRole('button', { name: 'Aplicar alternativa' }).click();
  await pagina.getByText('Sesión reubicada.').waitFor();
  nota('reubicación aplicada y el horario sigue COMPLETO');

  // Exportación del horario completo
  const descarga = pagina.waitForEvent('download');
  await pagina.getByRole('button', { name: 'Exportar CSV (RF-09)' }).click();
  const archivo = await descarga;
  await archivo.saveAs(`${salida}/horario_exportado.csv`);
  await foto('08_exportar');

  // Ruptura RD-06 grupo de 40 estudiantes en un aula de 32 puestos
  await pagina.locator('button.sesion', { hasText: 'Programación 1 · G1' }).first().click();
  await pagina.locator('details.manual summary').click();
  await pagina.locator('details.manual select').nth(1).selectOption('A202');
  await pagina.getByRole('button', { name: 'Intentar asignar' }).click();
  await pagina.getByText('El sistema bloqueó la operación.').waitFor();
  await foto('09_ruptura_capacidad');

  // Ruptura de carga con filas inválidas
  await cargar('ruptura/carga-con-errores');
  await foto('11_carga_con_errores');

  // Ruptura RD-08 caso sobrerrestringido
  await cargar('ruptura/sobrerrestringido');
  await generar();
  await pagina.getByText('Horario pendiente de resolución.').waitFor();
  await pagina.getByText('Causas detectadas').waitFor();
  await foto('06_conflicto_pendiente');
  await pagina.getByRole('button', { name: 'Exportar CSV (RF-09)' }).click();
  await pagina.getByText('HORARIO_PARCIAL.').waitFor();
  await foto('10_exportar_bloqueado');

  // Se deja cargada otra vez la demostración para que la aplicación quede lista
  await cargar('demo');
  nota('recorrido completo sin errores');
} catch (e) {
  nota(`ERROR ${e.message}`);
  await pagina.screenshot({ path: `${salida}/error.png`, fullPage: true });
  process.exitCode = 1;
} finally {
  writeFileSync(`${salida}/recorrido.log`, registro.join('\n') + '\n');
  await navegador.close();
}
