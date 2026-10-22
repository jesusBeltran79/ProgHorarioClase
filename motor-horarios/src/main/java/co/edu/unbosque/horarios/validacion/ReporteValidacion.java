package co.edu.unbosque.horarios.validacion;

/** Hallazgo sobre los datos de entrada, identificado con su código RV-xx (RNF-04). */
public record ReporteValidacion(String codigoRegla, String idGrupo, String mensaje) { }
