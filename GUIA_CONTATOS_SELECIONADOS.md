# 📤 Guia: Envio de Mensagens com Contatos Selecionados

## 🎯 O que foi implementado

Agora o sistema envia **apenas os contatos selecionados** pelo usuário para o webhook do n8n, em vez de enviar todos os contatos.

## 📊 Fluxo de Dados

```
1. Usuário marca contatos na página /enviar
   ↓
2. Clica em "Enviar Mensagem"
   ↓
3. Frontend envia POST /api/send com:
   {
     message: "Sua mensagem",
     imageUrl: "https://...",
     contacts: [
       { nome: "João", telefone: "+5585999999999" },
       { nome: "Maria", telefone: "+5585988888888" }
     ]
   }
   ↓
4. Backend envia para webhook n8n:
   {
     message: "Sua mensagem",
     imageUrl: "https://...",
     userId: 1,
     selectedContacts: {
       total: 2,
       list: [
         { nome: "João", telefone: "+5585999999999" },
         { nome: "Maria", telefone: "+5585988888888" }
       ]
     }
   }
   ↓
5. n8n processa cada contato selecionado
   ↓
6. Mensagens enviadas apenas para contatos selecionados ✅
```

## 📝 Estrutura do Payload

### Antes (sem seleção)
```json
{
  "message": "Olá!",
  "imageUrl": "https://...",
  "userId": 1
}
```
N8n tinha que buscar TODOS os contatos do usuário no banco de dados.

### Depois (com seleção)
```json
{
  "message": "Olá!",
  "imageUrl": "https://...",
  "userId": 1,
  "contacts": [
    { "nome": "João Silva", "telefone": "+5585999999999" },
    { "nome": "Maria Santos", "telefone": "+5585988888888" }
  ]
}
```
N8n recebe exatamente os contatos que o usuário selecionou.

## 🔧 Configuração no N8N

### Opção 1: Usar contatos do webhook (Recomendado)

```javascript
// No seu workflow n8n, receba o objeto como:
const payload = $input.all();
const { message, imageUrl, userId, contacts } = payload;

// Se contatos foram fornecidos, usar eles
// Caso contrário, buscar todos do banco
const targetContacts = contacts && contacts.length > 0 
  ? contacts 
  : await fetchAllContacts(userId);
```

### Opção 2: Sempre buscar do banco (Fallback)

```javascript
// Se o payload não incluir contacts, buscar do banco
if (!payload.contacts || payload.contacts.length === 0) {
  const contacts = await fetchContactsFromDatabase(payload.userId);
  payload.contacts = contacts;
}
```

## 📋 Exemplo de Workflow N8N

```yaml
1. Webhook trigger
   - Recebe POST com message, imageUrl, userId, contacts

2. Loop através de contacts
   - Para cada contato em payload.contacts

3. Enviar WhatsApp
   - Para: contato.telefone
   - Mensagem: payload.message
   - Imagem: payload.imageUrl (se fornecida)

4. Log resultado
   - Registra sucesso/erro para cada envio
```

## 🎛️ Mudanças no Código

### Arquivo: `/app/api/send/route.ts`

**O que mudou:**
- ✅ Agora aceita `contacts` no payload
- ✅ Valida se é um array de contatos
- ✅ Inclui `contacts` no payload enviado ao webhook
- ✅ Mantém compatibilidade com chamadas sem contatos

**Exemplo de requisição:**
```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá!",
    "imageUrl": "https://...",
    "contacts": [
      { "nome": "João", "telefone": "+5585999999999" }
    ]
  }'
```

### Arquivo: `/lib/webhook.ts`

**Permanece igual** - já tinha a opção `includeContacts`:
```typescript
await sendMessage(
  { message, imageUrl },
  { includeContacts: true, contacts: selectedContacts }
);
```

### Arquivo: `/app/enviar/page.tsx`

**Permanece igual** - já passava os contatos selecionados

## ✅ Benefícios

1. **Eficiência** 🚀
   - N8n não precisa fazer query no banco para buscar todos os contatos
   - Processa apenas os contatos selecionados

2. **Controle** 🎛️
   - Usuário tem controle total sobre quem recebe a mensagem
   - Evita envios acidentais para contatos não desejados

3. **Auditoria** 📊
   - Webhook recebe log claro de quem recebeu a mensagem
   - Mais fácil rastrear envios

4. **Performance** ⚡
   - Reduz carga no banco de dados
   - Webhook processa apenas dados necessários

## 🧪 Testes

### Teste Local

1. **Selecione 2-3 contatos** na página `/enviar`
2. **Digite uma mensagem**
3. **Abra DevTools** (F12) → Network
4. **Clique em "Enviar Mensagem"**
5. **Verifique a requisição POST /api/send**
6. **Confira o payload** no aba "Payload"

Você verá algo como:
```json
{
  "message": "Teste",
  "imageUrl": null,
  "contacts": [
    { "nome": "João", "telefone": "85999999999" },
    { "nome": "Maria", "telefone": "85988888888" }
  ]
}
```

### Teste no Webhook

No N8N, adicione um nó **HTTP Request** ou **Console Log** para visualizar:

```javascript
console.log("Contatos recebidos:", $input.all().contacts);
console.log("Quantidade:", $input.all().contacts?.length || 0);
```

## 🚨 Casos de Erro

### Erro: "Selecione ao menos um contato"
- ✅ Usuário não selecionou contatos
- Solução: Usar "Selecionar Tudo" na página

### Erro: "Upstream webhook error"
- ❌ N8N não está respondendo
- Verifique se N8N está online
- Teste URL do webhook: `curl $WEBHOOK_URL`

### Erro: "WEBHOOK_URL not configured"
- ❌ Variável de ambiente não está configurada
- Adicione ao `.env`: `WEBHOOK_URL=https://n8n.seu-dominio.com/webhook/...`

## 📚 Próximas Melhorias

1. **Filtro de contatos** 🔍
   - Adicionar suporte a tags/grupos
   - Enviar apenas para contatos com tag específica

2. **Agendamento** ⏰
   - Permitir agendar envios para horários específicos
   - Agendamento recorrente

3. **Relatório detalhado** 📊
   - Mostrar status de cada envio
   - Gráficos de entrega/falha

4. **Template de mensagens** 📝
   - Salvar mensagens frequentes
   - Usar variáveis dinâmicas ({nome}, {telefone})

5. **A/B Testing** 🧪
   - Enviar variações de mensagem
   - Medir qual teve melhor taxa de resposta

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique se os contatos estão sendo selecionados corretamente
2. Confira se o webhook está recebendo o payload correto
3. Verifique logs do n8n para erros de processamento
4. Teste com um contato primeiro para validar o fluxo

