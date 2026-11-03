"""Resume los reportes XML de Surefire en un texto legible para el Informe de Calidad y Pruebas."""
import glob
import sys
import xml.etree.ElementTree as ET

carpeta = sys.argv[1] if len(sys.argv) > 1 else "target/surefire-reports"
filas = []
total = fallas = errores = omitidas = 0
tiempo = 0.0
for ruta in sorted(glob.glob(f"{carpeta}/TEST-*.xml")):
    s = ET.parse(ruta).getroot()
    t, f, e, o = (int(s.get(k, 0)) for k in ("tests", "failures", "errors", "skipped"))
    seg = float(s.get("time", 0))
    total, fallas, errores, omitidas, tiempo = total + t, fallas + f, errores + e, omitidas + o, tiempo + seg
    nombre = s.get("name").replace("co.edu.unbosque.horarios.", "")
    filas.append(f"{nombre:<45} {t:>6} {f:>7} {e:>7} {seg:>9.2f}")
    for caso in s.findall("testcase"):
        estado = "FALLA" if caso.find("failure") is not None or caso.find("error") is not None else "OK"
        filas.append(f"    [{estado}] {caso.get('name')}")

print("Resumen de pruebas automatizadas JUnit 5 (Surefire)")
print(f"{'Clase de prueba':<45} {'Pruebas':>6} {'Fallas':>7} {'Errores':>7} {'Segundos':>9}")
print("\n".join(filas))
print("-" * 80)
print(f"{'TOTAL':<45} {total:>6} {fallas:>7} {errores:>7} {tiempo:>9.2f}")
print(f"Omitidas {omitidas}")
