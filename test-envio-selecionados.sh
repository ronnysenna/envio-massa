#!/bin/bash

# Script para testar o fluxo de envio com contatos selecionados

echo "================================"
echo "🧪 TESTE DE ENVIO COM CONTATOS SELECIONADOS"
echo "================================"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Variáveis
API_URL="http://localhost:3000/api/send"
WEBHOOK_URL=${WEBHOOK_URL:-"https://seu-n8n.com/webhook/envio"}

echo -e "${YELLOW}1️⃣  Testando endpoint /api/send${NC}"
echo ""

# Criar payload de teste com 2 contatos selecionados
read -r -d '' PAYLOAD << 'EOF'
{
  "message": "Olá! Essa é uma mensagem de teste 🚀",
  "imageUrl": null,
  "contacts": [
    {
      "id": 1,
      "nome": "João Silva",
      "telefone": "85999999999",
      "email": "joao@example.com"
    },
    {
      "id": 2,
      "nome": "Maria Santos",
      "telefone": "85988888888",
      "email": "maria@example.com"
    },
    {
      "id": 3,
      "nome": "Pedro Oliveira",
      "telefone": "85987777777",
      "email": "pedro@example.com"
    }
  ]
}
EOF

echo "📤 Enviando payload:"
echo "$PAYLOAD" | jq '.'
echo ""

echo -e "${YELLOW}2️⃣  Fazendo requisição POST${NC}"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "📥 Resposta do servidor:"
echo "$RESPONSE" | jq '.'
echo ""

# Verificar resposta
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Requisição bem-sucedida!${NC}"
    echo ""
    
    # Extrair informações da resposta
    STATUS=$(echo "$RESPONSE" | jq -r '.status')
    echo "Status HTTP: $STATUS"
    echo ""
    
else
    echo -e "${RED}❌ Erro na requisição${NC}"
    ERROR=$(echo "$RESPONSE" | jq -r '.error // "Erro desconhecido"')
    echo "Erro: $ERROR"
    exit 1
fi

echo ""
echo -e "${YELLOW}3️⃣  Verificando o que foi enviado ao webhook${NC}"
echo ""

echo "O webhook n8n deve ter recebido:"
echo ""
echo "- Mensagem: 'Olá! Essa é uma mensagem de teste 🚀'"
echo "- Total de contatos selecionados: 3"
echo "- Contatos:"
echo "  • João Silva (85999999999)"
echo "  • Maria Santos (85988888888)"
echo "  • Pedro Oliveira (85987777777)"
echo "- Sem imagem (null)"
echo ""
echo "Estrutura do payload:"
echo "selectedContacts: {"
echo "  total: 3,"
echo "  list: ["
echo "    { nome: 'João Silva', telefone: '85999999999' },"
echo "    { nome: 'Maria Santos', telefone: '85988888888' },"
echo "    { nome: 'Pedro Oliveira', telefone: '85987777777' }"
echo "  ]"
echo "}"

echo -e "${YELLOW}4️⃣  Diferenças importantes:${NC}"
echo ""
echo "✅ Antes: Webhook recebia TODOS os contatos do usuário"
echo "✅ Agora: Webhook recebe apenas contatos SELECIONADOS"
echo ""

echo -e "${YELLOW}5️⃣  Próximas ações:${NC}"
echo ""
echo "1. Verifique os logs do seu n8n"
echo "2. Confirme que recebeu o payload com 3 contatos"
echo "3. Execute o workflow para enviar mensagens"
echo "4. Valide se as mensagens chegaram para cada contato"
echo ""

echo -e "${GREEN}✨ Teste concluído!${NC}"
echo ""
echo "Para testar com sua própria API:"
echo "  export API_URL=https://seu-dominio.com/api/send"
echo "  bash test-envio-selecionados.sh"

