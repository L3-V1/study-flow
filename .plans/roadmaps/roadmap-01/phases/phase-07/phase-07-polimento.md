---
titulo: Fase 7 - Polimento
data: 2026-10-23
status: aprovado
tipo: phase
numero: "07"
pai: roadmaps/roadmap-01
triagem: ok
---

# Fase 7: Polimento

## Contexto

Última fase do roteiro (`.plans/roadmaps/roadmap-01/roadmap-01-desenvolvimento-study-flow.md`). As Fases 0 a 6 estão commitadas (`05ee682`). Falta deixar a v1 redonda: estados vazios claros, foco visível e teclado completo na Sessão, uma auditoria com a `ui-ux-kit:ui-guidelines` e uma passada de `/code-review`.

Decisões tomadas com você:
- **Estados vazios** num componente único `EstadoVazio`, centralizado e com ícone SVG inline (regra 8).
- **Foco na Sessão:** ao revelar, vai para o grupo das avaliações (sem selecionar botão); depois de avaliar, volta para "Mostrar resposta".
- **`/code-review` em todo o `src/` e `scripts/`**, não só no diff.
- **Incluir o "Estudar" do Tema inteiro** na tela de Tema (lacuna da Fase 4).

## O que a leitura do código já mostrou

- **Estados vazios:** só existe "Nenhum Baralho por enquanto." em texto solto (`Inicio.tsx:13`, `Progresso.tsx:53`). Com nada para estudar, o `BotaoEstudar` mostra "Estudar · 0 vencidos · 0 novos" desabilitado, sem explicar; abrir `/estudar/...` direto mostra "Sessão concluída, 0 Cards revisados". Um Baralho todo suspenso não tem aviso nenhum.
- **Foco:** o CSS não tem nenhuma regra de `:focus-visible`. Na Sessão, o botão focado some ao revelar e ao avaliar, e o foco cai no `body`. O atalho de Espaço é global: com o foco em "Erro na Nota", Espaço revela em vez de acionar o botão.
- **Checklist:** sem travessões (regra 16, grep limpo); datas em pt-BR (regra 2); modal com Cancelar neutro e Substituir em vermelho (regra 4). Achados:
  - Regra 14: o campo do limite tem mensagem própria, mas nenhum destaque visual quando é inválido
  - Regra 17: `.aviso` (0.5rem 0.75rem) e `.aviso-backup` (0.75rem 1rem) são o mesmo tipo de contêiner com respiros diferentes; células de tabela do Markdown (0.25rem 0.5rem) diferentes das do Progresso (0.5rem 0.75rem)
  - Regra 10: `.botao-estudar` pode quebrar linha
  - Regra 5: o campo numérico do limite tem 7rem fixo. Mantenho de propósito (3 dígitos ao lado de "Salvar") e registro como exceção
- `schema.ts:41` exige ao menos uma Nota por Baralho, então "Baralho vazio" não acontece.

## Passos

### 1. Estados vazios
- `src/components/EstadoVazio.tsx`: `{ titulo, children? }`, ícone SVG inline com `aria-hidden`, título e texto centralizados. Estilo `.vazio` no `index.css` (cor `--texto-suave` no ícone, padding no padrão do `.cartao`).
- **Sem conteúdo** (`Inicio.tsx`, `Progresso.tsx`): "Nenhum Baralho por enquanto." com o texto "Gere Notas com `/flashcards`."
- **Nada para estudar** (`Sessao.tsx`): se a fila já começa vazia, mostra `EstadoVazio` "Nada para estudar agora" com o link de volta, em vez de "Sessão concluída". Guardar se a fila inicial era vazia (`useState`), para que suspender a última Nota durante a Sessão continue terminando em "Sessão concluída".
- **`BotaoEstudar` desabilitado:** o texto passa a dizer o motivo: "Todas as Notas suspensas" quando todos os Cards do escopo estão suspensos e "Nada para estudar hoje" no resto. `useContagem` (`src/study/useSessao.ts`) passa a devolver também `tudoSuspenso`, calculado com `cardsDoEscopo` e os `estados` que `carregarSessao` já lê.
- **Baralho todo suspenso** (`Baralho.tsx`): `EstadoVazio` "Todas as Notas deste Baralho estão suspensas" acima da lista, com "Reative as Notas abaixo depois de corrigi-las." A lista continua visível (é onde fica o "Reativar").
- **Tema** (`Tema.tsx`): `<BotaoEstudar escopo={{ temaSlug }} />` abaixo do título, como no Início.

