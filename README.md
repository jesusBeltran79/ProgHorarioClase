# ProgHorarioClase · Motor de asignación automática de horarios

Proyecto Núcleo 2 (15319), 2026-2, Universidad El Bosque, Grupo 5.
Docente Ing. Samuel Galindo Pinzón.

Integrantes: Jesús David Beltrán Zárate, Juan Sebastián Albarracín Isaza,
Daniel Felipe Delgadillo Sepúlveda y Martín Daniel Porto Gutiérrez.

El sistema asigna a cada sesión semanal de cada grupo un docente, un aula y una franja de dos horas
sin violar las restricciones duras del caso. Usa backtracking con la sesión más restringida primero,
restricciones con el patrón Strategy y explica por código cada sesión que no se pudo ubicar.

## Arranque rápido con Docker (recomendado)

Requisito único: Docker Desktop (Windows o macOS) o Docker Engine con Compose v2 (Linux).

```bash
git clone https://github.com/jesusBeltran79/ProgHorarioClase.git
cd ProgHorarioClase
docker compose up --build
```

La primera vez tarda unos minutos porque descarga las imágenes y compila. Cuando termine abra

| Qué | Dirección |
|---|---|
| Interfaz web | http://localhost:4200 |
| API REST | http://localhost:8080 |
| Salud del backend | http://localhost:8080/actuator/health |
| PostgreSQL | `localhost:5432`, base `horarios`, usuario `horarios`, clave `horarios` |

Usuario administrador **`admin`** con clave **`Horarios2026*`**.

Para probar, en la pantalla *Cargar y validar* elija los cuatro archivos de `datos/demo/`
(`docentes.csv`, `aulas.csv`, `cursos.csv`, `grupos.csv`), pulse *Cargar y validar*, revise los
parámetros y en *Generar y resolver* pulse *Generar horario*.

Comandos útiles

```bash
docker compose down        # detiene el sistema y conserva los datos
docker compose down -v     # detiene el sistema y borra la base de datos
docker compose logs -f backend
```

Para cambiar la clave del administrador o el secreto de los tokens cree un archivo `.env` junto a
`docker-compose.yml` con `ADMIN_CLAVE=...` y `JWT_SECRETO=...` (mínimo 32 caracteres) antes del primer arranque.

## Arranque sin Docker

Requisitos: JDK 21, Maven 3.9 y Node.js 20.

```bash
# Backend con base H2 en memoria (no necesita PostgreSQL)
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=h2

# En otra terminal, la interfaz
cd frontend
npm install
npm start
```

Abra http://localhost:4200. Para usar PostgreSQL local en lugar de H2 arranque el backend sin el
perfil `h2` y defina `DB_URL`, `DB_USUARIO` y `DB_CLAVE`.

## Datos incluidos

| Carpeta | Contenido |
|---|---|
| `datos/demo/` | 10 docentes, 5 aulas, 20 asignaturas y 21 grupos. Genera un horario completo de 42 sesiones |
| `datos/ruptura/sobrerrestringido/` | Caso del Dr. Gómez. Queda PARCIAL con 7 de 8 sesiones y la exportación se bloquea |
| `datos/ruptura/carga-con-errores/` | Filas inválidas que el cargador rechaza una por una con su código |

## Pruebas

```bash
cd backend
mvn verify                                   # 37 pruebas JUnit 5 (núcleo, API, seguridad y base de datos)
java -Xss64m -cp target/classes co.edu.unbosque.horarios.app.PruebaEstres target/estres 60000
java -cp target/classes co.edu.unbosque.horarios.app.EjecutarConjuntoCSV ../datos/demo --csv
```

El recorrido de punta a punta con capturas está en `e2e/` (`npm ci && node capturas.mjs`).
La integración continua de GitHub Actions compila, ejecuta las pruebas, levanta el sistema con
Docker Compose y repite las pruebas de ruptura contra PostgreSQL en cada cambio.

## Estructura

```
backend/    API REST Spring Boot 3.3, motor de horarios y migraciones Flyway
frontend/   Interfaz web Angular 18
datos/      Conjuntos de datos de demostración y de ruptura
e2e/        Recorrido automatizado con Playwright
docs/       Documentos de los módulos, diagramas y evidencias
```

## Documentación

Los cuatro documentos de la entrega final están en `docs/entregables/`. El Manual Técnico explica la
arquitectura, el diccionario de datos y cómo agregar una restricción nueva. El Manual de Usuario
explica el uso paso a paso.
