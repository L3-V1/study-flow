---
titulo: Roteiro de desenvolvimento do Study Flow
data: 2026-10-21
status: aprovado
tipo: roadmap
numero: "01"
triagem: ok
---

# Roteiro de desenvolvimento do Study Flow

## Contexto

O Study Flow é um app pessoal de flashcards com repetição espaçada (FSRS). O conteúdo (Notas) é gerado e corrigido por slash commands do Claude Code e gravado em JSON no repositório; o app, publicado como site estático no GitHub Pages, só exibe os Cards e acompanha o progresso no IndexedDB. Todas as decisões vieram da sessão de sabatina e estão em:

- `GLOSSARY.md`: vocabulário (Tema, Baralho, Nota, Card, Lacuna, Sessão, Avaliação, estados do Card)
- `docs/adr/0001-conteudo-gerado-fora-do-app.md`
- `docs/adr/0002-site-estatico-progresso-local.md`

O diretório só tem esses documentos; o projeto parte do zero. Cada fase abaixo termina com algo utilizável e verificável, e a ordem foi pensada para ter conteúdo real (via slash command) antes de construir as telas de estudo.

---

## Fase 0: Fundação e deploy

**Objetivo:** esqueleto publicado no GitHub Pages desde o primeiro dia.

- `git init`, `.gitignore`, repo público no GitHub (`gh repo create`)
- Vite + React + TypeScript (strict), ESLint, Prettier, Vitest
- `vite.config.ts` com `base: '/study-flow/'`; roteamento com `HashRouter` (o GitHub Pages não reescreve rotas, e o hash evita 404 ao recarregar)
- `.github/workflows/deploy.yml`: em push na `main`, roda `npm ci`, `npm run validate`, `npm test`, `npm run build` e publica com `actions/deploy-pages`
- Interface em pt-BR desde o início (`<html lang="pt-BR">`)

**Pronto quando:** um push publica uma página "Study Flow" acessível em `https://<user>.github.io/study-flow/`.

## Fase 1: Modelo de conteúdo e validação

**Objetivo:** o formato do JSON fica definido, validado e testado antes de qualquer gerador ou tela.

- Estrutura: `content/<tema-slug>/<baralho-slug>.json`, com um arquivo por Baralho
- `src/content/schema.ts` (Zod):
  - Baralho: `{ id, tema: { slug, nome }, nome, descricao?, notas: Nota[] }`
  - Nota de pergunta e resposta: `{ id, tipo: "pergunta-resposta", frente, verso, extra? }`
  - Nota de lacuna: `{ id, tipo: "lacuna", texto, extra? }`, com texto contendo `{{c1::trecho}}` ou `{{c1::trecho::dica}}`
  - Textos em Markdown, com LaTeX entre `$...$` e `$$...$$`
- `src/content/cloze.ts`: extrai os números das Lacunas e renderiza um Card (oculta o número ativo e mostra os demais trechos)
- `src/content/cards.ts`: deriva os Cards de uma Nota. O ID do Card é `notaId` para pergunta e resposta e `notaId::cN` para lacuna
- `src/content/load.ts`: `import.meta.glob('/content/**/*.json', { eager: true })` e então o parse com Zod
- `scripts/validate-content.ts` (`npm run validate`): valida o schema, a unicidade de IDs de Nota em todo o repo, se a Nota de lacuna tem ao menos uma Lacuna e se o Tema do JSON bate com a pasta. Também roda no build, então um JSON inválido falha o deploy
- Um Baralho de exemplo escrito à mão, com os dois tipos de Nota, Markdown, código e fórmula
- Formato do ID de Nota: `<baralho-slug>-<8 caracteres aleatórios base36>`. É legível no comando de correção e não colide

**Pronto quando:** `npm run validate` aceita o exemplo e rejeita variações quebradas (cobertas por testes Vitest de schema, cloze e derivação de Cards).

## Fase 2: Slash commands de conteúdo

**Objetivo:** gerar conteúdo real cedo, para alimentar as fases de tela.

- `.claude/commands/flashcards.md`: `/flashcards <tema livre | caminho de arquivo | URL> [--baralho <slug>] [--tema <slug>] [--n <qtd>]`
  - Decide entre criar e ampliar um Baralho. Ao ampliar, lê o JSON existente, evita Notas duplicadas e **nunca altera IDs existentes**
  - O volume é proporcional ao material, com teto de cerca de 30, e `--n` sobrescreve
  - Traz diretrizes de qualidade: uma ideia por Nota, respostas curtas, quando usar lacuna ou pergunta e resposta, e Lacunas numeradas sem nunca renumerar
  - Termina rodando `npm run validate` e mostrando um resumo das Notas criadas. **Não** faz commit (você revisa e faz o push)
- `.claude/commands/flashcards-fix.md`: `/flashcards-fix <notaId> <descrição do problema>`
  - Localiza a Nota pelo ID em `content/` e corrige o texto mantendo o ID e os números das Lacunas existentes
  - Roda `npm run validate` e mostra o diff
