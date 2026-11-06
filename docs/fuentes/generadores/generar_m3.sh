#!/usr/bin/env bash
# Genera los cuatro documentos de la entrega final del Módulo 3 en Word y en PDF.
# Uso: ./generar_m3.sh [carpeta_salida]   (por defecto ../../entregables)
# El Documento 1 final lo editó el equipo en Word. Para no sobrescribirlo solo se regenera
# con INCLUIR_DOC1=1 ./generar_m3.sh
set -euo pipefail
cd "$(dirname "$0")"
SALIDA="${1:-../../entregables}"
mkdir -p "$SALIDA"
[ -d node_modules ] || npm install --silent
DOCS=("doc2:PN2_Grupo5_Doc2_Anexos" "doc3:PN2_Grupo5_Doc3_ManualTecnico" "doc4:PN2_Grupo5_Doc4_ManualUsuario")
[ "${INCLUIR_DOC1:-0}" = "1" ] && DOCS=("doc1:PN2_Grupo5_Doc1_Informe" "${DOCS[@]}")
for par in "${DOCS[@]}"; do
  script="${par%%:*}"; nombre="${par##*:}"
  node "$script.js" "$SALIDA/$nombre.docx"
  soffice --headless --convert-to pdf --outdir "$SALIDA" "$SALIDA/$nombre.docx" >/dev/null
  rm -f "$SALIDA/$nombre.docx"
done
echo "PDF generados en $SALIDA"
