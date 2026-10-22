---
titulo: Fase 0 - Fundação e deploy do Study Flow
data: 2026-10-21
status: aprovado
fase: 0
---

# Fase 0: Fundação e deploy do Study Flow

## Contexto

Primeira fase do roteiro (`.plans/2026-10-21-roteiro-desenvolvimento-study-flow.md`). O diretório só tem `GLOSSARY.md`, `docs/adr/`, `.plans/` e `.claude/` (hook e skill de triagem de planos); não é repositório git. O objetivo é ter um esqueleto Vite + React + TS publicado no GitHub Pages desde o primeiro dia, com o pipeline de CI já no formato final (`validate`, `test`, `build`) para que as fases seguintes só preencham o conteúdo.

Ambiente verificado: Node 22.20, npm 10.9, `gh` 2.102 logado como `L3-V1` com escopos `repo` e `workflow`. URL final: `https://l3-v1.github.io/study-flow/`.

## Passos

### 1. Scaffold do projeto
- Gerar `npm create vite@latest` com template `react-ts` num diretório do scratchpad e copiar para a raiz (o diretório atual não está vazio, e assim pegamos o template e a config ESLint flat atuais)
- Remover o boilerplate do template (logos, contador, `App.css` de demo)
- `index.html`: `<html lang="pt-BR">`, `<title>Study Flow</title>`, meta description em pt-BR
- `tsconfig.app.json`: manter `strict: true` do template e adicionar `noUncheckedIndexedAccess: true`

### 2. Roteamento
- `npm i react-router` (v7) e usar `HashRouter` em `src/main.tsx`
- `src/App.tsx`: `<Routes>` com uma rota `/` que mostra a página "Study Flow" (título + uma frase curta em pt-BR). A rota de fallback `*` redireciona para `/`

### 3. Vite
- `vite.config.ts`: `base: '/study-flow/'` e bloco `test` do Vitest (`environment: 'jsdom'`, `setupFiles: './src/test/setup.ts'`)

### 4. Qualidade
- **ESLint**: a config flat do template + `eslint-config-prettier` no final
- **Prettier**: `.prettierrc` com `singleQuote: true`, `semi: false` e `endOfLine: 'lf'` e `.prettierignore` (`dist`, `coverage`)
- **Vitest**: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`; `src/test/setup.ts` importa o jest-dom
- Teste de fumaça `src/App.test.tsx`: renderiza `<App />` dentro de `HashRouter`/`MemoryRouter` e confere o título "Study Flow"
- `.gitattributes` com `* text=auto eol=lf` (evita ruído de CRLF no Windows)

### 5. Scripts do `package.json`
- `dev`, `build` (`tsc -b && vite build`), `preview`, `lint`, `format`, `format:check`, `test` (`vitest run`)
- `validate`: `tsx scripts/validate-content.ts`. Na Fase 0 é um **stub** que imprime "Nenhum conteúdo para validar" e sai com 0; a Fase 1 substitui pela validação real. Assim o workflow já nasce no formato final

### 6. Workflow de deploy
`.github/workflows/deploy.yml`:
- `on: push` na `main` + `workflow_dispatch`
- `permissions: contents: read, pages: write, id-token: write`; `concurrency: group: pages, cancel-in-progress: false`
- Job `build`: `actions/checkout@v4`, `actions/setup-node@v4` (node 22, `cache: npm`), `npm ci`, `npm run lint`, `npm run validate`, `npm test`, `npm run build`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` (`path: dist`)
- Job `deploy` (`needs: build`, environment `github-pages`): `actions/deploy-pages@v4`

### 7. Git e GitHub
- `.gitignore`: `node_modules`, `dist`, `coverage`, `*.local`, `.env*`, logs, `.vscode/*` exceto `extensions.json`
- `git init -b main`, commit inicial com tudo (incluindo `docs/`, `GLOSSARY.md`, `.plans/` e `.claude/`)
- `gh repo create study-flow --public --source . --push`
- Ativar o Pages com fonte "GitHub Actions": `gh api -X POST repos/L3-V1/study-flow/pages -f build_type=workflow` (antes do push, ou reexecutar o workflow com `gh workflow run deploy.yml` se o primeiro run falhar por falta do Pages)

## Arquivos criados
`package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc`, `.prettierignore`, `.gitignore`, `.gitattributes`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.test.tsx`, `src/test/setup.ts`, `src/index.css` (reset mínimo), `scripts/validate-content.ts`, `.github/workflows/deploy.yml`

## Verificação
1. Local: `npm run lint && npm run format:check && npm run validate && npm test && npm run build`, tudo verde
2. `npm run preview` e abrir `http://localhost:4173/study-flow/` com o Playwright (MCP): título "Study Flow", `lang="pt-BR"`, e `#/rota-inexistente` volta para `/`
3. `gh run watch` no primeiro run do workflow até ficar verde
4. Abrir `https://l3-v1.github.io/study-flow/` com o Playwright, conferir a página e recarregar para garantir que não dá 404

**Pronto quando:** o push na `main` publica a página "Study Flow" em `https://l3-v1.github.io/study-flow/`.
