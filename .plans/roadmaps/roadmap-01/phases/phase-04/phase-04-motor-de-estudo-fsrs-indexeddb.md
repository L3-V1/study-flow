---
titulo: Fase 4 - Motor de estudo (FSRS + IndexedDB)
data: 2026-10-23
status: aprovado
tipo: phase
numero: "04"
pai: roadmaps/roadmap-01
triagem: ok
---

# Fase 4: Motor de estudo (FSRS + IndexedDB)

## Contexto

Esta é a quinta fase do roteiro (`.plans/roadmaps/roadmap-01/roadmap-01-desenvolvimento-study-flow.md`). A Fase 3 deixou a navegação pronta: Início, Tema e Baralho em modo leitura, `Markdown.tsx`, e o `CardView.tsx` testado mas ainda sem uso em nenhuma tela. `derivarCards` (`src/content/cards.ts`) já gera os Cards com o ID estável (`notaId` ou `notaId::cN`). Agora entra o estudo de verdade: agendamento FSRS, progresso no IndexedDB (ADR 0002), a tela de Sessão e a suspensão por erro na Nota.

Decisões tomadas com você:
- **"Erro na Nota" suspende todos os Cards da Nota**, e os irmãos também saem da Sessão atual.
- **Reativar** fica na tela do Baralho: a Nota suspensa ganha a marca "Suspensa" e um botão "Reativar". O progresso é mantido.
- **Vencido = a próxima revisão cai antes da meia-noite local.** Depois de uma Avaliação, se o Card ainda vence hoje (Errei, passos de aprendizado), ele volta para o fim da fila da Sessão.

## Premissas (ajuste antes de aprovar se discordar)

1. **Rotas:** `/estudar` (Tudo), `/estudar/:temaSlug` e `/estudar/:temaSlug/:baralhoId`, seguindo o padrão das rotas atuais. Escopo inexistente redireciona para `/`.
2. **Ordem da Sessão:** primeiro os vencidos (por `due`), depois os novos (na ordem de Tema → Baralho → Nota já dada por `temas`, e por número de Lacuna).
3. **A Sessão é montada uma vez, ao abrir a tela** (é um snapshot). As Avaliações gravam no banco e mexem só na fila local. As contagens dos botões "Estudar" são reativas (`useLiveQuery`).
4. **Limite de novos:** o padrão de 20 fica em `settings`, mas só ganha tela na Fase 5. "Novos de hoje" conta os `cardId` distintos com `reviewLog` de `state === New` desde a meia-noite local.
5. **FSRS:** parâmetros padrão do `ts-fsrs` (retenção 0,9, fuzz ligado, passos curtos ligados).
6. **Fora desta fase:** desfazer Avaliação, configurações, backup (Fase 5) e estatísticas (Fase 6).

## Passos

### 1. Dependências
- `npm i ts-fsrs dexie dexie-react-hooks` e `npm i -D fake-indexeddb` (o IndexedDB nos testes do jsdom)

### 2. Progresso (`src/progress/db.ts`)
- Dexie `StudyFlowDB`, versão 1:
  - `cardStates: 'cardId'`, com `{ cardId, fsrs: Card do ts-fsrs, suspenso: boolean }`. Suspender um Card novo grava `createEmptyCard()`, que continua com `state: New`
  - `reviewLogs: '++id, cardId, review'`, com o `ReviewLog` do ts-fsrs mais o `cardId` (o `state` do log é o estado de antes, que é o que identifica um Card novo)
  - `settings: 'chave'`, com `{ chave: 'limiteNovosPorDia', valor: 20 }` lido com padrão quando não existir (o "último backup" entra na Fase 5)
- Funções: `avaliar(cardId, rating, agora)` (transação: `next` → `put` no estado + `add` no log), `suspenderNota(cardIds)`, `reativarNota(cardIds)`, `novosHoje(agora)` e `lerLimiteNovos()`

### 3. Agendamento e Sessão (puros, sem banco)
- `src/study/scheduler.ts`: `const f = fsrs()`, `proximo(card, agora, rating)` e `previsoes(card, agora)` (via `f.repeat`, devolvendo o `due` de cada Avaliação); `formatarIntervalo(de, ate)` em pt-BR ("1 min", "10 min", "3 h", "4 d", "2 meses", "1,2 ano")
- `src/study/dia.ts`: `inicioDoDia(agora)` e `fimDoDia(agora)`, ambos na meia-noite local
- `src/study/session.ts`:
  - `cardsDoEscopo(temas, escopo)`, com `escopo = { temaSlug?, baralhoId? }`, faz o `flatMap` de `derivarCards`
  - `montarSessao({ cards, estados: Map<cardId, estado>, novosHoje, limite, agora })` devolve `{ vencidos, novos }`: exclui os suspensos, vencido é `state !== New && due < fimDoDia`, novo é "sem estado ou `state === New`", e os novos são cortados em `max(0, limite − novosHoje)`. Estados órfãos são ignorados naturalmente, porque a iteração parte dos Cards do conteúdo
  - `aposAvaliar(fila, card, novoEstado, agora)`: tira o Card da frente e o põe de volta no fim se `due < fimDoDia`
