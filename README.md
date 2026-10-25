# Study Flow

App pessoal para estudar flashcards de qualquer assunto com repetição espaçada. O conteúdo é gerado fora do app, pelo Claude Code; o app exibe os cards e acompanha o progresso.

**Acesse:** https://l3-v1.github.io/study-flow/

## Funcionalidades

- Repetição espaçada com o algoritmo FSRS.
- Notas de pergunta e resposta e Notas de lacuna, organizadas em Temas e Baralhos.
- Markdown com destaque de código e fórmulas em KaTeX.
- Progresso salvo no navegador (IndexedDB), sem servidor, com exportação e importação em JSON para backup.
- Página de progresso com heatmap de revisões.

## Rodando localmente

```bash
npm install
npm run dev       # servidor de desenvolvimento
npm test          # testes
npm run validate  # confere todo o content/
npm run build     # build de produção em dist/
```

Cada push na `main` publica o site no GitHub Pages pelo workflow `.github/workflows/deploy.yml`.

## Conteúdo

As Notas ficam em `content/<tema>/<baralho>.json`, no formato definido em `src/content/schema.ts`. Elas são criadas e mantidas pelo Claude Code:

- `/flashcards`: gera Notas a partir de um tema, arquivo ou URL.
- `/flashcards-fix`: corrige o texto de uma Nota.
- `/flashcards-remove`: remove Notas, Baralhos ou Temas.

Nunca altere o ID de uma Nota existente, nunca renumere Lacunas e nunca troque o `tipo` de uma Nota: o progresso de cada Card está preso a esses IDs.

## Documentação

- [GLOSSARY.md](GLOSSARY.md): vocabulário do domínio.
- [ADR 0001](docs/adr/0001-conteudo-gerado-fora-do-app.md): conteúdo gerado fora do app.
- [ADR 0002](docs/adr/0002-site-estatico-progresso-local.md): site estático com progresso local.
- [ADR 0003](docs/adr/0003-progresso-orfao-apagado-ao-abrir.md): progresso órfão apagado ao abrir.