### 2. Acessibilidade e teclado na Sessão
- `index.css`: `:focus-visible { outline: 2px solid var(--link); outline-offset: 2px; }` global, valendo para links, botões, campos e o grupo de avaliações.
- `Sessao.tsx`:
  - O atalho de Espaço ignora quando o alvo é `button` ou `a` (o navegador já aciona o elemento). Estender `campoDeTexto` ou criar uma checagem ao lado
  - Um `useEffect` de foco ligado a `[revelado, atual?.id, fila === undefined]`: revelado → foca o grupo `.avaliacoes` (`tabIndex={-1}`, `role="group"`, `aria-label="Avaliação"`); oculto → foca "Mostrar resposta"; fim de Sessão → foca o `<h2>` (`tabIndex={-1}`) de "Sessão concluída" ou do estado vazio
- `Progresso.tsx` e `Heatmap.tsx`: os blocos com rolagem horizontal (`.tabela-rolagem`, `.heatmap-rolagem`) ganham `tabIndex={0}`, `role="region"` e `aria-label`, para rolar pelo teclado.

### 3. Auditoria com a `ui-ux-kit:ui-guidelines`
Rodar a skill sobre `src/` (idioma pt-BR, sem doc de design, feedback inline com `role="status"`/`alert` já é o padrão). Correções já previstas:
- Regra 14: `.configuracoes input:user-invalid { border-color: var(--errei); }`
- Regra 17: `.aviso` com o mesmo padding de `.aviso-backup`; células `th, td` globais com 0.5rem 0.75rem, removendo o override duplicado em `.tabela-rolagem`
- Regra 10: `white-space: nowrap` em `.botao-estudar`

O que a skill achar além disso (principalmente na validação visual em 360px, 768px e 1280px, nos temas claro e escuro), corrijo dentro das 17 regras e com os tokens existentes; o que fugir delas eu pergunto antes.

### 4. `/code-review` da v1
Rodar `/code-review` sobre `src/` e `scripts/` depois dos passos 1 a 3. Corrigir os achados confirmados respeitando a regra de ouro (nenhum ID de Nota, Lacuna ou `tipo` muda) e relatar os que eu deixar de fora, com o motivo.

### 5. Testes
- `src/pages/Sessao.test.tsx`:
  - Sessão sem nada para estudar mostra "Nada para estudar agora"
  - Revelar move o foco para o grupo "Avaliação"; avaliar devolve o foco para "Mostrar resposta"
  - Com o foco em "Erro na Nota", Espaço não revela a resposta
- `src/App.test.tsx` (ou junto dos testes do Baralho): suspender todas as Notas de um Baralho mostra "Todas as Notas suspensas" no botão e o estado vazio na tela do Baralho; a tela de Tema tem o botão "Estudar" do Tema
- `Inicio` sem conteúdo: um teste com `vi.mock('../content/load.ts')` devolvendo `temas: []`, conferindo o estado vazio
- Ajustar as asserções que dependiam do texto "Estudar · 0 vencidos · 0 novos"

## Arquivos
Novo: `src/components/EstadoVazio.tsx` (e o teste do Início sem conteúdo)
Alterados: `src/pages/Sessao.tsx`, `src/pages/Inicio.tsx`, `src/pages/Tema.tsx`, `src/pages/Baralho.tsx`, `src/pages/Progresso.tsx`, `src/components/BotaoEstudar.tsx`, `src/components/Heatmap.tsx`, `src/study/useSessao.ts`, `src/index.css`, testes de `Sessao` e `App`. Mais o que a auditoria e o review apontarem.

Reaproveitar: `cardsDoEscopo` (`src/study/session.ts`), `carregarSessao`/`useContagem` (`src/study/useSessao.ts`), os tokens de cor do `:root` e o padrão de aviso com `role="status"` já usado em `Sessao.tsx` e `Configuracoes.tsx`.

## Verificação
1. `npm run validate && npm run lint && npm run format:check && npm test && npm run build`, tudo verde
2. `npm run dev` com o Playwright (MCP), em 360px, 768px e 1280px, claro e escuro:
   - Sessão inteira só pelo teclado: Tab até "Estudar", Enter, Espaço revela, 1 a 4 avaliam, o foco visível acompanha e nunca cai no `body`; Tab chega a "Erro na Nota" e Espaço o aciona
   - Estudar tudo até zerar → "Nada para estudar hoje" no botão e "Nada para estudar agora" ao abrir `/estudar` direto
   - Suspender todas as Notas de um Baralho → botão e estado vazio corretos; "Reativar" volta ao normal
   - Sem rolagem horizontal na página em 360px; tabela e heatmap rolam pelo teclado
   - `browser_console_messages` sem erros
3. Relatório da `ui-guidelines` (corrigido / já conforme) e do `/code-review` (corrigido / deixado de fora)
4. Uso real no celular pelo GitHub Pages antes de declarar a v1 pronta
