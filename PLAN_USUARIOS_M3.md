# Plan del módulo de usuarios (extensión del Módulo 3)

Documento de análisis, diseño y planeación para construir el módulo de usuarios con **cuatro sesiones de
Claude en paralelo** y **una sesión auditora** que integra. Toda sesión lee este archivo completo antes de
escribir código. Lo que aquí está fijado no se cambia sin avisar al auditor.

---

## 1. Análisis

### 1.1 Problema
El MVP entregado tiene un solo actor (coordinador con perfil ADMIN) y los datos entran solo por archivos CSV.
El equipo decidió llevarlo a un sistema usable en la realidad con dos cosas nuevas.

1. **Gestión real de datos en pantalla.** El administrador crea, edita y borra docentes, aulas, materias y
   grupos con formularios, sin depender de un CSV. El CSV queda como importación masiva opcional.
2. **Separación de usuarios.** Un apartado de **administrador** y un apartado de **usuario**. El usuario es el
   **docente**, que entra con su propia cuenta, ve su horario publicado y declara su disponibilidad.
3. **Arrastrar y soltar.** El administrador mueve sesiones en la grilla del horario arrastrándolas, y asigna
   docentes habilitados a una materia arrastrándolos. El servidor valida cada movimiento con las mismas
   restricciones duras y bloquea lo inválido con su código.

### 1.2 Actores
| Actor | Perfil | Qué hace |
|---|---|---|
| Coordinador académico | `ADMIN` | Gestiona catálogos y usuarios, importa CSV, ajusta parámetros, genera, arrastra sesiones, publica y exporta |
| Docente | `DOCENTE` | Ve **solo** sus sesiones del horario publicado, marca su disponibilidad en la grilla y cambia su contraseña |

Estudiantes y directivos quedan fuera (declarado en el acta). La tabla `usuario` ya admite más roles a futuro.

### 1.3 Requisitos nuevos
| ID | Requisito | Criterio de aceptación |
|---|---|---|
| RF-10 | Gestionar docentes, aulas, materias y grupos desde la interfaz | Crear, editar y borrar con las mismas validaciones del cargador CSV (RD-03, RD-07, referencias) |
| RF-11 | Gestionar cuentas de usuario y perfiles | El ADMIN crea cuentas ADMIN o DOCENTE, liga cada DOCENTE a un docente, activa o desactiva y restablece contraseñas |
| RF-12 | Publicar un horario y consultarlo como docente | Solo un horario COMPLETO se publica. El docente ve únicamente sus sesiones |
| RF-13 | Mover sesiones arrastrando y soltando | Soltar en una celda llama a la reubicación. Si viola una restricción se revierte y se muestra el código RD |
| RF-14 | El docente declara su disponibilidad | La disponibilidad marcada en su grilla se guarda y la usa la siguiente generación (RD-04) |
| RNF-06 (ampliado) | Acceso por perfil | `/api/admin/**` y `/api/horarios/**` solo ADMIN. `/api/mi/**` solo DOCENTE. Un DOCENTE recibe 403 en lo demás |

### 1.4 Reglas de negocio
- Cualquier cambio de **catálogos** (RF-10) o una importación CSV **borra las ejecuciones**, porque el horario
  anterior deja de corresponder a los datos. La interfaz lo advierte antes de guardar.
- Cambiar la **disponibilidad** (RF-14) **no** borra ejecuciones. Solo afecta la siguiente generación.
- Borrar un docente borra también su cuenta de usuario.
- No se puede borrar ni desactivar al último ADMIN activo, ni a uno mismo.
- Solo hay un horario publicado a la vez. Publicar otro despublica el anterior.

---

## 2. Diseño

### 2.1 Base ya hecha por el auditor (rama `usuarios-m3`)
- `V3__usuarios_y_publicacion.sql`. Rol `ADMIN` o `DOCENTE`, `usuario.id_docente`, `usuario.activo`, `ejecucion_horario.publicado`.
- JWT con `rol` e `idDocente`. El login responde `{token, expiraEn, usuario, rol, idDocente}`.
- Reglas de acceso en `ConfiguracionSeguridad` (ver 1.3). `GET /api/parametros` lo pueden leer los dos perfiles.
- `RepositorioUsuarios` con `idDocente` y `activo`. Una importación CSV ya no rompe la llave del usuario docente.
- Frontend con Angular CDK instalado, perfil en `AutenticacionService` (`rol()`, `idDocente()`, `inicio()`),
  `guardiaRol`, rutas y menú por perfil, servicios `GestionService` y `PortalService` **ya escritos** contra este
  contrato, tipos en `modelos-gestion.ts` y `modelos-portal.ts`, y páginas vacías para cada pantalla.

