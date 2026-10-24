---
titulo: Fase 6 - Tela de progresso
data: 2026-10-23
status: implementado
tipo: phase
numero: "06"
pai: roadmaps/roadmap-01
triagem: ok
---

# Fase 6: Tela de progresso

## Contexto

Esta é a sétima fase do roteiro (`.plans/roadmaps/roadmap-01/roadmap-01-desenvolvimento-study-flow.md`). Com o estudo (Fase 4) e o backup (Fase 5) prontos, falta ver a evolução: quantos Cards estão em cada estado por Baralho e Tema, a sequência de dias estudados e um heatmap das revisões. Toda a agregação fica em funções puras (`src/progress/stats.ts`) testadas com o Vitest, e a tela só lê o banco e desenha.

Observação: a Fase 5 está implementada mas **ainda não commitada** (arquivos `M`/`??` no `git status`). Esta fase parte desse working tree. Sugiro commitar a Fase 5 antes de começar, para os diffs ficarem separados.

Decisões tomadas com você:
- **Heatmap do último ano** (53 semanas, como no GitHub). No celular, rola na horizontal dentro do próprio bloco, aberto já na semana atual.
- **Uma tabela por Tema**: uma linha por Baralho e uma linha de Total, com as colunas Novos, Em aprendizado, Maduros, Vencidos hoje e Suspensos.
- **A sequência só quebra no fim do dia**: sem revisão hoje, a contagem parte de ontem.

## Premissas (ajuste antes de aprovar se discordar)

1. **Estados do Card, para as contagens.** A iteração parte dos Cards do conteúdo (como em `montarSessao`), então estados órfãos não contam. Para cada Card:
   - **Suspenso:** `suspenso === true`. Conta só aqui, para as colunas somarem o total de Cards
   - **Novo:** sem estado ou `fsrs.state === State.New`
   - **Maduro:** `fsrs.scheduled_days >= 21` (o intervalo até a próxima revisão; o campo não é depreciado no `ts-fsrs` 5)
   - **Em aprendizado:** os demais Cards já revisados
   - **Vencido hoje:** um Card em aprendizado ou maduro com `fsrs.due < fimDoDia(agora)`, a mesma regra da Sessão. É um subconjunto, então não entra na soma
2. **Dia de estudo** é o dia local de `src/study/dia.ts`, com chave `AAAA-MM-DD` em data local (não `toISOString`, que é UTC).
3. **Sequência:** se houve revisão hoje, conta hoje e os dias anteriores seguidos; se não, parte de ontem. Sem revisão ontem nem hoje, é 0.
4. **Heatmap:** 53 colunas de semana (domingo a sábado), terminando na semana de hoje. Os dias depois de hoje ficam vazios (sem célula visível). Cinco níveis de cor: 0 e então `ceil(4 × total / máximo do período)`, relativos ao dia mais cheio. Cada célula tem `title` e `aria-label` "N revisões em 23/10/2026" (data em pt-BR). Acima, o total do período ("N revisões no último ano"); uma legenda "Menos ■■■■■ Mais" embaixo.
5. **Rota `/progresso`**, com o link "Progresso" no rodapé do Início, ao lado de "Configurações". Trilha "Início › Progresso".
6. **Leitura do banco:** um hook com `useLiveQuery` lê `lerEstados()` e as datas das revisões com `db.reviewLogs.orderBy('review').keys()` (só o índice, sem carregar os logs inteiros). Assim a tela é reativa e não depende de recarregar.
7. **Fora desta fase:** previsão de revisões futuras e taxa de retenção (fora da v1 pelo roteiro), e mostrar as contagens nas telas de Tema e Baralho.

## Passos

### 1. Agregação (`src/progress/stats.ts`)
Funções puras, sem Dexie:
- `type Contagem = { novos; aprendizado; maduros; vencidos; suspensos }`
- `contarCards(cards: Card[], estados: Map<string, EstadoCard>, agora): Contagem`, com as regras da premissa 1
- `contagemDoEscopo(temas, escopo, estados, agora)`: compõe `cardsDoEscopo` (de `src/study/session.ts`) com `contarCards`. A tela usa para cada Baralho e para o total do Tema
- `chaveDoDia(data): string`: `AAAA-MM-DD` local
- `revisoesPorDia(datas: Date[]): Map<string, number>`
- `sequencia(porDia, agora): number`: premissa 3, andando para trás com `setDate(-1)` (respeita horário de verão)
- `semanasDoHeatmap(porDia, agora): (Dia | null)[][]`, com `Dia = { data: Date; total: number; nivel: 0|1|2|3|4 }` e os dias futuros como `null` na última semana