- Testes (`session.test.ts`, `scheduler.test.ts`): limite diário (zero restante, parcial), escopo Baralho/Tema/Tudo, suspensos fora, estado órfão sem efeito, Card que vence amanhã fora, reinserção após Errei, virada do dia e `formatarIntervalo`

### 4. Hook de dados (`src/study/useSessao.ts`)
- `useContagem(escopo)`: `useLiveQuery` lê `cardStates`, `novosHoje` e o limite e devolve `{ vencidos, novos }` de `montarSessao`, ou `undefined` enquanto carrega
- A tela de Sessão monta a fila uma vez (premissa 3)

### 5. Telas
- `src/components/BotaoEstudar.tsx`: link para `/estudar/...` com "Estudar · N vencidos · M novos", desabilitado quando os dois são 0. Entra no Início (escopo Tudo e por Tema), no Tema (por Baralho) e no Baralho
- `src/pages/Sessao.tsx`:
  - Trilha de volta ao escopo, um contador "restam N" e o `CardView` do primeiro da fila
  - Oculto: botão "Mostrar resposta" (Espaço). Revelado: Errei, Difícil, Bom e Fácil (teclas 1 a 4), cada um com o intervalo previsto
  - "Erro na Nota": `suspenderNota` em todos os Cards da Nota, tira-os da fila, `navigator.clipboard.writeText('/flashcards-fix <notaId> ')` e mostra o aviso "Card suspenso. Comando copiado." (ou "Não foi possível copiar" se a escrita falhar)
  - Fila vazia: tela de fim de Sessão com o total revisado e um link de volta
  - Atalhos num `keydown` em `window`, que ignora as teclas com modificador e o foco em campo de texto
- `src/pages/Baralho.tsx`: com `useLiveQuery` nos estados, a Nota com Card suspenso mostra a marca "Suspensa" e o botão "Reativar" (`reativarNota`)
- `src/App.tsx`: as três rotas `/estudar...`
- `src/index.css`: botões de Avaliação numa grade de 4 colunas (2×2 abaixo de ~24rem), alvos de 2,75rem, e uma variável de cor por Avaliação (claro e escuro)

### 6. Testes de tela
- `src/test/setup.ts`: `import 'fake-indexeddb/auto'` e limpar o banco no `afterEach`
- `src/pages/Sessao.test.tsx` (conteúdo real): abrir `/estudar/computacao/complexidade-de-algoritmos`, ver a frente, Espaço revela, tecla 3 avalia e grava um `cardState` e um `reviewLog`, e "Erro na Nota" suspende e chama o `clipboard.writeText` (mock) com o ID certo
- `App.test.tsx`: o botão "Estudar" do Início mostra os novos (com o limite de 20 aplicado)
- `Baralho`: uma Nota suspensa mostra "Reativar", e clicar remove a marca

## Arquivos
Novos: `src/progress/db.ts`, `src/progress/db.test.ts`, `src/study/scheduler.ts`, `src/study/scheduler.test.ts`, `src/study/dia.ts`, `src/study/session.ts`, `src/study/session.test.ts`, `src/study/useSessao.ts`, `src/components/BotaoEstudar.tsx`, `src/pages/Sessao.tsx`, `src/pages/Sessao.test.tsx`
Alterados: `package.json`, `src/App.tsx`, `src/App.test.tsx`, `src/pages/Inicio.tsx`, `src/pages/Tema.tsx`, `src/pages/Baralho.tsx`, `src/test/setup.ts`, `src/index.css`, `GLOSSARY.md` (só se surgir um termo novo; "vencido hoje" já cabe na definição atual)

## Verificação
1. `npm run lint && npm run format:check && npm test && npm run build`, tudo verde
2. `npm run dev` com o Playwright (MCP), em 390px e em 1280px: Início → "Estudar" no Baralho; estudar a Sessão inteira só com o teclado (Espaço, 1 a 4); um Errei faz o Card voltar no fim da fila; recarregar a página e conferir que as contagens caíram e que os Cards avaliados não reaparecem como novos; "Erro na Nota" tira os Cards da Nota, o aviso aparece e a área de transferência tem `/flashcards-fix <id> `; na tela do Baralho, "Reativar" devolve os Cards à contagem
3. Limite diário: com `settings.limiteNovosPorDia` = 2 (via `browser_evaluate`), a Sessão traz só 2 novos e, depois de estudá-los, os botões mostram 0 novos
4. Para o "pronto quando" do roteiro: você faz o push, confere a Action verde e estuda uma Sessão pelo celular no site publicado
