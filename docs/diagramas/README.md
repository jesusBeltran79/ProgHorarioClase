# Diagramas

Fuentes PlantUML de los diagramas del Documento 2 (Anexos Técnicos). Se exportan a PNG con PlantUML 1.2024.7 y Graphviz.

```
java -DPLANTUML_LIMIT_SIZE=16384 -jar plantuml.jar -tpng *.puml
```

`der.puml` se generó a partir de `backend/src/main/resources/db/migration/V1__esquema.sql` y se actualizó con `V3__usuarios_y_publicacion.sql`. `clases_usuarios.puml` es la Figura A4 con el módulo de usuarios.
