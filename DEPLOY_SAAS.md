# Deploy SaaS - Valei-me

## 1) Pré-requisitos
- Node.js 20+
- Conta Firebase com Auth, Firestore e Storage ativos
- Firebase CLI (`npm i -g firebase-tools`)
- Conta Vercel/Netlify (frontend)
- Conta Render/Railway (backend)

## 2) Variáveis de ambiente

### Frontend (`.env`)
Use como base `.env.example`.

Obrigatórias:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Opcionais:
- `VITE_API_URL`
- `VITE_ENABLE_API`
- `VITE_FIREBASE_FUNCTIONS_REGION`
- `VITE_DEFAULT_EMPRESA_ID` (cardápio público)

### Backend (`backend/.env`)
Use como base `backend/.env.example`.

Obrigatórias em produção:
- `PORT`
- `CORS_ORIGIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_BASE64`
- `IFOOD_CLIENT_ID`
- `IFOOD_CLIENT_SECRET`
- `IFOOD_WEBHOOK_SECRET`
- `IFOOD_ENCRYPTION_KEY`

## 3) Rodar localmente

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
npm --prefix backend install
npm --prefix backend run dev
```

## 4) Firebase (rules)
Publicar regras multi-tenant:
```bash
firebase deploy --only firestore:rules
```

## 5) Deploy frontend (Vercel/Netlify)
- Build command: `npm run build`
- Output dir: `dist`
- Configure as variáveis `VITE_*`

## 6) Deploy backend (Render/Railway)
- Criar 2 serviços separados apontando para `backend`:

### Serviço 1 - API
- Root directory: `backend`
- Build: `npm install`
- Start: `node server.js`
- Responsável por endpoints HTTP (`/health`, `/webhook/ifood`, `/api/*`)

### Serviço 2 - Worker
- Root directory: `backend`
- Build: `npm install`
- Start: `node worker.js` (ou `npm run worker`)
- Responsável apenas por processamento de fila iFood
- Pode escalar independentemente da API

- Adicione as mesmas variáveis do `backend/.env.example` nos dois serviços

## 7) Checklist de produção
- [ ] Login, cadastro e recuperação funcionando
- [ ] Documento `usuarios/{uid}` contém `empresaId`
- [ ] Documento `empresas/{empresaId}` criado no cadastro
- [ ] Leitura/escrita isolada por tenant (`empresaId`)
- [ ] Regras do Firestore publicadas
- [ ] Frontend e backend com HTTPS
- [ ] Logs de erro monitorados

## 8) Endpoints principais

### Privados (Bearer token Firebase)
- `GET /api/produtos`
- `POST /api/produtos`
- `PUT /api/produtos/:id`
- `GET /api/pedidos`
- `POST /api/pedidos`
- `PATCH /api/pedidos/:id/status`
- `GET|POST|PUT /api/estoque`
- `GET|POST|PUT /api/clientes`
- `GET|POST|PUT /api/configuracoes`
- `GET|PUT /api/tenant/empresa`

### Públicos (sem login)
- `GET /api/public/produtos?empresaSlug={slug}`
- `GET /api/public/cardapio?empresaSlug={slug}`
- `POST /api/public/pedidos?empresaSlug={slug}`

### Integração futura iFood (base pronta)
- `POST /api/ifood/connect`
- `GET /api/ifood/status`
- `POST /api/ifood/sync-catalog`
- `POST /api/ifood/update-order-status`
- `POST /api/ifood/disconnect`
- `POST /api/webhook/ifood`

### Endpoints diretos para produção (Render / iFood)
- `GET /health`
- `POST /webhook/ifood`
- `POST /ifood/test` (simulação de webhook para validação)

### Configuração no iFood após deploy
- URL pública webhook:
	- `https://SEU_BACKEND.onrender.com/webhook/ifood`
- Endpoint de teste local de integração:
	- `POST https://SEU_BACKEND.onrender.com/ifood/test`

### Segurança e consistência do webhook iFood
- Rate limit dedicado: `100 req/min` para `POST /webhook/ifood`
- Validação HMAC SHA256 via header `x-ifood-signature` usando `IFOOD_WEBHOOK_SECRET`
- Proteção de replay com `eventId + timestamp` (janela temporal controlada)
- Idempotência com coleção `ifood_eventos_processados`
- Log estruturado por evento em `logsIntegracao` (payload, empresaId, status, erro)

### Fila e reconciliação iFood
- Coleção de fila: `ifood_fila`
	- status: `pending`, `processing`, `done`, `error`
	- retry automático até `5x`
	- backoff exponencial entre tentativas
- Worker contínuo para processar fila (nunca trava ciclo por erro individual)
- Job de reconciliação a cada 2 minutos:
	- busca pedidos no iFood por merchant
	- cria pedidos faltantes
	- corrige status divergente

### Variáveis iFood recomendadas
- `IFOOD_API_BASE_URL` (default: https://merchant-api.ifood.com.br)
- `IFOOD_WEBHOOK_SECRET` (validação assinatura webhook)
- `IFOOD_ENCRYPTION_KEY` (criptografia de `clientSecret` e `accessToken`)
- `IFOOD_POLLING_ENABLED` (`true` para fallback por polling)
- `IFOOD_POLLING_INTERVAL_MS` (default: 30000)

## 9) Segurança aplicada no backend
- Validação Zod em todas rotas críticas
- Middleware de autenticação Firebase ID Token
- Isolamento tenant por `empresaId`
- Rate limit global (`express-rate-limit`)
- Sanitização de payload para reduzir risco XSS/injection
- Logger estruturado com Winston + middleware global de erro
