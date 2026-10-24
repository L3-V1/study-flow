# Progresso de Cards removidos é apagado ao abrir o app

Ao abrir, o app apaga do IndexedDB os estados e o histórico de revisões de Cards que não existem mais no conteúdo do build, e avisa no Início quantos foram limpos. Esse progresso nunca mais seria usado: remover uma Nota, Baralho ou Tema é uma ação explícita, feita pelo `/flashcards-remove`, e os IDs removidos não são reaproveitados. Manter os dados só ocupava espaço e inflava o backup e as estatísticas.

## Consequências

- Se uma Nota sair do conteúdo por engano e o app for aberto antes de ela voltar, o progresso dela é perdido. No caso extremo, um `content/` vazio apaga todo o progresso. Aceitamos esse risco: a recuperação é importar um backup, e o app já avisa quando o backup está atrasado.
- Substitui a consequência do ADR 0002 de que o progresso de Notas removidas continuava no IndexedDB.
