---
titulo: Fase 1 - Modelo de conteúdo e validação
data: 2026-10-21
status: implementado
fase: 1
tipo: phase
numero: "01"
pai: roadmaps/roadmap-01
triagem: ok
---

# Fase 1: Modelo de conteúdo e validação

## Contexto

Segunda fase do roteiro (`.plans/roadmaps/roadmap-01/roadmap-01-desenvolvimento-study-flow.md`). A Fase 0 deixou o esqueleto publicado e o `scripts/validate-content.ts` como stub. Agora o formato do JSON de Baralho fica definido (Zod), com a lógica de Lacunas, a derivação de Cards, o carregamento no app e a validação real, tudo testado, antes de o slash command da Fase 2 começar a gerar conteúdo.

Ponto de atenção do ambiente: `src/content/load.ts` usa `import.meta.glob`, que só existe no Vite. O script `validate` roda em Node via `tsx`, então ele **não** importa o `load.ts`: lê os arquivos com `fs` e chama uma função pura de validação compartilhada (`src/content/validate.ts`), que também é a usada nos testes.

## Premissas (ajuste antes de aprovar se discordar)

1. **Objetos estritos** (`z.strictObject`): campo desconhecido é erro. Pega erro de digitação do gerador (`dica` em vez de `extra`, etc.).
2. **`id` do Baralho = slug do arquivo** (`content/redes/tcp-ip.json` → `id: "tcp-ip"`); o validador confere. O ID da Nota segue o formato `^[a-z0-9]+(-[a-z0-9]+)*-[a-z0-9]{8}$`, mas o validador **não** exige que o prefixo seja o Baralho atual, para uma Nota poder mudar de Baralho no futuro sem trocar de ID (e perder progresso).
3. **Números de Lacuna podem ter buracos** (c1, c3): como nunca se renumera, apagar a c2 é legítimo. Só exige ≥ 1 Lacuna e números ≥ 1.
4. **Sintaxe de Lacuna igual à do Anki**: `{{cN::trecho}}` ou `{{cN::trecho::dica}}`, não aninhadas. Limitação conhecida: `::` dentro do trecho (ex.: `std::vector`) é lido como início da dica, e `}}` dentro do trecho fecha a Lacuna. A diretriz da Fase 2 vai mandar evitar isso. Um `{{c` que sobrar depois do parse (ex.: `{{c2:x}}`) é erro de validação.
5. **Saída do cloze em Markdown**: o Card de lacuna vira strings Markdown, com a Lacuna ativa como `**[...]**` (ou `**[dica]**`) na frente e `**trecho**` no verso; as outras Lacunas mostram o trecho puro. Assim o componente `Markdown` da Fase 3 renderiza tudo igual; o destaque visual pode ser refinado lá.
6. **Duas checagens extras pequenas**, além das do roteiro: `id` do Baralho bate com o nome do arquivo, e Baralhos do mesmo Tema concordam no `tema.nome` (senão a tela de Tema da Fase 3 não sabe qual nome mostrar).

## Passos

### 1. Dependência
- `npm i zod` (v4, dependência de runtime, porque o `load.ts` faz o parse no app)

### 2. `src/content/schema.ts`
- `slugSchema`: `^[a-z0-9]+(-[a-z0-9]+)*$`
- `notaPerguntaRespostaSchema`: `{ id, tipo: z.literal('pergunta-resposta'), frente, verso, extra? }` (textos `z.string().min(1)`)
- `notaLacunaSchema`: `{ id, tipo: z.literal('lacuna'), texto, extra? }`
- `notaSchema = z.discriminatedUnion('tipo', [...])`
- `baralhoSchema`: `{ id: slug, tema: { slug, nome }, nome, descricao?, notas: z.array(notaSchema).min(1) }`
- Tipos exportados com `z.infer`: `Baralho`, `Nota`, `NotaLacuna`, `NotaPerguntaResposta`

### 3. `src/content/cloze.ts`
- Uma regex única `/\{\{c(\d+)::(.+?)(?:::(.+?))?\}\}/g`
- `numerosDasLacunas(texto): number[]`: números distintos, ordenados
- `renderizarLacuna(texto, numero, revelada: boolean): string`: aplica a premissa 5
- `temLacunaMalformada(texto): boolean`: remove as Lacunas válidas e procura `{{c` restante