### 2. Tela
- `src/pages/Progresso.tsx`:
  - Resumo no topo: "Sequência: N dias seguidos" (singular/plural) e o heatmap
  - Uma `<section>` por Tema com `<h2>` e a `<table>` da premissa 1, com o cabeçalho com `<th scope="col">`, a primeira coluna com `<th scope="row">` e a linha Total em negrito
  - Enquanto o `useLiveQuery` carrega, só o título e a trilha (mesmo padrão do `BotaoEstudar`)
  - Sem conteúdo: "Nenhum Baralho por enquanto." (como no Início); sem revisões, o heatmap aparece vazio e a sequência mostra 0
- `src/components/Heatmap.tsx`: grade de 7 linhas × 53 colunas em CSS grid (`grid-auto-flow: column`), dentro de um contêiner com `overflow-x: auto`. Um `useEffect` com `scrollLeft = scrollWidth` deixa a semana atual visível no celular. Células com `role="img"` e `aria-label`
- `src/App.tsx`: rota `/progresso`
- `src/pages/Inicio.tsx`: o link "Progresso" no rodapé
- `src/index.css`: estilos da tabela (números alinhados à direita, `font-variant-numeric: tabular-nums`) e do heatmap, com uma escala de cor nos dois temas a partir de `--bom` (variáveis `--nivel-0` a `--nivel-4` no `:root` e no bloco escuro, no padrão das cores já existentes)

### 3. Testes
- `src/progress/stats.test.ts`, com `agora` fixo como em `session.test.ts`:
  - `contarCards`: um cenário com um Card de cada estado (novo sem estado, novo com estado `New`, aprendizado não vencido, aprendizado vencido, maduro com 21 dias, maduro vencido, suspenso, e um estado órfão) e o resultado exato. Este é o "números batem com um cenário montado em teste" do roteiro
  - Limites: `scheduled_days` 20 é aprendizado e 21 é maduro; `due` às 23:59 de hoje vence, amanhã às 00:00 não
  - `contagemDoEscopo`: o total do Tema é a soma dos Baralhos
  - `revisoesPorDia` agrupa por dia local (23:59 e 00:01 caem em dias diferentes)
  - `sequencia`: 0 sem revisões; 3 com hoje, ontem e anteontem; 2 com ontem e anteontem e nada hoje; um buraco quebra a contagem
  - `semanasDoHeatmap`: 53 semanas, a primeira começando num domingo, a última contendo hoje, dias futuros `null`, e os níveis (0 para zero, 4 para o máximo)
- `src/pages/Progresso.test.tsx` (ou um caso em `App.test.tsx`): avaliar um Card do conteúdo real com `avaliar` e suspender outro, abrir `/progresso` e ver a sequência "1 dia seguido", a célula de hoje com "1 revisão em …" e as contagens da linha do Baralho
- `App.test.tsx`: o link "Progresso" do Início leva à tela

## Arquivos
Novos: `src/progress/stats.ts`, `src/progress/stats.test.ts`, `src/pages/Progresso.tsx`, `src/pages/Progresso.test.tsx`, `src/components/Heatmap.tsx`
Alterados: `src/App.tsx`, `src/App.test.tsx`, `src/pages/Inicio.tsx`, `src/index.css`

Reaproveitar: `cardsDoEscopo` e o tipo `Escopo` de `src/study/session.ts`; `fimDoDia`/`inicioDoDia` de `src/study/dia.ts`; `db`, `lerEstados` e `EstadoCard` de `src/progress/db.ts`; `temas` de `src/content/load.ts`; o padrão de trilha de `src/pages/Tema.tsx` e o `useLiveQuery` como em `src/study/useSessao.ts`.

## Verificação
1. `npm run lint && npm run format:check && npm test && npm run build`, tudo verde
2. `npm run dev` com o Playwright (MCP), em 390px e em 1280px: estudar alguns Cards e suspender uma Nota → em Progresso, conferir que as contagens batem com o botão "Estudar" do Baralho (vencidos e novos) e que o suspenso aparece na coluna; a sequência mostra 1 dia e a célula de hoje está colorida. Em 390px, o heatmap rola dentro do bloco e abre na semana atual, sem rolagem horizontal na página
3. Sequência e heatmap com histórico: via `browser_evaluate`, inserir `reviewLogs` em dias passados (por exemplo, ontem e anteontem) e ver a sequência ir a 3 e as células aparecerem
4. Uso real no celular pelo link do GitHub Pages, como pede o roteiro ao fim da Fase 6
