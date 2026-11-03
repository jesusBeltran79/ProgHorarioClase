# Generadores de documentos

Scripts en Node.js que producen los documentos Word con formato APA 7 (Times New Roman 12,
doble espacio, títulos centrados en negrita, tablas y figuras numeradas con nota).

- `lib.js` funciones comunes (párrafos, títulos, tablas, figuras, código y referencias).
- `maestro.js` y `anexos.js` generaron los documentos del Módulo 2.
- `autodiag.js` generó el autodiagnóstico del Módulo 2.

Uso

```
npm install
node maestro.js salida.docx
soffice --headless --convert-to pdf salida.docx
```

Las versiones Word editables del Módulo 2 están en `../m2/`.