### 4. `src/content/cards.ts`
- Tipo `Card = { id, notaId, frente, verso, extra? }` (strings Markdown prontas)
- `derivarCards(nota): Card[]`: pergunta e resposta → 1 Card com `id = nota.id`; lacuna → 1 Card por número, `id = \`${nota.id}::c${n}\``, frente/verso via `renderizarLacuna`

### 5. `src/content/validate.ts` (puro, sem `fs`)
- `validarConteudo(arquivos: { caminho: string; dados: unknown }[]): string[]`, com `caminho` relativo a `content/` (ex.: `redes/tcp-ip.json`). Retorna as mensagens de erro (vazio = ok), cada uma prefixada com o caminho e, quando houver, o ID da Nota
- Checagens: caminho no formato `<tema>/<baralho>.json` (exatamente um nível); `baralhoSchema.safeParse` (erros do Zod formatados com o path do campo); `tema.slug` = pasta; `id` = nome do arquivo; IDs de Nota únicos em todo o conteúdo (aponta os dois arquivos); Nota de lacuna com ≥ 1 Lacuna e sem Lacuna malformada; `tema.nome` consistente por Tema

### 6. `scripts/validate-content.ts`
- Substitui o stub: lista `content/**/*.json` com `fs.readdirSync(dir, { recursive: true })`, faz `JSON.parse` (erro de sintaxe vira mensagem com o caminho), chama `validarConteudo`, imprime os erros e sai com código 1, ou imprime "N Baralhos, M Notas, K Cards válidos" e sai com 0
- Importa de `../src/content/validate.ts` (com extensão, como o resto do projeto)

### 7. `src/content/load.ts`
- `import.meta.glob('/content/**/*.json', { eager: true, import: 'default' })` → `baralhoSchema.parse` em cada um → exporta `baralhos: Baralho[]`. Sem revalidar regras entre arquivos (o build já garante)

### 8. Integração no build e no type-check
- `package.json`: `"build": "npm run validate && tsc -b && vite build"` (o roteiro pede que o JSON inválido falhe o build; a Action já roda `validate` antes, a repetição custa ~1 s)
- `tsconfig.node.json`: incluir `scripts` no `include`, para o `tsc -b` checar o script (hoje ele não é checado por nenhum tsconfig)

### 9. Baralho de exemplo, escrito à mão
- `content/computacao/complexidade-de-algoritmos.json` (Tema "Computação"), ~6 Notas: pergunta e resposta com bloco de código (busca binária), fórmula inline (`$O(\log n)$`) e em bloco (`$$T(n) = 2T(n/2) + O(n)$$`); lacuna simples, lacuna com dica e lacuna com dois trechos do mesmo número; uma Nota com `extra`
- IDs no formato `complexidade-de-algoritmos-<8 base36>`, gerados uma vez e fixos

### 10. Testes (Vitest)
- `src/content/schema.test.ts`: aceita os dois tipos; rejeita `tipo` desconhecido, campo extra, texto vazio, ID fora do formato, Baralho sem Notas
- `src/content/cloze.test.ts`: números distintos e ordenados (incluindo repetidos e buracos); dica; frente oculta só o número ativo e mostra os demais; dois trechos do mesmo número ocultos juntos; malformada detectada
- `src/content/cards.test.ts`: IDs `notaId` e `notaId::cN`; quantidade de Cards por Nota; frente/verso esperados
- `src/content/validate.test.ts`: exemplo válido passa; cada regra quebrada gera um erro com o caminho (ID duplicado entre arquivos, lacuna sem Lacuna, Tema ≠ pasta, `id` ≠ arquivo, caminho com profundidade errada, `tema.nome` divergente, JSON fora do schema)
- `src/content/load.test.ts`: carrega o conteúdo real e encontra o Baralho de exemplo

## Arquivos
Novos: `src/content/{schema,cloze,cards,validate,load}.ts` e seus `.test.ts`, `content/computacao/complexidade-de-algoritmos.json`
Alterados: `scripts/validate-content.ts`, `package.json` (+ `package-lock.json`), `tsconfig.node.json`

## Verificação
1. `npm run lint && npm run format:check && npm run validate && npm test && npm run build`, tudo verde; o `validate` imprime a contagem do exemplo
2. Rejeição manual: duplicar uma Nota do exemplo num segundo arquivo temporário e trocar o `tema.slug` → `npm run validate` sai com 1 e lista os dois erros; `npm run build` também falha. Desfazer depois
3. Push na `main` e conferir a Action verde (o app ainda não mostra o conteúdo; isso é a Fase 3)
