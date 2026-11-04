# Motor de asignación automática de horarios (Módulo 2)

Prototipo en Java 21 del núcleo descrito en el Documento de Diseño de Software del Grupo 5.
No usa dependencias externas.

## Compilar y ejecutar

```bash
javac -d out $(find src -name "*.java")
java -Xss64m -cp out co.edu.unbosque.horarios.app.MedicionEscalabilidad 15000 resultados/mediciones_1x_2x_3x.csv
java -Xss64m -cp out co.edu.unbosque.horarios.app.MedicionEscalabilidad 15000 resultados/mediciones_exigente.csv exigente
java -cp out co.edu.unbosque.horarios.app.DemostracionConflicto
java -cp out co.edu.unbosque.horarios.app.PruebaDeCambio
```

## Paquetes

- `dominio` entidades (Docente, Aula, Curso, Grupo, Sesion, FranjaHoraria, Asignacion)
- `configuracion` parámetros del semestre y generación de las 32 franjas válidas (RF-08)
- `restricciones` patrón Strategy con RD-01, RD-02, RD-04, RD-05, RD-06 y RD-09 de la prueba de cambio
- `validacion` reglas RV-01 y RV-02 que se evalúan antes de asignar (RF-05)
- `motor` backtracking con la sesión más restringida primero y diagnóstico de conflictos (RF-06, RF-07)
- `datos` generador de conjuntos sintéticos reproducibles por semilla
- `app` programas de medición, demostración y prueba de cambio
