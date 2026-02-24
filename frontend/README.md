Este diretório representa a camada frontend do SaaS.

Para manter compatibilidade total com o sistema atual, o frontend ativo permanece na raiz do projeto (pastas `src/`, `public/`, `vite.config.ts`, `package.json`).

Migração opcional futura:
1. mover `src`, `public`, `index.html`, configs do Vite e Tailwind para `frontend/`
2. atualizar pipelines de deploy para usar `frontend` como root
3. manter `backend/` e `shared/` já criados neste projeto
