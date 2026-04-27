#!/bin/bash

echo "Iniciando correção automática do MotoTáxi..."

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT=$(pwd)
FILE_PATH="app-servicos-completo/src/components/features/Mobility/TaxiWizard.tsx"

if [ ! -f "$FILE_PATH" ]; then
    echo "Erro: Arquivo não encontrado!"
    exit 1
fi

cp "$FILE_PATH" "$FILE_PATH.backup"

TEMP_FILE=$(mktemp)

awk '
NR==50 {
    print "  const totalValue = React.useMemo(() => {"
    print "    // O valor correto já vem do App.tsx calculado com base na fórmula correta"
    print "    // Não fazer duplicidade de cálculo aqui!"
    print "    return distancePrices[transitData.type] || 0;"
    print "  }, [distancePrices, transitData.type]);"
    next
}
NR==51 || NR==52 || NR==53 || NR==54 { next }
{ print }
' "$FILE_PATH" > "$TEMP_FILE"

mv "$TEMP_FILE" "$FILE_PATH"

if grep -q "return distancePrices\[transitData.type\] || 0;" "$FILE_PATH"; then
    echo "Código substituído com sucesso!"
    echo "Agora execute: npm run dev:servicos"
    echo "Depois teste em http://localhost:5175"
else
    echo "Erro na substituição. Restaurando..."
    cp "$FILE_PATH.backup" "$FILE_PATH"
    exit 1
fi