- `CLAUDE.md` do projeto: aponta para o glossário, os ADRs e o schema, e traz a regra de ouro sobre IDs

**Pronto quando:** `/flashcards "Redes TCP/IP"` e `/flashcards ./algum.pdf` geram JSONs válidos, e `/flashcards-fix` corrige uma Nota sem mexer no ID.

## Fase 3: Navegação e renderização

**Objetivo:** ver o conteúdo no app, ainda sem agendamento.

- Renderização: `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex` + `rehype-highlight`, num componente único `src/components/Markdown.tsx`
- `src/components/CardView.tsx`: frente e verso de pergunta e resposta, e frase com a Lacuna ativa oculta ou revelada
- Telas: Início (lista de Temas e Baralhos), Tema (seus Baralhos) e Baralho (lista de Notas em modo leitura)
- Layout responsivo desde já (o uso no celular é o principal motivo de publicar)

**Pronto quando:** o site publicado navega por Temas e Baralhos gerados na Fase 2 e renderiza código e fórmulas corretamente.

## Fase 4: Motor de estudo (FSRS + IndexedDB)

**Objetivo:** estudar de verdade, com o progresso persistido.

- `src/progress/db.ts` (Dexie): tabelas `cardStates` (cardId → estado FSRS do `ts-fsrs` + `suspenso`), `reviewLogs` (cardId, avaliação, data) e `settings` (limite de novos/dia = 20, último backup)
- `src/study/scheduler.ts`: um wrapper fino sobre o `ts-fsrs` (`fsrs().next(card, now, rating)`)
- `src/study/session.ts`: monta a Sessão a partir do escopo (Baralho, Tema ou Tudo). Junta os Cards vencidos e os novos até o limite **global** restante do dia, contado pelos `reviewLogs` de Cards novos de hoje (o dia vira à meia-noite local). Exclui os suspensos e ignora estados órfãos (sem Card correspondente no conteúdo)
- Tela de Sessão: mostrar a frente, revelar a resposta (espaço), avaliar com Errei, Difícil, Bom ou Fácil (teclas 1 a 4, com o intervalo previsto em cada botão) e uma tela de fim de Sessão
- Ação "Erro na Nota": suspende o Card e copia `/flashcards-fix <notaId> ` para a área de transferência, com feedback visual
- Botões "Estudar" nas telas de Início, Tema e Baralho, com a contagem de vencidos e novos

**Pronto quando:** dá para estudar uma Sessão inteira, recarregar a página e ver os Cards reagendados. Os testes cobrem a montagem da Sessão (limite diário, escopo, suspensos, órfãos).

## Fase 5: Backup

**Objetivo:** eliminar o risco de perder o progresso antes do uso diário (ADR 0002).

- Exportar: baixa `study-flow-backup-AAAA-MM-DD.json` com `{ versao, exportadoEm, cardStates, reviewLogs, settings }`
- Importar: valida com Zod e substitui tudo depois de uma confirmação em modal
- Aviso: um banner discreto quando o último backup passa de 7 dias, com o botão "Exportar agora"
- Tela de Configurações: limite de Cards novos por dia, exportar e importar

**Pronto quando:** exportar num navegador e importar em outro (ou numa aba anônima) reproduz exatamente o estado.

## Fase 6: Tela de progresso

**Objetivo:** acompanhar a evolução.

- Contagens por Baralho e Tema: Cards novos, em aprendizado, maduros (intervalo de 21 dias ou mais), vencidos hoje e suspensos
- Sequência de dias seguidos com pelo menos uma revisão
- Heatmap de revisões por dia, no estilo do GitHub, a partir de `reviewLogs`
- Funções de agregação puras em `src/progress/stats.ts`, testadas com o Vitest

**Pronto quando:** os números batem com um cenário montado em teste e com o uso real.

## Fase 7: Polimento

- Auditoria visual com a skill `ui-ux-kit:ui-guidelines` (pt-BR, contraste, estados vazios, feedback de ações, responsividade)
- Estados vazios: sem conteúdo, nada vencido hoje, Baralho todo suspenso
- Acessibilidade: foco visível e navegação completa por teclado na Sessão
- Uma passada de `/code-review` antes de considerar a v1 pronta

## Fora do escopo da v1

Sincronização automática entre dispositivos, edição de conteúdo no app, imagens nas Notas, previsão de revisões futuras, taxa de retenção e os comandos de auditoria e de reorganização de Baralhos.

## Verificação geral

- Por fase: `npm run validate && npm test && npm run build` localmente, e o deploy verde na Action
- Teste ponta a ponta manual a partir da Fase 4, com Playwright (MCP) no `npm run dev`: abrir um Baralho, estudar, avaliar, recarregar e conferir o reagendamento, suspender e conferir a área de transferência, exportar e importar
- Uso real no celular pelo link do GitHub Pages ao fim das Fases 4 e 6
