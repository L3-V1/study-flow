---
titulo: Fase 2 - Slash commands de conteúdo
data: 2026-10-22
status: implementado
fase: 2
tipo: phase
numero: "02"
pai: roadmaps/roadmap-01
triagem: ok
---

# Fase 2: Slash commands de conteúdo

## Contexto

Terceira fase do roteiro (`.plans/roadmaps/roadmap-01/roadmap-01-desenvolvimento-study-flow.md`). A Fase 1 fixou o formato do Baralho (`src/content/schema.ts`), as regras entre arquivos (`src/content/validate.ts`) e o `npm run validate`. Agora entram os dois slash commands que geram e corrigem Notas, para ter conteúdo real antes das telas da Fase 3. Os commands são prompts em Markdown; quem garante a correção do JSON continua sendo o `npm run validate`, que eles rodam no fim.

Decisões tomadas com você:
- Os comandos ficam em **`.claude/commands/`**, versionados no repo (o commit 66c1e21 tirou só hooks e skills locais).
- Os IDs de Nota saem de um **script `npm run id`** com `crypto`, e não da imaginação do modelo.

## Premissas (ajuste antes de aprovar se discordar)

1. **Criar ou ampliar**: com `--baralho <slug>`, o comando procura `content/*/<slug>.json`. Se existir, amplia; se não, cria. Sem `--baralho`, ele lista o `content/`, propõe um slug e amplia só quando um Baralho existente cobre claramente o mesmo tópico. O `--tema` funciona do mesmo jeito; ao usar um Tema existente, ele reaproveita o `tema.nome` (o validador exige que seja igual).
2. **Ao ampliar, só acrescenta**: novas Notas vão para o fim de `notas`, e as existentes ficam intocadas (ID, texto e ordem). Corrigir uma Nota existente é tarefa do `/flashcards-fix`.
3. **Erros no validate**: o comando corrige só as Notas que ele mesmo criou e roda o `validate` de novo. Se o erro estiver em outro arquivo, ele avisa e para.
4. **`/flashcards-fix` não troca o `tipo` da Nota**, porque isso mudaria os IDs dos Cards (`notaId` ↔ `notaId::cN`) e o progresso se perderia. Ele pode apagar uma Lacuna (deixar buraco é permitido), mas nunca renumera nem reaproveita um número apagado. Se a correção pedir outro tipo, ele explica e sugere apagar a Nota e gerar uma nova.
5. **Entradas**: um caminho de arquivo é lido com `Read` (PDFs grandes em blocos de até 20 páginas), uma URL com `WebFetch`, e qualquer outra coisa é um tema livre, que vem do conhecimento do modelo.

## Passos

### 1. Gerador de IDs
- `src/content/ids.ts`: `gerarIdsDeNota(baralhoSlug, qtd, existentes: Set<string>): string[]`, que gera `<slug>-<8 base36>` com `crypto.getRandomValues` (sorteia de novo se colidir com `existentes` ou com outro ID do próprio lote)
- `src/content/ids.test.ts`: o formato bate com o `idNotaSchema` (exportar esse schema de `schema.ts`), a quantidade está certa, e não há repetição nem colisão com os existentes
- `scripts/gerar-ids.ts`: `npm run id -- <baralho-slug> [qtd=1]`. Valida o slug com `slugSchema`, coleta os IDs que já existem em `content/**/*.json` e imprime um ID por linha
- `package.json`: script `"id": "tsx scripts/gerar-ids.ts"` (o `tsconfig.node.json` já inclui `scripts/`)

### 2. `.claude/commands/flashcards.md`
- Frontmatter: `description`, `argument-hint: <tema livre | arquivo | URL> [--baralho <slug>] [--tema <slug>] [--n <qtd>]` e `allowed-tools` (Read, Write, Edit, Glob, Grep, WebFetch, `Bash(npm run validate)`, `Bash(npm run id:*)`)
- Corpo, em etapas:
  1. Interpretar `$ARGUMENTS` (fonte e flags)
  2. Ler a fonte (premissa 5)
  3. Ler `src/content/schema.ts` e listar `content/` para decidir entre criar e ampliar (premissas 1 e 2). Ao ampliar, ler o JSON e evitar Notas que repitam a ideia de uma existente
  4. Volume: proporcional ao material, com teto de cerca de 30 Notas; `--n` sobrescreve
  5. Diretrizes de qualidade: uma ideia por Nota; respostas curtas; lacuna para fatos, definições e termos dentro de uma frase com contexto, e pergunta e resposta para porquês, comparações, procedimentos e código; Lacunas numeradas a partir de c1, com o mesmo número só para trechos que devem sumir juntos; nada de `::` ou `}}` dentro de um trecho (limitação da regex); `extra` só para contexto útil; Markdown, blocos de código com linguagem, LaTeX em `$...$`/`$$...$$` (com `\\` escapado no JSON); tudo em pt-BR; vocabulário do `GLOSSARY.md`
  6. Gerar os IDs com `npm run id -- <baralho> <qtd>`
  7. Gravar o JSON (2 espaços de indentação, como o exemplo)
  8. Rodar `npm run validate` (premissa 3)
  9. Mostrar um resumo: arquivo criado ou ampliado, Tema e Baralho, quantas Notas de cada tipo e uma linha por Nota (ID + início da frente/texto). **Não** fazer commit

### 3. `.claude/commands/flashcards-fix.md`
- Frontmatter: `argument-hint: <notaId> <descrição do problema>` e `allowed-tools` (Read, Edit, Grep, `Bash(npm run validate)`, `Bash(git diff:*)`)
- Corpo: achar a Nota com `Grep` do ID em `content/` (se não achar, avisar e parar), ler o arquivo, corrigir só os campos de texto daquela Nota com `Edit`, mantendo `id`, `tipo` e os números das Lacunas (premissa 4), rodar `npm run validate` e mostrar `git diff -- <arquivo>`. Sem commit

### 4. `CLAUDE.md`
- Acrescentar no fim uma seção "## Study Flow" curta, sem mexer nas diretrizes que já estão lá: aponta para o `GLOSSARY.md`, os dois ADRs, o `src/content/schema.ts` e os comandos `/flashcards` e `/flashcards-fix`, e traz a **regra de ouro**: nunca alterar o ID de uma Nota existente, nunca renumerar Lacunas e nunca trocar o `tipo` de uma Nota, porque o progresso de cada Card no IndexedDB está preso a esses IDs

## Arquivos
Novos: `.claude/commands/flashcards.md`, `.claude/commands/flashcards-fix.md`, `src/content/ids.ts`, `src/content/ids.test.ts`, `scripts/gerar-ids.ts`
Alterados: `package.json`, `src/content/schema.ts` (só exportar o `idNotaSchema`), `CLAUDE.md`

## Verificação
1. `npm run lint && npm run format:check && npm test && npm run build`, tudo verde; `npm run id -- redes 3` imprime 3 IDs válidos
2. Numa sessão nova do Claude Code (para os commands serem carregados):
   - `/flashcards "Redes TCP/IP"` → cria `content/redes/tcp-ip.json` (ou o slug proposto), e o `validate` passa
   - `/flashcards ./algum.pdf` com um PDF seu → gera outro Baralho válido
   - `/flashcards "Redes TCP/IP" --baralho tcp-ip --n 5` → amplia com 5 Notas, e `git diff` mostra só acréscimos no fim de `notas`
   - `/flashcards-fix <id de uma lacuna> <problema>` → o diff muda só o texto daquela Nota, com o mesmo ID e os mesmos números de Lacuna
3. Você revisa o conteúdo gerado, faz o commit e o push, e confere a Action verde
