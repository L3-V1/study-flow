---
titulo: Fase 5 - Backup
data: 2026-10-23
status: aprovado
tipo: phase
numero: "05"
pai: roadmaps/roadmap-01
triagem: ok
---

# Fase 5: Backup

## Contexto

Esta é a sexta fase do roteiro (`.plans/roadmaps/roadmap-01/roadmap-01-desenvolvimento-study-flow.md`). A Fase 4 deixou o estudo funcionando, com o progresso no IndexedDB (`src/progress/db.ts`, Dexie: `cardStates`, `reviewLogs`, `settings`). Pelo ADR 0002, esse progresso só existe no navegador: se os dados do site forem limpos, ele se perde, e não há como levá-lo para outro dispositivo. Esta fase acrescenta a exportação e a importação manuais em JSON, o aviso de backup atrasado e a tela de Configurações, que também passa a editar o limite de Cards novos por dia (hoje só dá para mudá-lo direto no banco).

Decisões tomadas com você:
- **O banner aparece só no Início.**
- **Sem nenhum backup feito, o banner aparece assim que existir progresso** (qualquer `cardState` ou `reviewLog`). Num app ainda sem uso, ele não aparece.
- **Configurações fica em `/configuracoes`**, com um link no Início. O "Exportar agora" do banner exporta direto, sem sair do Início.

## Premissas (ajuste antes de aprovar se discordar)

1. **Formato:** `{ versao: 1, exportadoEm, cardStates, reviewLogs, settings }`, com as linhas das tabelas como estão no banco. As datas viram strings ISO no JSON, e o schema Zod da importação as converte de volta para `Date` (`z.coerce.date()`), senão o `ts-fsrs` e o índice `review` quebram. `versao` diferente de 1 é rejeitada.
2. **O "último backup" fica em `settings`** como `{ chave: 'ultimoBackup', valor: <timestamp> }`, no mesmo formato numérico do limite. Ao exportar, ele é gravado **antes** da leitura e na mesma transação, então o arquivo já o contém. Importar esse arquivo depois traz junto a data certa do backup.
3. **Importar substitui tudo:** numa transação, limpa as três tabelas e faz `bulkAdd` de cada uma, mantendo os `id` dos `reviewLogs`. Assim o resultado é idêntico ao exportado.
4. **Fluxo da importação:** escolher o arquivo → `JSON.parse` + `safeParse`. Se for inválido, mostra "Arquivo inválido: não é um backup do Study Flow." e não abre o modal. Se for válido, abre um `<dialog>` nativo (`showModal`) com a data do backup e as contagens ("N Cards com progresso e M revisões. Isso substitui todo o progresso atual.") e os botões Cancelar e Substituir.
5. **Limite de novos:** um campo numérico inteiro de 0 a 999 com o botão "Salvar" e o aviso "Limite salvo.". Valor fora disso fica bloqueado pela validação do formulário, com mensagem própria em pt-BR.
6. **Atraso:** passou de 7 dias quando `agora − ultimoBackup > 7 × 24 h`. O banner diz "Seu último backup foi há N dias." ou "Você ainda não fez um backup do seu progresso.".
7. **Fora desta fase:** importação parcial ou mesclada, backup automático e estatísticas (Fase 6).

## Passos

### 1. Backup (`src/progress/backup.ts`)
- `backupSchema` (Zod), com o `Card` e o `ReviewLog` do `ts-fsrs` campo a campo (`due`, `last_review?` e `review` como `z.coerce.date()`), o `EstadoCard` e o `RegistroRevisao` de `db.ts`, e o `Ajuste`. O tipo `Backup` sai do `z.infer`
- `exportarBackup(agora): Promise<Backup>`: transação `rw` nas três tabelas, com `put` do `ultimoBackup` e depois `toArray` de cada tabela
- `lerBackup(texto): Backup | undefined`: `JSON.parse` + `safeParse`, devolvendo `undefined` se falhar
- `importarBackup(backup)`: transação que faz `clear` e `bulkAdd` em cada tabela
- `nomeDoArquivo(agora)`: `study-flow-backup-AAAA-MM-DD.json`, com a data local
- `backupAtrasado(agora): Promise<boolean>`: lê o `ultimoBackup`. Se não existir, devolve `true` quando há algum `cardState` ou `reviewLog`; se existir, aplica a regra da premissa 6. Uma variante devolve também os dias, para o texto do banner
- `baixarBackup(agora)`: `exportarBackup` → `Blob` → `URL.createObjectURL` → `<a download>` com `click()` → `revokeObjectURL`. Usado pela tela de Configurações e pelo banner

