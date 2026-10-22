---
description: Corrige o texto de uma Nota existente sem mudar ID, tipo ou números das Lacunas
argument-hint: <notaId> <descrição do problema>
allowed-tools: Read, Edit, Grep, Bash(npm run validate), Bash(git diff:*)
---

Corrija uma Nota do Study Flow. Argumentos: `$ARGUMENTS`

A primeira palavra é o ID da Nota; o resto descreve o problema.

## 1. Achar a Nota

Procure o ID com `Grep` em `content/`. Se não achar, avise o usuário e pare.

## 2. Corrigir

Leia o arquivo e altere com `Edit` **só os campos de texto daquela Nota** (`frente`, `verso`, `texto`, `extra`), seguindo as mesmas regras de qualidade do `/flashcards` (uma ideia por Nota, respostas curtas, Markdown, LaTeX com `\` no JSON, pt-BR).

O progresso de cada Card fica preso ao ID da Nota (e, nas Notas de lacuna, ao número da Lacuna, em `<notaId>::cN`). Por isso:

- **Nunca** altere o `id` nem o `tipo`.
- Numa Nota de lacuna, mantenha os números das Lacunas que ficarem. Você pode apagar uma Lacuna (deixar um buraco na numeração é permitido), mas nunca renumere as outras nem reaproveite um número apagado; uma Lacuna nova recebe um número maior que todos os que já foram usados.
- Não mexa em outras Notas nem na ordem de `notas`.

Se a correção exigir outro `tipo`, não faça: explique o motivo e sugira apagar a Nota e gerar uma nova com o `/flashcards`.

## 3. Validar e mostrar

Rode `npm run validate` (se falhar por causa da sua edição, corrija e rode de novo) e mostre `git diff -- <arquivo>`.

**Não** faça commit.
