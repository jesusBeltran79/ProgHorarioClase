#!/usr/bin/env bash
# Pruebas de ruptura contra el sistema desplegado con Docker Compose y PostgreSQL.
# Cada paso fuerza un error y registra la respuesta del sistema.
# Uso: bash ruptura_api.sh http://localhost:4200 salida/ruptura_api.log
set -uo pipefail
BASE="${1:-http://localhost:4200}"
LOG="${2:-ruptura_api.log}"
mkdir -p "$(dirname "$LOG")"
: > "$LOG"
fallas=0
DATOS="$(cd "$(dirname "$0")/../../datos" && pwd)"

registrar() { echo "$1" | tee -a "$LOG"; }
esperar() { # descripcion codigo_esperado codigo_obtenido cuerpo
  if [ "$2" = "$3" ]; then registrar "OK    $1 -> HTTP $3 $(echo "$4" | head -c 400)"; else registrar "FALLA $1 -> esperado $2 obtenido $3 $(echo "$4" | head -c 400)"; fallas=$((fallas+1)); fi
}
peticion() { # metodo ruta token [datos]
  local m="$1" r="$2" t="$3"; shift 3
  curl -s -w '\n%{http_code}' -X "$m" "$BASE$r" ${t:+-H "Authorization: Bearer $t"} "$@"
}
cuerpo() { echo "$1" | sed '$d'; }
codigo() { echo "$1" | tail -n1; }
cargar() { # carpeta token
  peticion POST /api/inventarios "$2" -F "docentes=@$DATOS/$1/docentes.csv" -F "aulas=@$DATOS/$1/aulas.csv" \
    -F "cursos=@$DATOS/$1/cursos.csv" -F "grupos=@$DATOS/$1/grupos.csv"
}

registrar "Pruebas de ruptura contra $BASE con PostgreSQL ($(date -u +%Y-%m-%dT%H:%M:%SZ))"

r=$(peticion POST /api/auth/login "" -H 'Content-Type: application/json' -d '{"usuario":"admin","contrasena":"incorrecta"}')
esperar "RNF-06 inicio de sesión con contraseña incorrecta" 401 "$(codigo "$r")" "$(cuerpo "$r")"

r=$(peticion POST /api/horarios/generar "")
esperar "RNF-06 generar sin token" 401 "$(codigo "$r")" "$(cuerpo "$r")"

r=$(peticion POST /api/auth/login "" -H 'Content-Type: application/json' -d '{"usuario":"admin","contrasena":"Horarios2026*"}')
TOKEN=$(cuerpo "$r" | jq -r .token)
esperar "RNF-06 inicio de sesión correcto entrega JWT" 200 "$(codigo "$r")" "token de ${#TOKEN} caracteres"

r=$(cargar ruptura/carga-con-errores "$TOKEN")
esperar "Carga con filas inválidas acepta lo válido y rechaza $(cuerpo "$r" | jq '.rechazos | length') filas" 200 "$(codigo "$r")" "$(cuerpo "$r" | jq -c '[.rechazos[] | .codigo]')"

r=$(cargar demo "$TOKEN")
esperar "RF-01 a RF-05 carga de la demostración" 200 "$(codigo "$r")" "$(cuerpo "$r" | jq -c .cargados)"

r=$(peticion POST /api/horarios/generar "$TOKEN")
RES=$(cuerpo "$r")
ID=$(echo "$RES" | jq .idEjecucion)
esperar "RF-06 generación de la demostración estado $(echo "$RES" | jq -r .estado)" 200 "$(codigo "$r")" "$(echo "$RES" | jq -c .metricas)"

# RD-06 grupo de 40 estudiantes en un aula de 32 puestos
S=$(echo "$RES" | jq -c '[.asignaciones[] | select(.idGrupo=="PRO1-G1")][0]')
body=$(jq -n --argjson s "$S" '{idSesion:$s.idSesion,idFranja:$s.idFranja,idAula:"A202",idDocente:$s.idDocente}')
r=$(peticion POST "/api/horarios/$ID/reubicar" "$TOKEN" -H 'Content-Type: application/json' -d "$body")
esperar "Ruptura RD-06 mover PRO1-G1 de 40 al aula A202 de 32" 409 "$(codigo "$r")" "$(cuerpo "$r" | jq -c .detalles)"

