# Conjuntos de ruptura

Datos preparados para demostrar que el sistema bloquea lo que viola las restricciones.

- `sobrerrestringido/` el Dr. Gómez es el único habilitado para Cálculo I y Cálculo II y solo
  declara tres franjas libres para cuatro sesiones. El motor entrega 7 de 8 sesiones, marca el
  horario como PARCIAL, explica la sesión pendiente con los códigos RD-xx y bloquea la exportación (RD-08).
- `carga-con-errores/` cada archivo trae filas inválidas. El cargador las rechaza una por una con su
  código y su motivo y acepta el resto. Incluye un grupo de 47 matriculados que dispara RV-01.

Los choques directos de docente (RD-01), aula (RD-02) y capacidad (RD-06) se fuerzan desde la
pantalla del horario con la opción de asignación manual sobre los datos de `../demo/`.
