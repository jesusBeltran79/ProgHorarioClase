# Contrato de trabajo del Módulo 3

Acuerdo técnico entre la sesión de **código** y la sesión de **documentos** para la entrega final
del 5 de noviembre de 2026. Ninguna de las dos sesiones cambia lo que está aquí sin actualizar este
archivo en `main` y avisarle a la otra.

## 1. Reparto y territorios

| Sesión | Rama | Escribe en | Solo lee |
|---|---|---|---|
| Código | `construccion-m3` | todo el repositorio **excepto** `docs/` (salvo `docs/evidencias/`) | `docs/` |
| Documentos | `documentos-m3` | `docs/` **excepto** `docs/evidencias/` | todo lo demás |

`docs/evidencias/` lo produce la sesión de código. La sesión de documentos lo cita y no lo modifica.
`README.md` y `CONTRATO_M3.md` los mantiene la sesión de código.

## 2. Autoría de los commits

Las dos sesiones configuran antes del primer commit:

```
git config user.name  "jesusBeltran79"
git config user.email "jesusdavid05beltran@hotmail.com"
```

- Sin líneas `Co-Authored-By` ni menciones a herramientas en los mensajes.
- Mensajes en español, en infinitivo y cortos (`Agregar cargador de inventarios CSV`).
- Commits pequeños y frecuentes, uno por unidad de trabajo.
- La integración final a `main` se hace con merge de las dos ramas, sin reescribir historial.

## 3. Stack definitivo

| Capa | Tecnología | Versión |
|---|---|---|
| Lenguaje backend | Java (Eclipse Temurin) | 21 |
| Framework backend | Spring Boot (web, data-jpa, security, validation, actuator) | 3.3.5 |
| Migraciones | Flyway | la que gestiona Spring Boot 3.3.5 |
| Tokens | JJWT (`io.jsonwebtoken`) | 0.12.6 |
| Base de datos | PostgreSQL | 16 |
| Base de pruebas | H2 en modo PostgreSQL | la que gestiona Spring Boot |
| Frontend | Angular (componentes standalone) | 18.2 |
| Node para compilar el frontend | Node.js | 20 LTS |
| Servidor del frontend | nginx | 1.27 |
| Contenedores | Docker Compose v2 | — |
| Integración continua | GitHub Actions | — |

Cambios frente al diseño del M2 que la sesión de documentos debe declarar en el diseño final:

1. La seguridad pasa de "Spring Security" genérico a **JWT** (cumple RNF-06 y lo comprometido en el autodiagnóstico).
2. El intercambio de archivos queda **solo en CSV**. JSON se declara fuera del alcance logrado.
3. Se agrega un componente `ServicioHorarios` entre `ControladorHorarios` y el dominio para que el controlador REST no tenga lógica.
4. RV-01 usa el **techo** de `CAP_MAX × (1 + TOL)` como especifica el Módulo 1 (44 con tope 40 y 39 con tope 35).
5. Las restricciones locales (RD-04, RD-05, RD-06) se precalculan por franja para el conteo inicial (decisión pendiente del M2).

## 4. Estructura del repositorio

