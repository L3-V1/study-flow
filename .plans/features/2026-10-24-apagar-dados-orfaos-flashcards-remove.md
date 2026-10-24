---
titulo: Apagar dados locais, limpar progresso órfão e /flashcards-remove
data: 2026-10-24
status: aprovado
tipo: standalone
categoria: features
triagem: ok
---

# Apagar dados locais, limpar progresso órfão e /flashcards-remove

## Contexto

Decidido na sabatina:

1. **Apagar dados pela UI.** Configurações ganha uma seção para apagar dados do IndexedDB, por categoria. Não existe localStorage, e Notas e Cards vêm do build, então só dá para apagar progresso, histórico e ajustes.
2. **Limpeza automática de órfãos.** Ao abrir, o app apaga `cardStates` e `reviewLogs` de Cards que não existem mais no build. Se apagar algo, avisa com uma faixa no Início. Isso inverte uma consequência do ADR 0002.
3. **`/flashcards-remove`.** Um slash command que remove fisicamente Notas, Baralhos ou Temas de `content/`, valida e commita.

## 1. Camada de dados: `src/progress/db.ts`

- `apagarDados({ progresso, ajustes }: { progresso: boolean; ajustes: boolean }): Promise<void>`
  - Roda numa transação `rw` sobre as 3 tabelas.
  - `progresso`: `cardStates.clear()` + `reviewLogs.clear()`.
  - `ajustes`: `settings.delete('limiteNovosPorDia')`. O `ultimoBackup` (`CHAVE_ULTIMO_BACKUP` em `backup.ts`) nunca é apagado.
- `limparOrfaos(cardIds: Set<string>): Promise<number>`
  - Numa transação `rw` (`cardStates` + `reviewLogs`), junta os `cardId` distintos das duas tabelas que não estão em `cardIds`.
  - Apaga os estados (`bulkDelete`) e os logs (`reviewLogs.where('cardId').anyOf(orfaos).delete()`, que usa o índice que já existe).
  - Retorna quantos Cards distintos foram limpos.

## 2. Limpeza na abertura: `src/main.tsx` + `src/App.tsx` + `src/pages/Inicio.tsx`

- `main.tsx`:
  - `const cardsRemovidos = await limparOrfaos(new Set(cardsDoEscopo(temas, {}).map((c) => c.id)))`.
  - Reaproveita `cardsDoEscopo` de `src/study/session.ts` e `temas` de `src/content/load.ts`.
  - O top-level await funciona porque o target já é es2023.
  - Se falhar, faz um `catch` que vira 0, para nunca impedir o app de abrir.
  - Depois renderiza `<App cardsRemovidos={cardsRemovidos} />`.
  - Rodar só no `main.tsx` mantém os testes (que renderizam `App` direto) livres da limpeza e evita a dupla execução do StrictMode.
- `App.tsx`:
  - Recebe a prop opcional `cardsRemovidos = 0` e guarda em `useState`.
  - Passa para `<Inicio>` o número e um `aoFechar` que zera o estado. Assim, fechar a faixa vale para a sessão toda, mesmo navegando e voltando ao Início.
- Novo componente `src/components/AvisoOrfaos.tsx`:
  - Uma faixa no estilo do `AvisoBackup`: classe `aviso-backup`, `role="status"`.
  - Texto: "Progresso de N Card(s) removido(s) do conteúdo foi apagado.", mais um botão "Fechar".
  - Não renderiza nada quando N = 0.
  - Fica no topo do `Inicio`, ao lado do `AvisoBackup`.
- Obs.: se `content/` ficar vazio, todo o progresso é apagado. É consequência direta da decisão (risco aceito, recuperação pelo backup).

## 3. UI de apagar: `src/pages/Configuracoes.tsx`

- Nova seção `ApagarDados`, depois de `Importar`:
  - Título "Apagar dados".
  - Dois checkboxes com label: "Progresso e histórico" e "Ajustes (limite de Cards novos)".
  - Um botão "Apagar…" desabilitado enquanto nenhum estiver marcado.
- Abre um `<dialog>` seguindo o padrão do `Importar` (`useRef`, `showModal`, `aria-labelledby`, `.acoes`, `button.perigo`):
  - Diz o que será apagado e que não dá para desfazer sem backup.
  - Botões: "Exportar backup antes" (`baixarBackup`, com aviso de erro), "Cancelar" e "Apagar" (`perigo`).
