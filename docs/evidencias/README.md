# Evidencias del Módulo 3

Todo lo de esta carpeta salió de ejecuciones reales. Las pruebas JUnit, la prueba de estrés y el
recorrido con Docker Compose y PostgreSQL corrieron en GitHub Actions sobre el commit indicado en
`entorno.txt`. Ningún número se escribió a mano.

| Carpeta | Contenido |
|---|---|
| `qa/` | Resumen de las 37 pruebas JUnit, bloqueos por restricción, rupturas en pruebas y rupturas contra el sistema desplegado con PostgreSQL |
| `estres/` | Medición 1x, 3x, 5x y 10x con dos perfiles y cinco semillas por escala |
| `modificabilidad/` | Diff de activar RD-09 sin tocar el motor y cambio del tope a 35 |
| `sistema/` | Estado de los contenedores y registro de Docker Compose |
| `capturas/` | Pantallas del recorrido automático de punta a punta y el CSV exportado |
