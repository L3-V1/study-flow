---
name: plan-triage
description: Organiza os planos de .plans/ em pastas por fase do roteiro de desenvolvimento (.plans/fase-N/ ou .plans/outros/), gravando a fase no frontmatter de cada plano. Use SEMPRE logo depois que um plano for salvo na raiz de .plans/ (por exemplo, pela skill plan-backup, ou quando um hook pedir), e também quando o usuário pedir para triar, organizar ou separar os planos por fase.
---

# Plan Triage

O roteiro em `.plans/` divide o Study Flow em fases, e cada fase gera seus próprios planos. Sem triagem, a raiz de `.plans/` vira uma lista cronológica longa em que não dá para ver o que pertence a cada fase. Esta skill mantém a raiz só com o roteiro e move cada plano para a pasta da sua fase.

## Estrutura alvo

```
.plans/
  2026-10-21-roteiro-desenvolvimento-study-flow.md   (tipo: roteiro, nunca sai da raiz)
  fase-0/
  fase-1/
  ...
  outros/                                            (planos que não pertencem a nenhuma fase)
```

As pastas são criadas sob demanda, só quando o primeiro plano daquela fase é triado.

## Passo a passo

### 1. Encontre o roteiro e os planos pendentes

- Leia os `.md` da **raiz** de `.plans/` (não entre nas subpastas).
- O roteiro é o arquivo com `tipo: roteiro` no frontmatter. Leia-o para conhecer as fases (`## Fase N: <título>`), seus objetivos e entregáveis. Nunca mova nem altere o roteiro.
- Pendentes são os demais `.md` da raiz **sem** o campo `fase` no frontmatter. Processe todos, não só o recém-salvo: isso recupera planos salvos antes da skill existir ou quando o hook não disparou.

Se não houver pendentes, não diga nada além de uma linha confirmando que não há o que triar.

### 2. Decida a fase de cada plano

Compare o conteúdo do plano com as fases do roteiro (objetivo, arquivos citados, entregáveis, critério de pronto) e escolha:

- **Uma fase:** `fase: N`.
- **Várias fases:** a fase **predominante** (a que concentra mais do conteúdo do plano) vai em `fase`, e todas as cobertas vão em `fases`, em ordem crescente. Ex.: `fase: 5` e `fases: [5, 6]`.
- **Nenhuma fase** (ferramentas do projeto, processo, skills, ajustes transversais): `fase: outros`.

Decida sozinho quando a correspondência for clara. Pergunte ao usuário (com a ferramenta de perguntas, recomendando a sua escolha) só quando houver dúvida real, como duas fases com peso equivalente ou um plano que pode ser tanto de uma fase quanto de `outros`.

### 3. Grave a fase no frontmatter

Acrescente `fase` (e `fases`, se houver mais de uma) ao frontmatter existente, logo depois de `status`, com a ferramenta Edit. Não altere mais nada no arquivo: o plano é um registro fiel do que foi aprovado.

```markdown
---
titulo: Modelo de conteúdo e validação
data: 2026-10-25
status: aprovado
fase: 1
---
```

### 4. Mova o arquivo

- Destino: `.plans/fase-N/` (ex.: `.plans/fase-1/`) ou `.plans/outros/`, criando a pasta se não existir.
- Mantenha o nome do arquivo. Se já existir um arquivo com o mesmo nome no destino, acrescente um sufixo numérico (`-2`, `-3`, ...) antes do `.md`.
- Use `git mv` se o arquivo estiver versionado; senão, `mv`.

### 5. Informe e pare

Diga em uma linha por plano para onde ele foi, por exemplo:

> Plano triado: `.plans/fase-1/2026-10-25-modelo-conteudo-validacao.md`.

E pare aí: não faça commit e não inicie a implementação do plano. Quem decide os próximos passos é o usuário.