# RD-01 llevar una sesión a la franja donde su docente ya dicta otro grupo
PAR=$(echo "$RES" | jq -c '[.asignaciones as $a | $a[] as $x | $a[] | select(.idDocente==$x.idDocente and .idGrupo!=$x.idGrupo and .idFranja!=$x.idFranja) | {s:$x, o:.}][0]')
body=$(echo "$PAR" | jq -c '{idSesion:.s.idSesion,idFranja:.o.idFranja,idAula:.s.idAula,idDocente:.s.idDocente}')
r=$(peticion POST "/api/horarios/$ID/reubicar" "$TOKEN" -H 'Content-Type: application/json' -d "$body")
esperar "Ruptura RD-01 $(echo "$PAR" | jq -r '.s.idSesion + " a la franja de " + .o.idSesion')" 409 "$(codigo "$r")" "$(cuerpo "$r" | jq -c .detalles)"

# RD-02 llevar una sesión a un aula ocupada en su misma franja
PAR=$(echo "$RES" | jq -c '[.asignaciones as $a | $a[] as $x | $a[] | select(.idFranja==$x.idFranja and .idAula!=$x.idAula) | {s:$x, o:.}][0]')
body=$(echo "$PAR" | jq -c '{idSesion:.s.idSesion,idFranja:.s.idFranja,idAula:.o.idAula,idDocente:.s.idDocente}')
r=$(peticion POST "/api/horarios/$ID/reubicar" "$TOKEN" -H 'Content-Type: application/json' -d "$body")
esperar "Ruptura RD-02 $(echo "$PAR" | jq -r '.s.idSesion + " al aula " + .o.idAula')" 409 "$(codigo "$r")" "$(cuerpo "$r" | jq -c .detalles)"

r=$(peticion GET "/api/horarios/$ID/exportar" "$TOKEN")
esperar "RF-09 exportar horario completo con $(( $(cuerpo "$r" | grep -c ,) - 1 )) sesiones" 200 "$(codigo "$r")" "$(cuerpo "$r" | head -2 | tr '\n' ' ')"

# RD-08 caso sobrerrestringido
cargar ruptura/sobrerrestringido "$TOKEN" > /dev/null
r=$(peticion POST /api/horarios/generar "$TOKEN")
RES=$(cuerpo "$r")
ID=$(echo "$RES" | jq .idEjecucion)
esperar "RD-08 caso sobrerrestringido queda $(echo "$RES" | jq -r .estado)" 200 "$(codigo "$r")" "$(echo "$RES" | jq -c '.conflictos[] | {idSesion, causas:[.causas[].codigo]}')"
r=$(peticion GET "/api/horarios/$ID/exportar" "$TOKEN")
esperar "Ruptura RD-08 exportar un horario PARCIAL" 409 "$(codigo "$r")" "$(cuerpo "$r")"

# Restricciones UNIQUE directamente en PostgreSQL
PEND=$(echo "$RES" | jq -r '.conflictos[0].idSesion')
# Choque de docente. Una sesión ya ubicada, su mismo docente y un aula libre en esa franja
read -r DOC AULA DIA INI FIN <<< "$(echo "$RES" | jq -r '.asignaciones as $a | [ $a[] as $x | ["A204","A302","A301"][] as $au
  | select([ $a[] | select(.idFranja==$x.idFranja and .idAula==$au) ] | length == 0)
  | "\($x.idDocente) \($au) \($x.dia) \($x.horaInicio) \($x.horaFin)" ][0]')"
salida=$(docker compose exec -T db psql -U horarios -d horarios -c \
  "INSERT INTO asignacion VALUES ($ID,'$PEND','$DOC','$AULA','$DIA','$INI','$FIN');" 2>&1)
echo "$salida" | grep -q "uq_asignacion_docente_franja" && registrar "OK    PostgreSQL rechazó el choque de docente RD-01 ($DOC $DIA $INI). $salida" || { registrar "FALLA PostgreSQL no rechazó el choque de docente. $salida"; fallas=$((fallas+1)); }
# Choque de aula. Una sesión ya ubicada, su misma aula y un docente libre en esa franja
read -r DOC AULA DIA INI FIN <<< "$(echo "$RES" | jq -r '.asignaciones as $a | [ $a[] as $x | ["D1","D2"][] as $d
  | select([ $a[] | select(.idFranja==$x.idFranja and .idDocente==$d) ] | length == 0)
  | "\($d) \($x.idAula) \($x.dia) \($x.horaInicio) \($x.horaFin)" ][0]')"
salida=$(docker compose exec -T db psql -U horarios -d horarios -c \
  "INSERT INTO asignacion VALUES ($ID,'$PEND','$DOC','$AULA','$DIA','$INI','$FIN');" 2>&1)
echo "$salida" | grep -q "uq_asignacion_aula_franja" && registrar "OK    PostgreSQL rechazó el choque de aula RD-02 ($AULA $DIA $INI). $salida" || { registrar "FALLA PostgreSQL no rechazó el choque de aula. $salida"; fallas=$((fallas+1)); }

cargar demo "$TOKEN" > /dev/null
registrar "Fin. Fallas $fallas"
exit $fallas
