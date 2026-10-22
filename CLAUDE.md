# CLAUDE.md

Diretrizes de comportamento para reduzir erros comuns de LLMs ao programar. Mescle com as instruções específicas do projeto conforme necessário.

**Contrapartida:** Estas diretrizes favorecem a cautela em vez da velocidade. Para tarefas triviais, use o bom senso.

## 1. Pense antes de codar

**Não presuma. Não esconda a confusão. Exponha as contrapartidas.**

Antes de implementar:
- Declare suas premissas explicitamente. Se estiver em dúvida, pergunte.
- Se houver múltiplas interpretações, apresente-as - não escolha em silêncio.
- Se existir uma abordagem mais simples, diga. Discorde quando for justificado.
- Se algo não estiver claro, pare. Diga o que está confuso. Pergunte.

## 2. Simplicidade primeiro

**O mínimo de código que resolve o problema. Nada especulativo.**

- Nenhuma funcionalidade além do que foi pedido.
- Nenhuma abstração para código de uso único.
- Nenhuma "flexibilidade" ou "configurabilidade" que não foi solicitada.
- Nenhum tratamento de erro para cenários impossíveis.
- Se você escreveu 200 linhas e poderiam ser 50, reescreva.

Pergunte a si mesmo: "Um engenheiro sênior diria que isto está complicado demais?" Se sim, simplifique.

## 3. Mudanças cirúrgicas

**Toque só no que for necessário. Limpe apenas a sua própria bagunça.**

Ao editar código existente:
- Não "melhore" código, comentários ou formatação adjacentes.
- Não refatore o que não está quebrado.
- Siga o estilo existente, mesmo que você fizesse diferente.
- Se notar código morto não relacionado, mencione - não apague.

Quando suas mudanças criarem órfãos:
- Remova imports/variáveis/funções que as SUAS mudanças deixaram sem uso.
- Não remova código morto preexistente, a menos que seja pedido.

O teste: toda linha alterada deve se ligar diretamente ao pedido do usuário.

## 4. Execução orientada a metas

**Defina critérios de sucesso. Itere até verificar.**

Transforme tarefas em metas verificáveis:
- "Adicionar validação" → "Escrever testes para entradas inválidas e então fazê-los passar"
- "Corrigir o bug" → "Escrever um teste que o reproduza e então fazê-lo passar"
- "Refatorar X" → "Garantir que os testes passem antes e depois"

Para tarefas com várias etapas, apresente um plano breve:
```
1. [Etapa] → verificar: [checagem]
2. [Etapa] → verificar: [checagem]
3. [Etapa] → verificar: [checagem]
```

Critérios de sucesso fortes permitem iterar de forma independente. Critérios fracos ("faça funcionar") exigem esclarecimentos constantes.

---

**Estas diretrizes estão funcionando se:** houver menos mudanças desnecessárias nos diffs, menos reescritas por excesso de complexidade, e as perguntas de esclarecimento vierem antes da implementação, não depois dos erros.

## Study Flow

- Vocabulário do domínio: `GLOSSARY.md`. Decisões: `docs/adr/0001-conteudo-gerado-fora-do-app.md` e `docs/adr/0002-site-estatico-progresso-local.md`.
- Formato do conteúdo: `src/content/schema.ts`; `npm run validate` confere todo o `content/`.
- Gerar Notas: `/flashcards`. Corrigir uma Nota: `/flashcards-fix`.

**Regra de ouro:** nunca altere o ID de uma Nota existente, nunca renumere Lacunas e nunca troque o `tipo` de uma Nota. O progresso de cada Card no IndexedDB está preso a esses IDs.
