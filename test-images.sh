#!/bin/bash

# Script de teste para verificar se as imagens estão sendo servidas corretamente

BASE_URL="${1:-http://localhost:3000}"

echo "🧪 Testando serviço de imagens em: $BASE_URL"
echo ""

# Função para testar acesso a um arquivo de upload
test_upload() {
    local filename="$1"
    echo "📋 Testando acesso a: /uploads/$filename"
    
    echo "  Via /uploads/ endpoint:"
    curl -s -o /dev/null -w "    Status: %{http_code}, Content-Type: %{content_type}, Time: %{time_total}s\n" \
        "$BASE_URL/uploads/$filename"
    
    echo "  Via /api/uploads/ endpoint:"
    curl -s -o /dev/null -w "    Status: %{http_code}, Content-Type: %{content_type}, Time: %{time_total}s\n" \
        "$BASE_URL/api/uploads/$filename"
    
    echo ""
}

# Obter lista de arquivos do banco (requer Prisma Studio ou query direta)
echo "📂 Para testar com um arquivo real, use:"
echo "   ./test-images.sh http://localhost:3000 1761503198117-PM.jpg"
echo ""

# Se passou um segundo argumento, testar com ele
if [ -n "$2" ]; then
    test_upload "$2"
else
    echo "ℹ️  Teste genérico com um arquivo de exemplo:"
    test_upload "test-image.jpg"
    echo ""
    echo "💡 Para testar um arquivo específico:"
    echo "   ./test-images.sh $BASE_URL TIMESTAMP-FILENAME.ext"
fi

echo "✅ Teste concluído!"
