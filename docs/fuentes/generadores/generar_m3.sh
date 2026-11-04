#!/usr/bin/env bash
# Genera los cuatro documentos de la entrega final del Módulo 3 en Word y en PDF.
# Uso: ./generar_m3.sh [carpeta_salida]   (por defecto ../../entregables)
set -euo pipefail
cd "$(dirname "$0")"
SALIDA="${1:-../../entregables}"
mkdir -p "$SALIDA"
[ -d node_modules ] || npm install --silent
for par in "doc1:PN2_Grupo5_Doc1_Informe" "doc2:PN2_Grupo5_Doc2_Anexos" \
           "doc3:PN2_Grupo5_Doc3_ManualTecnico" "doc4:PN2_Grupo5_Doc4_ManualUsuario"; do
  script="${par%%:*}"; nombre="${par##*:}"
  node "$script.js" "$SALIDA/$nombre.docx"
  soffice --headless --convert-to pdf --outdir "$SALIDA" "$SALIDA/$nombre.docx" >/dev/null
  rm -f "$SALIDA/$nombre.docx"
done
echo "PDF generados en $SALIDA"
