---
description: Remove Notas, Baralhos ou Temas de content/ e commita
argument-hint: <notaId | baralhoId | temaSlug> [...]
allowed-tools: Read, Edit, Glob, Grep, Bash(npm run validate), Bash(git rm:*), Bash(git diff:*), Bash(git status:*), Bash(git commit:*)
---

Remova do Study Flow as Notas, Baralhos ou Temas indicados. Argumentos: `$ARGUMENTS`

Cada palavra é um ID de Nota, um ID de Baralho ou um slug de Tema.

## 1. Resolver cada argumento

- **Nota:** `Grep` de `"id": "<arg>"` em `content/`.
- **Baralho:** `Glob` de `content/*/<arg>.json`.
- **Tema:** a pasta `content/<arg>/`.

Se algum argumento não for encontrado, avise o usuário e pare, sem remover nada. Se um argumento for ao mesmo tempo Tema e Baralho, pergunte qual dos dois e espere a resposta.

Lacunas avulsas não são removidas aqui: para tirar uma Lacuna de uma Nota, use o `/flashcards-fix`.

## 2. Listar e confirmar

Mostre ao usuário tudo o que vai sair:

- Notas com o `id` e o início da `frente` (ou do `texto`, nas de lacuna).
- Baralhos e Temas com a contagem de Notas.
- Os arquivos e pastas que vão sumir por ficarem vazios (um Baralho sem Notas, um Tema sem Baralhos).

Avise que o progresso desses Cards é apagado na próxima vez que o app for aberto (ADR 0003) e que só volta com um backup.

Pare e espere o usuário responder "sim". Qualquer outra resposta cancela.

## 3. Remover

- **Nota:** com `Edit`, tire o objeto da Nota do array `notas`, sem mexer nas outras Notas nem na ordem delas. Se o Baralho ficar sem Notas, remova o arquivo com `git rm`.
- **Baralho:** `git rm content/<tema>/<baralho>.json`.
- **Tema:** `git rm -r content/<slug>`.

O `git rm` já apaga a pasta que fica vazia. Os IDs removidos nunca são reaproveitados em Notas novas.

## 4. Validar e commitar

Rode `npm run validate` (se falhar por causa da remoção, corrija e rode de novo) e mostre `git diff --stat` dos caminhos tocados (inclua `--cached` para os removidos com `git rm`).

Faça o commit só desses caminhos, com `git commit -m "chore(content): remove <resumo>" -- <caminhos>`. Outras alterações não commitadas em `content/` não entram no commit.
