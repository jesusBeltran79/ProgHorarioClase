# Una sesión por franja

Conjunto de prueba para mostrar un horario COMPLETO en el que cada casilla de la grilla tiene una sola
sesión. Cumple el mínimo de la sustentación con 10 docentes, 5 aulas y 20 asignaturas.

- Cada docente está disponible en exactamente tres franjas y ninguna franja la comparte con otro docente.
- Cada materia tiene un solo docente habilitado. Diez materias tienen dos sesiones y diez tienen una, en total 30.
- Como un docente no puede dictar dos sesiones a la vez (RD-01) y cada franja pertenece a un solo docente,
  ninguna franja puede quedar con más de una sesión.
- Las 30 sesiones llenan las 30 franjas de lunes a viernes. El sábado queda libre.
- Las tres franjas de cada docente caen en días distintos, así que un grupo nunca tiene dos sesiones el mismo día.
- Ningún grupo pasa de 44 ni baja de 10 matriculados, de modo que no aparecen avisos RV-01 ni RV-02.

Verificado con el motor real (`EjecutarConjuntoCSV`): COMPLETO, 30 de 30 sesiones, ninguna franja con dos sesiones.