### 2.2 Contrato de la API nueva

Errores con la forma de siempre `{codigo, mensaje, detalles}`.

**Catálogos (ADMIN)**
| Método y ruta | Cuerpo | Respuesta y errores |
|---|---|---|
| `GET /api/admin/docentes` | — | `DocenteGestion[]` |
| `POST /api/admin/docentes` | `DocenteGestion` | 200 `DocenteGestion` · 409 `DUPLICADO` · 400 `RD-03` franja inválida · 400 `FORMATO` |
| `PUT /api/admin/docentes/{id}` | `DocenteGestion` | 200 · 404 `NO_ENCONTRADO` |
| `DELETE /api/admin/docentes/{id}` | — | 204 · borra su usuario |
| `GET/POST /api/admin/aulas`, `PUT/DELETE /api/admin/aulas/{id}` | `AulaGestion` | capacidad mayor que 0, características `COMPUTADORES` o `SILLAS_MOVILES` |
| `GET/POST /api/admin/materias`, `PUT/DELETE /api/admin/materias/{id}` | `MateriaGestion` | `numSesiones` entre 1 y MAX_SESIONES (400 `RD-07`), habilitados existentes (400 `REFERENCIA`). Cambiar `numSesiones` regenera las sesiones de sus grupos. Borrar una materia borra sus grupos |
| `GET/POST /api/admin/grupos`, `PUT/DELETE /api/admin/grupos/{id}` | `GrupoGestion` | materia existente (400 `REFERENCIA`), matriculados ≥ 0. Crear un grupo crea sus sesiones `{id}-S1..Sn` |

```
DocenteGestion = { id, nombre, dedicacion, escalafon, disponibilidad:[{dia:"LUNES", horaInicio:"07:00"}] }
AulaGestion    = { id, capacidad, caracteristicas:["COMPUTADORES"] }
MateriaGestion = { id, nombre, numSesiones, requisitos:["COMPUTADORES"], docentesHabilitados:["D01"] }
GrupoGestion   = { id, idCurso, matriculados }
```
`dia` usa el nombre completo de `DiaSemana` (LUNES…SABADO). Todo POST, PUT o DELETE de catálogos borra las ejecuciones.

**Cuentas y publicación (ADMIN)**
| Método y ruta | Cuerpo | Respuesta y errores |
|---|---|---|
| `GET /api/admin/usuarios` | — | `UsuarioGestion[]` |
| `POST /api/admin/usuarios` | `{nombreUsuario, rol, idDocente, contrasena}` | 200 · 409 `DUPLICADO` · 409 `DOCENTE_CON_CUENTA` · 400 contraseña de menos de 8 |
| `PUT /api/admin/usuarios/{id}` | `{rol, idDocente, activo, contrasena}` (contrasena null no la cambia) | 200 · 409 `ULTIMO_ADMIN` |
| `DELETE /api/admin/usuarios/{id}` | — | 204 · 409 `ULTIMO_ADMIN` o `USUARIO_ACTUAL` |
| `POST /api/horarios/{id}/publicar` | — | 200 `Resultado` · 409 `HORARIO_PARCIAL` |

```
UsuarioGestion = { id, nombreUsuario, rol, idDocente, nombreDocente, activo }
```
`Resultado` y `Ejecucion` ganan el campo `publicado` (boolean).

**Portal del docente (DOCENTE)**
| Método y ruta | Cuerpo | Respuesta y errores |
|---|---|---|
| `GET /api/mi/perfil` | — | `{usuario, rol, idDocente, nombreDocente}` |
| `GET /api/mi/horario` | — | `{idEjecucion, fechaPublicacion, docente, asignaciones:[Asignacion]}` solo con sus sesiones · 404 `SIN_PUBLICAR` |
| `GET /api/mi/disponibilidad` | — | `{franjasValidas:[Franja], disponibles:[{dia, horaInicio}]}` |
| `PUT /api/mi/disponibilidad` | `[{dia, horaInicio}]` | 200 igual que el GET · 400 `RD-03` si alguna no es franja válida |
| `PUT /api/mi/contrasena` | `{actual, nueva}` | 204 · 400 `CONTRASENA_INCORRECTA` · 400 nueva de menos de 8 |

### 2.3 Arrastrar y soltar (Angular CDK)
- **Grilla del horario (ADMIN).** Cada sesión es `cdkDrag` y cada celda válida un `cdkDropList` conectado.
  Al empezar a arrastrar se piden `GET /api/horarios/{id}/alternativas/{idSesion}` y se resaltan las celdas con
  alternativa válida. Al soltar se busca la alternativa de esa franja (preferir la misma aula y el mismo docente).
  Si hay, se llama `reubicar` con ella. Si no hay, se llama `reubicar` con la misma aula y docente para que el
  servidor responda 409 y se muestren sus códigos. Las sesiones pendientes del panel también se arrastran a la grilla.
  Botón **Publicar** cuando el estado es COMPLETO y etiqueta **Publicado**.
