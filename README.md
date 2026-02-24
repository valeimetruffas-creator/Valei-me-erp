# Valei-me SaaS ERP + Delivery

Plataforma SaaS multi-tenant para ERP de confeitaria e delivery, com frontend em React/Vite, backend em Node/Express e Firebase (Auth, Firestore, Storage).

## Estrutura

- `src/`: frontend React atual (produção)
- `backend/`: API Express para operações server-side e integrações
- `shared/`: constantes e contratos compartilháveis
- `functions/`: Cloud Functions legadas e integrações existentes
- `frontend/`: diretório reservado para migração física do frontend

## Autenticação

- Login com email/senha Firebase Auth
- Cadastro com provisionamento automático de tenant:
  - cria `empresas/{empresaId}`
  - cria `usuarios/{uid}` com `empresaId` e `role=admin`
- Recuperação de senha
- Logout
- Rotas privadas com sessão persistente

## Multi-tenant

Isolamento por `empresaId` em camadas de dados e regras do Firestore.

Coleções principais:
- `empresas/{empresaId}`
- `usuarios/{uid}`
- dados agregados por tenant: `confeitaria/{empresaId}`, `financeiro/{empresaId}`, `estoque/{empresaId}`
- coleções operacionais com campo `empresaId`

## Scripts

### Frontend
- `npm run dev`
- `npm run build`
- `npm run start`

### Backend
- `npm run backend:dev`
- `npm run backend:start`

## Deploy

Guia completo: [DEPLOY_SAAS.md](DEPLOY_SAAS.md)