```
ProgHorarioClase/
├── backend/                 proyecto Maven Spring Boot (antes motor-horarios/, movido con git mv)
│   └── src/main/java/co/edu/unbosque/horarios/
│       ├── dominio/         entidades del problema en memoria (sin Spring)
│       ├── configuracion/   ConfiguracionParametros (sin Spring)
│       ├── restricciones/   RestriccionDura y RD-01, RD-02, RD-04, RD-05, RD-06 (Strategy, sin Spring)
│       ├── validacion/      ValidadorEntrada, RV-01, RV-02 (sin Spring)
│       ├── motor/           MotorAsignacion, EstadoHorario, ReporteConflicto, ResultadoAsignacion (sin Spring)
│       ├── persistencia/    CargadorInventariosCSV, ExportadorHorarioCSV, RepositorioEjecuciones, entidades JPA
│       ├── aplicacion/      ControladorHorarios, ControladorInventarios, ControladorParametros, ServicioHorarios, DTO
│       ├── seguridad/       ConfiguracionSeguridad, ServicioJwt, FiltroJwt, ControladorAutenticacion
│       └── app/             programas de medición del M2 (MedicionEscalabilidad, PruebaDeCambio, DemostracionConflicto)
├── frontend/                proyecto Angular
├── datos/
│   ├── demo/                10 docentes, 5 aulas, 20 asignaturas (sustentación)
│   ├── ruptura/             un caso por choque para el video y las pruebas
│   └── estres/              conjuntos 1x, 3x, 5x, 10x
├── docs/                    territorio de la sesión de documentos
│   ├── evidencias/          territorio de la sesión de código
│   ├── diagramas/  mockups/  entregables/  fuentes/
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

Regla de diseño: los paquetes `dominio`, `configuracion`, `restricciones`, `validacion` y `motor` **no importan Spring**.
Así el núcleo es el mismo del M2 y se puede probar sin levantar la aplicación.

## 5. Arranque

```
docker compose up --build
```

| Servicio | Puerto | URL |
|---|---|---|
| frontend (nginx con Angular, redirige `/api` al backend) | 4200 | http://localhost:4200 |
| backend | 8080 | http://localhost:8080/actuator/health |
| PostgreSQL | 5432 | base `horarios`, usuario `horarios`, clave `horarios` |

Usuario administrador inicial: **`admin`** con clave **`Horarios2026*`** (guardada con bcrypt).

## 6. API REST

Todas las rutas `/api/**` exigen `Authorization: Bearer <token>` con rol `ADMIN`, salvo `POST /api/auth/login`.

| Método y ruta | Entrada | Salida | Requisito |
|---|---|---|---|
| `POST /api/auth/login` | `{usuario, contrasena}` | `{token, expiraEn, usuario}` | RNF-06 |
| `POST /api/inventarios` | multipart `docentes`, `aulas`, `cursos`, `grupos` | `ResumenCarga` | RF-01 a RF-05 |
| `GET /api/inventarios/resumen` | — | `ResumenCarga` de la última carga | RF-05 |
| `GET /api/parametros` | — | `Parametros` con `franjasValidas` | RF-08 |
| `PUT /api/parametros` | `Parametros` | `Parametros` recalculados | RF-08 |
| `POST /api/horarios/generar` | — | `Resultado` | RF-06, RF-07 |
| `GET /api/horarios` | — | lista de ejecuciones | RNF-06 |
| `GET /api/horarios/{id}` | — | `Resultado` | RF-06 |
| `GET /api/horarios/{id}/alternativas/{idSesion}` | — | lista de `Alternativa` | RF-07 |
| `POST /api/horarios/{id}/reubicar` | `{idSesion, idFranja, idAula, idDocente}` | `Resultado` o 409 con códigos RD | RF-07, RNF-04 |
| `GET /api/horarios/{id}/exportar` | — | `text/csv` o **409 si el estado es PARCIAL** | RF-09, RD-08 |

Formas JSON:

```
ResumenCarga = { cargados:{docentes,aulas,cursos,grupos,sesiones},
                 rechazos:[{archivo,fila,codigo,motivo}],
                 hallazgos:[{codigo,idGrupo,mensaje}] }
Resultado    = { idEjecucion, estado:"COMPLETO"|"PARCIAL", fechaHora, usuario,
                 metricas:{nodosExplorados,duracionMs,totalSesiones,sesionesUbicadas},
                 asignaciones:[{idSesion,idCurso,curso,idGrupo,numeroSesion,matriculados,
                                idDocente,docente,idAula,capacidadAula,idFranja,dia,horaInicio,horaFin}],
                 conflictos:[{idSesion,idCurso,curso,idGrupo,
                              causas:[{codigo,tuplasBloqueadas,descripcion}],
                              alternativas:[Alternativa]}] }
Alternativa  = { idFranja,dia,horaInicio,horaFin,idAula,idDocente,docente,liberar:[codigos] }
Error        = { codigo, mensaje, detalles:[texto] }
```

## 7. Formatos CSV (Tabla D2 de los Anexos del M2)

Separador coma, codificación UTF-8, primera fila con encabezados. Las listas dentro de un campo van separadas por punto y coma.

| Archivo | Encabezado | Ejemplo |
|---|---|---|
| `docentes.csv` | `id_docente,nombre,dedicacion,escalafon,disponibilidad` | `D01,Dr. Gómez,MEDIO,ASOCIADO,MAR 07:00;MAR 09:00;MIE 09:00` |
| `aulas.csv` | `id_aula,capacidad,caracteristicas` | `A301,45,COMPUTADORES` |
| `cursos.csv` | `id_curso,nombre,num_sesiones,requisitos,docentes_habilitados` | `CAL2,Cálculo II,2,,D01` |
| `grupos.csv` | `id_grupo,id_curso,matriculados` | `CAL2-G2,CAL2,35` |
| `horario.csv` (salida) | `curso,grupo,sesion,docente,aula,dia,hora_inicio,hora_fin` | `Cálculo II,CAL2-G2,1,Dr. Gómez,A204,MIERCOLES,09:00,11:00` |

Días válidos `LUN MAR MIE JUE VIE SAB`. `disponibilidad` acepta la palabra `TODAS` para las 32 franjas.
`docentes_habilitados` vacío significa que todos pueden dictar el curso (S-06).

## 8. Evidencias que produce la sesión de código

Rutas fijas. La sesión de documentos puede citarlas desde ya.

| Ruta | Contenido | Uso en documentos |
|---|---|---|
| `docs/evidencias/qa/pruebas_unitarias.txt` | resumen de JUnit por clase de prueba | Doc1 QA |
| `docs/evidencias/qa/ruptura.log` | salida de las pruebas de ruptura (choque de docente, aula, capacidad, base de datos UNIQUE, exportación parcial) | Doc1 QA y video |
| `docs/evidencias/estres/estres.csv` | escala, semilla, sesiones, ms, nodos, completo | Doc1 escenario de escalabilidad |
| `docs/evidencias/estres/resumen.txt` | promedio, mediana y peor caso por escala | Doc1 |
| `docs/evidencias/modificabilidad/rd09.diff` | diff de agregar RD-09 | Doc1 escenario de modificabilidad |
| `docs/evidencias/modificabilidad/rv01_tope35.txt` | umbral 39 con tope 35 | Doc1 |
| `docs/evidencias/capturas/01_login.png` … `08_exportar.png` | pantallas reales | Doc1 y Doc4 |
| `docs/evidencias/entorno.txt` | versiones exactas usadas en la medición | Doc3 |

Capturas previstas: `01_login`, `02_carga_validacion`, `03_parametros`, `04_horario_completo`,
`05_vista_por_aula`, `06_conflicto_pendiente`, `07_reubicar`, `08_exportar`.

## 9. Escenarios de atributos de calidad (formato de la guía)

| Atributo | Estímulo | Contexto | Respuesta | Medida |
|---|---|---|---|---|
| Escalabilidad | El coordinador genera con 1x, 3x, 5x y 10x del conjunto de sustentación | Operación normal, perfil holgado y exigente | El motor entrega el horario o el reporte de conflictos sin cambiar código | Tiempo ≤ 60 s en 1x (RNF-01), sin cambios de estructura hasta 3x (RNF-02), tiempo y nodos reportados hasta 10x |
| Modificabilidad | Se agrega una restricción dura nueva (RD-09) y se cambia el tope a 35 | Tiempo de desarrollo | Se crea una clase y se registra, o se cambia un parámetro | `MotorAsignacion` con cero líneas cambiadas en el diff, umbral 39 sin recompilar |

## 10. Puntos de sincronización

| Momento | La sesión de código sube a `construccion-m3` | La sesión de documentos puede |
|---|---|---|
| P1 · mié 4 nov 12:00 | backend con API, JWT y pruebas en verde en CI | actualizar diagramas de clases, secuencia y componentes al código real |
| P2 · mié 4 nov 18:00 | frontend, datos, evidencias completas y README | llenar QA, escenarios, Manual de Usuario con capturas |
| P3 · mié 4 nov noche | merge a `main` | generar los 4 PDF finales |

## 11. Entregables de la sesión de documentos

`PN2_Grupo5_Doc1_Informe.pdf`, `PN2_Grupo5_Doc2_Anexos.pdf`, `PN2_Grupo5_Doc3_ManualTecnico.pdf`,
`PN2_Grupo5_Doc4_ManualUsuario.pdf` en `docs/entregables/`, con las fuentes en `docs/fuentes/`.
APA 7, tercera persona, párrafos, sin dos puntos en la redacción y con pocas comas.
El enlace del video va en la primera página del Doc1 (lo aporta el equipo el 5 de noviembre).