### 2. Limite (`src/progress/db.ts`)
- `gravarLimiteNovos(n)`, ao lado do `lerLimiteNovos()` que já existe. Exportar a constante da chave `'limiteNovosPorDia'` não é necessário; ela continua só em `db.ts`

### 3. Telas
- `src/pages/Configuracoes.tsx` (rota `/configuracoes`), com a trilha "Início › Configurações" e três seções:
  - **Limite de Cards novos por dia:** um formulário com o valor atual carregado via `lerLimiteNovos`
  - **Exportar:** o botão "Exportar backup" chama `baixarBackup` e mostra o aviso "Backup exportado." com `role="status"`, ou uma mensagem de erro se falhar
  - **Importar:** `<input type="file" accept="application/json,.json">`, o modal da premissa 4 e o aviso "Backup importado." no fim
- `src/components/AvisoBackup.tsx`: `useLiveQuery` no `backupAtrasado(new Date())`. Quando for `true`, mostra o banner discreto com o texto e o botão "Exportar agora". Depois de exportar, o banner some sozinho, porque a consulta é reativa ao `settings`
- `src/pages/Inicio.tsx`: o `AvisoBackup` no topo e o link "Configurações"
- `src/App.tsx`: a rota `/configuracoes`
- `src/index.css`: estilos do banner (no padrão do `.aviso`), do formulário, do `dialog` (com `::backdrop`, cores de `--fundo`/`--texto` nos dois temas) e dos botões das Configurações (alvos de 2,75rem)

### 4. Testes
- `src/progress/backup.test.ts`:
  - **Ida e volta:** avaliar e suspender alguns Cards, gravar um limite, exportar, passar por `JSON.stringify` → `lerBackup`, limpar o banco, importar e conferir que as três tabelas são iguais (`toEqual`) às de antes, inclusive as `Date` e os `id` dos logs. Este é o "pronto quando" do roteiro em versão automática
  - A importação substitui: um estado que só existia antes some
  - `lerBackup` rejeita JSON quebrado, `versao: 2` e um `cardState` sem `fsrs`
  - `exportarBackup` grava o `ultimoBackup`, e `nomeDoArquivo` usa a data local
  - `backupAtrasado`: falso sem progresso; verdadeiro com progresso e sem backup; falso com 7 dias exatos; verdadeiro com 7 dias e 1 minuto
- `src/pages/Configuracoes.test.tsx` (com `URL.createObjectURL` mockado):
  - Salvar o limite grava em `settings` e mostra "Limite salvo."
  - Exportar chama o download e mostra o aviso
  - Importar um arquivo válido abre o modal; Cancelar não muda nada; Substituir troca os dados e mostra "Backup importado."; um arquivo inválido mostra o erro sem abrir o modal
  - Observação: o jsdom não implementa `HTMLDialogElement.showModal`, então o teste o define num stub (no `setup.ts` ou no próprio teste)
- `App.test.tsx`: o Início mostra o banner quando há progresso sem backup, e "Exportar agora" o faz sumir

## Arquivos
Novos: `src/progress/backup.ts`, `src/progress/backup.test.ts`, `src/pages/Configuracoes.tsx`, `src/pages/Configuracoes.test.tsx`, `src/components/AvisoBackup.tsx`
Alterados: `src/progress/db.ts`, `src/App.tsx`, `src/App.test.tsx`, `src/pages/Inicio.tsx`, `src/index.css`, e possivelmente `src/test/setup.ts` (o stub do `showModal`)

Reaproveitar: `db`, `lerLimiteNovos` e os tipos `EstadoCard`/`RegistroRevisao` de `src/progress/db.ts`; o padrão de trilha e de aviso `role="status"` de `src/pages/Sessao.tsx`; e o `useLiveQuery` como em `src/study/useSessao.ts`.

## Verificação
1. `npm run lint && npm run format:check && npm test && npm run build`, tudo verde
2. `npm run dev` com o Playwright (MCP), em 390px e em 1280px: estudar alguns Cards → o banner "ainda não fez um backup" aparece no Início → "Exportar agora" baixa `study-flow-backup-2026-10-23.json` e o banner some → em Configurações, mudar o limite para 5 e ver a contagem de novos cair no Início
3. Ida e volta real: limpar o IndexedDB (`browser_evaluate` com `indexedDB.deleteDatabase('study-flow')` + recarregar), importar o arquivo baixado, confirmar no modal e ver que as contagens dos botões "Estudar" e o limite voltam exatamente como antes. Importar um JSON qualquer mostra o erro
4. Banner atrasado: gravar um `ultimoBackup` de 8 dias atrás via `browser_evaluate` e ver o texto "há 8 dias"
5. Para o "pronto quando" do roteiro: você exporta no navegador do computador e importa no celular (ou numa aba anônima) e confere que as contagens batem
