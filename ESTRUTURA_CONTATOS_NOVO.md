# 📤 Estrutura Atualizada: Contatos Selecionados

## ✨ Nova Estrutura de Payload

Agora o webhook recebe os contatos em uma **estrutura JSON organizada** em vez de um array simples.

### Payload Enviado ao Webhook N8N

```json
{
  "message": "Olá! Como você está?",
  "imageUrl": "https://fluxo-envio-front.dgohio.easypanel.host/api/uploads/1761503198117-PM.jpg",
  "userId": 1,
  "selectedContacts": {
    "total": 3,
    "list": [
      {
        "nome": "João Silva",
        "telefone": "85999999999"
      },
      {
        "nome": "Maria Santos",
        "telefone": "85988888888"
      },
      {
        "nome": "Pedro Oliveira",
        "telefone": "85987777777"
      }
    ]
  }
}
```

## 🔄 Fluxo Completo

```
1. Usuário seleciona contatos na página /enviar
   └─ Marca: João, Maria, Pedro
   
2. Digita mensagem e imagem (opcional)

3. Clica em "Enviar Mensagem"

4. Frontend envia POST /api/send:
   {
     message: "...",
     imageUrl: "...",
     contacts: [ { nome, telefone }, ... ]
   }

5. Backend transforma em:
   {
     message: "...",
     imageUrl: "...",
     userId: 1,
     selectedContacts: {
       total: 3,
       list: [ { nome, telefone }, ... ]
     }
   }

6. Envia para webhook N8N

7. N8N processa selectedContacts.list

8. Envia mensagem para cada contato

9. ✅ Apenas 3 contatos recebem a mensagem
```

## 🎯 Como Usar no N8N

### 1. Acessar os Contatos Selecionados

```javascript
// No seu node de JavaScript no n8n:
const payload = $input.all()[0].json;

// Acessar dados
const { message, imageUrl, userId, selectedContacts } = payload;

// Dados dos contatos
const totalContatos = selectedContacts.total;
const listaContatos = selectedContacts.list;

console.log(`Enviando para ${totalContatos} contatos`);
listaContatos.forEach(contato => {
  console.log(`- ${contato.nome} (${contato.telefone})`);
});
```

### 2. Loop Através dos Contatos

```javascript
// No seu node Loop no n8n:
// Configurar para iterar sobre: $input.all()[0].json.selectedContacts.list

// Cada iteração terá acesso a:
// $json.nome
// $json.telefone
```

### 3. Enviar para Cada Contato

```javascript
// No seu node HTTP Request ou WhatsApp API:
// URL: {{ $env.WHATSAPP_API_URL }}
// Body:
{
  "to": "{{ $json.telefone }}",
  "message": "{{ $root.$input.all()[0].json.message }}",
  "image": "{{ $root.$input.all()[0].json.imageUrl }}",
  "name": "{{ $json.nome }}"
}
```

## 📊 Exemplo de Workflow N8N Completo

```javascript
// Node 1: Webhook (entrada)
// Recebe o payload com selectedContacts

// Node 2: Extrair dados
const { selectedContacts, message, imageUrl, userId } = $input.all()[0].json;
return {
  total: selectedContacts.total,
  contatos: selectedContacts.list,
  message,
  imageUrl,
  userId
};

// Node 3: Loop
// Iterar sobre: {{ $input.all()[0].json.contatos }}

// Node 4: Enviar WhatsApp (dentro do loop)
// Para cada $json.telefone do loop:
POST /whatsapp/send
{
  "to": "{{ $json.telefone }}",
  "message": "Olá {{ $json.nome }},\n\n{{ $root.$input.all()[0].json.message }}"
}

// Node 5: Registrar resultado
// Salvar em banco: id, contato, status, timestamp
```

## ✅ Vantagens da Nova Estrutura

### Antes
```json
{
  "contacts": [ ... ]
}
```
- ❌ Array simples
- ❌ Sem metadados
- ❌ Difícil validar quantidade

### Depois
```json
{
  "selectedContacts": {
    "total": 3,
    "list": [ ... ]
  }
}
```
- ✅ Estrutura clara e organizada
- ✅ Campo `total` para validação
- ✅ Fácil de processar no n8n
- ✅ Melhor rastreabilidade

## 🧪 Teste da Nova Estrutura

### 1. Testar Localmente

```bash
# Fazer requisição com 2 contatos selecionados
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Teste",
    "imageUrl": null,
    "contacts": [
      { "nome": "João", "telefone": "85999999999" },
      { "nome": "Maria", "telefone": "85988888888" }
    ]
  }'
```

### 2. Verificar Resposta

A API retorna:
```json
{
  "success": true,
  "status": 200,
  "data": { ... }
}
```

### 3. Confirmar no N8N

O webhook recebe:
```json
{
  "message": "Teste",
  "imageUrl": null,
  "userId": 1,
  "selectedContacts": {
    "total": 2,
    "list": [
      { "nome": "João", "telefone": "85999999999" },
      { "nome": "Maria", "telefone": "85988888888" }
    ]
  }
}
```

## 📝 Mudanças no Código

### Arquivo: `/app/api/send/route.ts`

```typescript
// Antes:
payload.contacts = contacts.map(...);

// Depois:
payload.selectedContacts = {
  total: contacts.length,
  list: contacts.map(...)
};
```

## 🚀 Deploy

1. Fazer commit das mudanças
2. Push para repositório
3. Redeployar no Easypanel
4. Testar enviando mensagem com contatos selecionados

## 🔍 Debugging

Se o webhook não processar corretamente:

1. **Verifique os logs do n8n**
   - Procure por `selectedContacts` no payload recebido

2. **Teste no DevTools do navegador**
   - F12 → Network → POST /api/send
   - Veja o payload enviado

3. **Use console.log no n8n**
   ```javascript
   console.log(JSON.stringify($input.all(), null, 2));
   ```

4. **Valide a estrutura**
   - selectedContacts deve ter `total` e `list`
   - `list` deve ser um array de objetos com `nome` e `telefone`

---

✨ **Pronto!** A nova estrutura está implementada e pronta para uso no n8n!
