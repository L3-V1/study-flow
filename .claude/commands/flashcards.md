---
description: Gera Notas de flashcards a partir de um tema, arquivo ou URL e grava num Baralho em content/
argument-hint: <tema livre | arquivo | URL> [--baralho <slug>] [--tema <slug>] [--n <qtd>]
allowed-tools: Read, Write, Edit, Glob, Grep, WebFetch, Bash(npm run validate), Bash(npm run id:*)
---

Gere Notas de flashcards para o Study Flow a partir de: `$ARGUMENTS`

Siga as etapas na ordem. Use o vocabulário do `GLOSSARY.md` (Tema, Baralho, Nota, Card, Lacuna) em tudo o que escrever.

## 1. Interpretar os argumentos

Separe a fonte das flags:

- `--baralho <slug>`: o Baralho a criar ou ampliar
- `--tema <slug>`: o Tema (pasta em `content/`)
- `--n <qtd>`: quantidade exata de Notas a gerar

O que sobrar é a fonte.

## 2. Ler a fonte

- Caminho de arquivo existente: leia com `Read`. PDFs grandes, em blocos de até 20 páginas (`pages`), até cobrir o material todo.
- URL (`http://` ou `https://`): leia com `WebFetch`.
- Qualquer outra coisa: é um tema livre; use o seu próprio conhecimento.

## 3. Decidir entre criar e ampliar

1. Leia `src/content/schema.ts` para conhecer o formato exato do Baralho e das Notas, e um JSON existente em `content/` como exemplo.
2. Liste `content/*/*.json` com `Glob`. Cada arquivo fica em `content/<tema-slug>/<baralho-slug>.json`, com `id` igual ao nome do arquivo e `tema.slug` igual à pasta.
3. Escolha o Baralho:
   - Com `--baralho <slug>`: procure `content/*/<slug>.json`. Se existir, amplie; se não, crie.
   - Sem `--baralho`: proponha um slug curto para o tópico (ex.: `tcp-ip`). Só amplie um Baralho existente quando ele cobrir claramente o mesmo tópico; senão, crie.
4. Escolha o Tema do mesmo jeito (`--tema` ou um slug proposto, reaproveitando um Tema existente quando couber). Ao usar um Tema que já existe, copie o `tema.nome` exatamente como está nos outros Baralhos dele (o validador exige nomes iguais).
5. Ao criar, preencha `id`, `tema` (`slug` e `nome`), `nome` e uma `descricao` curta.
6. Ao ampliar: leia o JSON inteiro e não gere Notas que repitam a ideia de uma existente. **Só acrescente**: as Notas novas vão para o fim de `notas`, e as existentes ficam intocadas (ID, texto e ordem). Corrigir uma Nota existente é tarefa do `/flashcards-fix`.

## 4. Volume

Gere Notas em proporção ao material: pouco conteúdo, poucas Notas. O teto é de cerca de 30 Notas por execução. Se houver `--n`, gere exatamente esse número.

## 5. Qualidade das Notas

- **Uma ideia por Nota.** Respostas curtas.
- **Nota de lacuna** (`"tipo": "lacuna"`, campo `texto`) para fatos, definições e termos, sempre dentro de uma frase com contexto suficiente para a Lacuna ter uma só resposta. Ex.: `"O {{c1::TCP}} garante a entrega ordenada dos segmentos."`
- **Nota de pergunta e resposta** (`"tipo": "pergunta-resposta"`, campos `frente` e `verso`) para porquês, comparações, procedimentos e código.
- Lacunas numeradas a partir de `c1` (`{{c1::trecho}}`, ou `{{c1::trecho::dica}}`). Cada número gera um Card; use o mesmo número só para trechos que devem sumir juntos.
- Nunca use `::` nem `}}` dentro do trecho ou da dica de uma Lacuna (a regex não suporta).
- `extra` só quando acrescentar contexto útil (exceção, exemplo, contraste). Não repita a resposta.
- Os textos são Markdown: blocos de código sempre com a linguagem (` ```ts `), LaTeX em `$...$` ou `$$...$$`. No JSON, toda `\` vira `\` (ex.: `"$O(n \log n)$"`) e quebras de linha viram `\n`.
- Tudo em pt-BR.

## 6. IDs

Nunca invente IDs. Gere todos de uma vez com:

```
npm run id -- <baralho-slug> <qtd>
```

e use um ID por Nota nova, na ordem impressa.

## 7. Gravar

Grave o JSON com 2 espaços de indentação, no mesmo estilo dos arquivos existentes: `Write` para um Baralho novo, `Edit` para acrescentar ao fim de `notas` de um existente.

## 8. Validar

Rode `npm run validate`.

- Se acusar erro em Notas que você criou nesta execução, corrija só essas Notas e rode de novo, até passar.
- Se acusar erro em outro arquivo ou numa Nota que já existia, não mexa: avise o usuário com a mensagem do erro e pare.

## 9. Resumo

Mostre:

- o arquivo criado ou ampliado;
- o Tema e o Baralho (slug e nome);
- quantas Notas de cada tipo foram geradas;
- uma linha por Nota nova: o ID e o início da `frente` ou do `texto`.

**Não** faça commit: o usuário revisa o conteúdo antes.