- **Materias (ADMIN).** Dos listas conectadas: *Docentes del catálogo* y *Habilitados para la materia*. Arrastrar
  entre ellas cambia `docentesHabilitados` y se guarda con `PUT /api/admin/materias/{id}`.
- **Disponibilidad (DOCENTE).** Grilla semanal donde hacer clic o pasar el mouse con el botón presionado pinta y
  despinta franjas. Botón Guardar.

---

## 3. Planeación

### 3.1 Reparto (una persona y una sesión de Claude por parte)
| Parte | Persona sugerida | Rama | Archivos que le pertenecen (solo toca estos) |
|---|---|---|---|
| **A · Backend catálogos** | Daniel | `usuarios-a-catalogos` | `backend/.../aplicacion/catalogos/**` (nuevo), `backend/.../persistencia/RepositorioCatalogos.java` (nuevo), `backend/src/test/.../api/CatalogosApiTest.java` (nuevo) |
| **B · Backend cuentas y portal** | Juan Sebastián | `usuarios-b-cuentas` | `backend/.../aplicacion/cuentas/**` (nuevo), `RepositorioUsuarios.java`, `ServicioHorarios.java`, `ControladorHorarios.java`, `RepositorioEjecuciones.java`, `aplicacion/dto/Dto.java`, `seguridad/**`, `backend/src/test/.../api/CuentasApiTest.java` (nuevo) |
| **C · Frontend gestión** | Martín | `usuarios-c-gestion` | `frontend/src/app/paginas/gestion/**` y estilos nuevos al **final** de `styles.css` bajo el comentario `/* Gestión */` |
| **D · Frontend horario y portal** | Jesús | `usuarios-d-horario` | `frontend/src/app/paginas/horario.component.ts`, `frontend/src/app/paginas/portal/**`, `frontend/src/app/componentes/**` (nuevo), estilos al **final** de `styles.css` bajo `/* Horario y portal */` |
| **Auditor** | esta sesión | `usuarios-m3` | integración, `e2e/`, `docs/`, `README.md`, CI, regenerar PDF |

Nadie toca `app.routes.ts`, `marco.component.ts`, los servicios `gestion.service.ts` y `portal.service.ts` ni los
modelos. Si un servicio necesita un método nuevo, se agrega **al final** del archivo y se avisa en el commit.

### 3.2 Reglas comunes de las cuatro sesiones
1. Clonar el repositorio, `git checkout usuarios-m3` y crear la rama propia desde ahí.
2. Autor de los commits con la cuenta de quien maneja la sesión (`git config user.name` y `user.email` reales). Sin líneas Co-Authored-By.
3. Commits pequeños en español. Hacer `git push origin <rama>` cada vez que algo compile. **Nunca** push a `main` ni a `usuarios-m3`.
4. Backend sin conexión a Maven Central. Si `mvn` falla por red, usar la rama temporal `herramientas-maven` (instrucciones en su `LEEME.md`) y compilar con `mvn -o`. Si tampoco hay acceso, GitHub Actions compila y prueba cada push en unos 8 minutos.
5. Frontend. `cd frontend && npm ci && npx ng build` debe quedar sin errores.
6. Mantener el estilo del proyecto. Nombres en español, comentarios cortos, sin dependencias nuevas salvo las ya instaladas.
7. **Hora límite de push 22:40.** A esa hora se sube lo que haya, aunque esté incompleto, con un commit que diga qué falta.

### 3.3 Cronograma de hoy (5 de noviembre)
| Hora | Qué pasa |
|---|---|
| 21:30 | Arrancan las cuatro sesiones con su prompt |
| 21:30 a 22:40 | Construcción en paralelo. Mientras tanto **una persona graba el video** con el sistema actual de `main`, que ya cumple lo que pide la guía |
| 22:40 | Push final de las cuatro ramas |
| 22:40 a 23:15 | El auditor integra en orden B, A, C, D, corre las pruebas y el recorrido, y sube a GitHub |
| 23:15 | **Punto de no retorno.** Si `usuarios-m3` no está en verde, se entrega `main` como está y el módulo de usuarios queda como trabajo futuro |
| 23:15 a 23:45 | Si está en verde, merge a `main`, capturas nuevas y actualización de los cuatro documentos |
| 23:45 | Subir los PDF y el enlace del video |
