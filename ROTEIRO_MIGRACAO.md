# Roteiro de Migração: adicionar banco (Postgres) + Prisma + CRUD de contatos

Objetivo: migrar o projeto para usar PostgreSQL via Prisma, persistir contatos (nome + telefone), imagens (URL) e usuários; permitir importação de planilhas que atualizam/insiram contatos pelo número (telefone único); adaptar frontend para puxar/selecionar contatos do banco e enviar ao webhook com a URL da imagem.

---

## 1) Pré-requisitos

- Acesso ao banco Postgres (string de conexão no `.env`):
  - Exemplo: `DATABASE_URL="postgres://envio:Ideal2015net@easypanel.ronnysenna.com.br:5435/envio?sslmode=disable"`
- Node.js e npm instalados
- Projeto Next.js já existente (este workspace)

---

## 2) Instalar Prisma e configurar ambiente

- Comandos:
  - `npm install prisma @prisma/client`
  - `npx prisma init`
- Adicionar `DATABASE_URL` no arquivo `.env` na raiz do projeto (não comitar credenciais reais)
- Ajustar `prisma/schema.prisma` (exemplo abaixo)

Exemplo de `prisma/schema.prisma` inicial:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int       @id @default(autoincrement())
  username  String    @unique
  password  String
  createdAt DateTime  @default(now())
  contacts  Contact[]
  images    Image[]
}

model Contact {
  id        Int      @id @default(autoincrement())
  nome      String
  telefone  String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Image {
  id        Int      @id @default(autoincrement())
  url       String
  filename  String
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
```

- Rodar migração inicial:
  - `npx prisma migrate dev --name init`
  - `npx prisma generate`

---

## 3) API (backend) - rotas e responsabilidades

Sugestão de organização (Next.js App Router):

- `app/api/auth/login/route.ts` — autenticação (retornar token/ sessão)
- `app/api/auth/register/route.ts` — criação de usuários (opcional)
- `app/api/contacts/import/route.ts` — upload do arquivo (CSV/XLSX) -> parse -> inserir/atualizar
- `app/api/contacts/route.ts` — GET lista de contatos (com paginação/filtragem)
- `app/api/contacts/[id]/route.ts` — PUT/DELETE para editar/remover
- `app/api/images/upload/route.ts` — upload de imagem (retorna URL pública)
- `app/api/send/route.ts` — recebe payload com message, contatos (ids ou telefones) e imageUrl; encaminha para o webhook n8n

Regras importantes:
- Ao importar, tratar cada contato: se `telefone` já existir -> atualizar `nome`; caso contrário -> inserir.
- Validar formato do telefone (normalizar: remover espaços, `+`, hífens) e armazenar padrão.
- Usar `telefone` como campo `@unique` no DB.

---

## 4) Frontend — mudanças necessárias

Pontos principais:

- Autenticação: trocar o método atual por login via `app/api/auth/login` (salvar token ou sessao local).
- Importação: ao enviar arquivo no frontend, chamar `POST app/api/contacts/import` que retorna quantos foram inseridos/atualizados + amostra (preview).
- Listagem/seleção: no `/enviar` carregar `GET app/api/contacts` e exibir checkbox por contato e botão “Selecionar todos”.
- Envio de mensagem: montar payload com `message`, array de contatos (nome+telefone) a partir dos contatos selecionados (buscar pelo id local) e `imageUrl` selecionada; enviar para `app/api/send` que chamará o webhook.
- Upload de imagem: submeter para `app/api/images/upload` e armazenar `url` retornada (opcional uso de S3/serviço externo ou pasta pública com rota que sirva o arquivo).
- CRUD de contatos: criar tela `app/contatos/*` com cadastro, edição e remoção via API.

---

## 5) Fluxo de importação (detalhado)

1. Usuário escolhe arquivo (CSV/XLSX) e envia para `POST /api/contacts/import`.
2. API parseia (papaparse/xlsx) e normaliza colunas (`nome`, `contato` ou `telefone`).
3. Para cada contato:
   - normalizar telefone (ex.: remover não dígitos)
   - buscar por `telefone` no DB
   - se existir -> `UPDATE nome` (ou outros campos)
   - se não -> `INSERT`
4. API retorna resumo: { inserted: n, updated: m, sample: [...] }
5. Frontend exibe resumo e preview, e guarda estado local dos contatos importados ou atualizados.

---

## 6) Upload de imagem e armazenamento

Opções:
- Salvar em serviço de arquivos (S3, DigitalOcean Spaces) e gravar a URL no DB (recomendado para produção);
- Salvar localmente no servidor (apenas para dev/testes) e expor via rota pública.

API `app/api/images/upload` deve retornar `{ url: 'https://...' }`.

---

## 7) Envio para webhook (n8n)

- Endpoint interno `POST /api/send` monta payload:
  ```json
  {
    "message": "texto",
    "imageUrl": "https://...",
    "contacts": [{"nome":"x","telefone":"551199999999"}, ...]
  }
  ```
- `api/send` valida payload, e então faz `axios.post('https://n8n.../webhook/envio', payload)`.
- Tratar erros/respostas e retornar status ao frontend.

---

## 8) Testes e validação

- Testar importação com CSV e XLSX (colunas Nome/Contato e variações maiúsculas/minúsculas).
- Testar conflito (mesmo telefone) — verificar se atualiza e não duplica.
- Testar CRUD (criar, editar, excluir).
- Testar upload de imagem e visibilidade da URL.
- Testar envio para webhook com lote de contatos.

---

## 9) Scripts úteis / comandos

- Instalar Prisma e gerar client:
  - `npm install prisma @prisma/client`
  - `npx prisma init`
  - `npx prisma migrate dev --name init`
  - `npx prisma generate`
- Rodar dev server:
  - `npm run dev`

---

## 10) Checklist mínimo para começarmos a implementação

- [ ] Configurar `.env` com `DATABASE_URL`
- [ ] Instalar Prisma e criar `prisma/schema.prisma`
- [ ] Rodar `prisma migrate` e `prisma generate`
- [ ] Implementar rota `app/api/contacts/import`
- [ ] Implementar rota `app/api/contacts` (GET/POST/PUT/DELETE)
- [ ] Implementar rota `app/api/images/upload`
- [ ] Adaptar frontend (`/enviar`, `/contatos`) para usar API
- [ ] Implementar envio (`app/api/send`) que chama o webhook
- [ ] Testes e ajustes de UX

---

Se quiser, eu já começo agora pela primeira etapa: *instalar e configurar o Prisma* e criar o `prisma/schema.prisma` com o modelo sugerido. Confirma pra eu executar? (vou criar `.env.example` e rodar os comandos no projeto)
