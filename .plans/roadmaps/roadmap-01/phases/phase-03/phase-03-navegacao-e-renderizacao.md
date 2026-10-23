---
titulo: Fase 3 - Navegação e renderização
data: 2026-10-22
status: implementado
tipo: phase
numero: "03"
pai: roadmaps/roadmap-01
triagem: ok
---

# Fase 3: Navegação e renderização

## Contexto

Quarta fase do roteiro (`.plans/roadmaps/roadmap-01/roadmap-01-desenvolvimento-study-flow.md`). As Fases 1 e 2 deixaram o conteúdo pronto: `src/content/load.ts` já exporta `baralhos` (parse com Zod de `content/**/*.json`), `src/content/cards.ts` deriva os Cards e `src/content/cloze.ts` renderiza Lacunas como Markdown. O app ainda é só a tela "Study Flow" de `src/App.tsx`. Agora entra a navegação por Temas e Baralhos e a renderização de Markdown, código e LaTeX, ainda sem agendamento.

Decisões tomadas com você:
- **Modo leitura = Nota inteira aberta**: pergunta e resposta mostra frente e verso; lacuna mostra a frase com todos os trechos destacados. Uma entrada por Nota.
- **Visual simples e limpo**: CSS próprio em `index.css`, com variáveis de cor claro/escuro e coluna única responsiva. Polimento fica para a Fase 7.

## Premissas (ajuste antes de aprovar se discordar)

1. **Rotas** (dentro do `HashRouter` existente): `/` Início, `/tema/:temaSlug` Tema, `/tema/:temaSlug/:baralhoId` Baralho. O Baralho vai com o Tema na URL porque o validador não exige `id` de Baralho único entre Temas. Tema ou Baralho inexistente redireciona para `/`, como a rota `*` já faz.
2. **`CardView` nasce pronto para a Fase 4, mas não é montado em nenhuma tela agora**: a tela de Baralho mostra Notas, não Cards. Ele fica coberto por testes (oculto e revelado). Para isso, o `Card` ganha o campo `tipo` (o `CardView` de lacuna, quando revelado, mostra só a frase revelada; o de pergunta e resposta mostra frente + verso).
3. **Ordem**: Temas e Baralhos em ordem alfabética do `nome` (`localeCompare` pt-BR); Notas na ordem do JSON.
4. **Contagem**: Início e Tema mostram, em cada Baralho, quantas Notas ele tem. Contagem de Cards vencidos/novos é da Fase 4.

## Passos

### 1. Dependências
- `npm i react-markdown remark-gfm remark-math rehype-katex katex rehype-highlight highlight.js` (`katex` e `highlight.js` só para importar o CSS)

### 2. Conteúdo
- `src/content/cloze.ts`: `revelarLacunas(texto)`, que troca toda Lacuna por `**trecho**` (reusa a regex `LACUNA`). Teste em `cloze.test.ts`
- `src/content/cards.ts`: `Card` ganha `tipo: Nota['tipo']`; ajustar `cards.test.ts`
- `src/content/indice.ts`: `type Tema = { slug, nome, baralhos: Baralho[] }` e `agruparPorTema(baralhos): Tema[]` (pura, ordenada pela premissa 3). Teste com fixtures em `indice.test.ts`
- `src/content/load.ts`: acrescentar `export const temas = agruparPorTema(baralhos)`

### 3. Componentes
- `src/components/Markdown.tsx`: `<Markdown texto={...} />` com `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex` + `rehype-highlight`; importa `katex/dist/katex.min.css`
- `src/components/CardView.tsx`: `<CardView card={card} revelado={bool} />` conforme a premissa 2, com `extra` abaixo quando revelado
- Testes: `Markdown.test.tsx` (bloco de código ganha classe `hljs`, `$...$` gera `.katex`, tabela GFM) e `CardView.test.tsx` (lacuna oculta mostra `[...]`/dica e não o trecho; revelada mostra o trecho; pergunta e resposta esconde e mostra o verso)

### 4. Telas
- `src/pages/Inicio.tsx`: `h1` "Study Flow", cada Tema com seus Baralhos (link + "N Notas"); estado vazio simples se `temas` estiver vazio
- `src/pages/Tema.tsx`: `h1` com o nome do Tema, link "Início", lista de Baralhos com descrição e contagem
- `src/pages/Baralho.tsx`: `h1` com o nome do Baralho, links Início › Tema, descrição e a lista de Notas em modo leitura: pergunta e resposta = `Markdown` da frente, divisória, `Markdown` do verso; lacuna = `Markdown` de `revelarLacunas(texto)`; `extra` em destaque discreto
- `src/App.tsx`: as três rotas + `*`; a `Home` atual sai (vira `Inicio`)

### 5. Estilo (`src/index.css`)
- Variáveis de cor em `:root` com variante `@media (prefers-color-scheme: dark)`; coluna `max-width: 42rem` com `padding: 1rem`; listas de Baralhos e Notas como cartões com borda e respiro
- Mobile: `pre` e `.katex-display` com `overflow-x: auto` (código e fórmulas longas não estouram a tela), alvos de toque confortáveis
- Tema do highlight.js: `github.css` no claro e `github-dark.css` no escuro, via `@import ... (prefers-color-scheme: dark)`; conferir no build que a media query foi preservada (se não, trocar por regras `.hljs-*` próprias com as variáveis)

### 6. Testes de navegação (`src/App.test.tsx`)
- Manter os dois testes atuais; acrescentar, com o conteúdo real (como `load.test.ts` já faz): Início lista "Computação" e "Complexidade de algoritmos"; `/tema/computacao` mostra o Baralho; `/tema/computacao/complexidade-de-algoritmos` mostra Notas com fórmula renderizada; Baralho inexistente cai na Início

## Arquivos
Novos: `src/content/indice.ts`, `src/content/indice.test.ts`, `src/components/Markdown.tsx`, `src/components/Markdown.test.tsx`, `src/components/CardView.tsx`, `src/components/CardView.test.tsx`, `src/pages/Inicio.tsx`, `src/pages/Tema.tsx`, `src/pages/Baralho.tsx`
Alterados: `package.json`, `src/content/cloze.ts`, `src/content/cloze.test.ts`, `src/content/cards.ts`, `src/content/cards.test.ts`, `src/content/load.ts`, `src/App.tsx`, `src/App.test.tsx`, `src/index.css`

## Verificação
1. `npm run lint && npm run format:check && npm test && npm run build`, tudo verde
2. `npm run dev` + Playwright (MCP), em 390px e em 1280px, claro e escuro (`browser_emulate_media`): Início → Tema → Baralho; o bloco de código da busca binária aparece colorido, `$O(\log n)$` e a fórmula `$$T(n) = ...$$` renderizam com KaTeX, nada causa rolagem horizontal da página; recarregar em `#/tema/computacao/complexidade-de-algoritmos` mantém a tela
3. `npm run preview` para conferir o `base: '/study-flow/'` (CSS do KaTeX e fontes carregando)
4. Para o "pronto quando" do roteiro: você roda `/flashcards` ao menos uma vez (Fase 2) para ter um segundo Baralho, revisa, faz o commit e o push, confere a Action verde e navega no site publicado pelo celular