- Ao confirmar:
  - Chama `apagarDados`, mostra `MensagemAviso` ("Dados apagados." / erro) e fecha o diálogo.
  - Chama o mesmo callback do `Importar` para remontar o `LimiteNovos`. O contador `importacoes` passa a se chamar `recargas`, porque agora tem dois usos.
- CSS: reaproveita `.configuracoes button.perigo` e `.acoes`. Só entra estilo novo se os checkboxes precisarem de alinhamento (ex.: `.opcao` com flex + gap), seguindo os tokens existentes.

## 4. Slash command: `.claude/commands/flashcards-remove.md`

Frontmatter no padrão dos outros comandos:
- `description`: Remove Notas, Baralhos ou Temas de content/ e commita.
- `argument-hint: <notaId | baralhoId | temaSlug> [...]`
- `allowed-tools: Read, Edit, Glob, Grep, Bash(npm run validate), Bash(git rm:*), Bash(git diff:*), Bash(git status:*), Bash(git commit:*)`

Etapas:
1. **Resolver cada argumento:**
   - Nota: `Grep` do `"id": "<arg>"` em `content/`.
   - Baralho: `Glob content/*/<arg>.json`.
   - Tema: a pasta `content/<arg>/`.
   - Não encontrado → avisa e para. Tema e Baralho ao mesmo tempo → pergunta qual e espera.
2. **Listar e confirmar:**
   - Notas aparecem com o início da `frente` ou do `texto`, e Baralhos/Temas com a contagem de Notas.
   - A lista inclui os arquivos e pastas que vão sumir por ficarem vazios.
   - Avisa que o progresso desses Cards é apagado na próxima abertura do app (ADR 0003).
   - Para e espera um "sim".
3. **Remover:**
   - Nota: `Edit` tirando o objeto do array `notas`, sem mexer nas outras nem na ordem. Se o Baralho ficar sem Notas, usa `git rm` no arquivo.
   - Baralho: `git rm` no arquivo.
   - Tema: `git rm -r content/<slug>`.
   - O `git rm` já remove a pasta que fica vazia.
   - Os IDs removidos nunca são reaproveitados.
4. **Validar e commitar:**
   - `npm run validate` (se falhar por causa da remoção, corrige e roda de novo) e mostra `git diff --stat` dos caminhos.
   - Commit só dos caminhos tocados (`git commit -m "..." -- <caminhos>`), com a mensagem `chore(content): remove <resumo>`.
   - Se houver outras alterações não commitadas em `content/`, não entram no commit.
- Lacunas avulsas ficam de fora: indica o `/flashcards-fix`.

## 5. Documentação

- `docs/adr/0003-progresso-orfao-apagado-ao-abrir.md`: a decisão, o motivo (dados que nunca mais serão usados, remoção explícita via `/flashcards-remove`), o risco aceito e a recuperação pelo backup.
- `docs/adr/0002-...md`: a consequência "O progresso de Notas removidas continua..." ganha a nota "Substituída pelo ADR 0003".
- `CLAUDE.md` (seção Study Flow): acrescenta "Remover Notas, Baralhos ou Temas: `/flashcards-remove`" e o ADR 0003 na lista de decisões.

## Testes (vitest + fake-indexeddb, padrão de `db.test.ts` / `Configuracoes.test.tsx`)

- `db.test.ts`:
  - `apagarDados` com só progresso, só ajustes e ambos. O `ultimoBackup` fica intacto e o limite volta a 20.
  - `limparOrfaos` mantém os Cards válidos, apaga estados e logs dos órfãos (inclusive Lacunas `::cN`) e retorna a contagem distinta.
- `Configuracoes.test.tsx`:
  - O botão fica desabilitado sem seleção.
  - Apagar o progresso esvazia as tabelas e mostra "Dados apagados.".
  - Apagar os ajustes faz o campo voltar a 20.
  - Cancelar não apaga nada.
- `App`/`Inicio` test: com `cardsRemovidos={3}` a faixa aparece; "Fechar" faz ela sumir e ela não volta ao navegar até Configurações e voltar.

## Verificação

1. `npm test`, `npm run lint`, `npm run format:check` e `npm run build`.
2. Manual (`npm run dev` + Playwright):
   - Estudar alguns Cards e apagar por categoria em Configurações. Conferir o heatmap vazio e o limite padrão.
   - Remover temporariamente uma Nota estudada do JSON, recarregar e ver a faixa com N = 1. Depois `git restore`.
3. `/flashcards-remove`: rodar com um ID inexistente (deve parar) e com uma Nota real numa branch descartável, conferindo a confirmação, o validate e o commit.
