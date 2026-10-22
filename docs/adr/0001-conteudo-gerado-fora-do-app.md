# Conteúdo gerado fora do app, pelo Claude Code

O app não cria nem edita Notas. Elas são arquivos JSON versionados no repositório (um por Baralho, organizados por Tema), gerados e corrigidos por slash commands do Claude Code que ficam em `.claude/commands/` neste mesmo repo. Assim o app fica sem editor, sem chave de API e sem backend: a geração por IA acontece onde ela já está disponível, e o conteúdo é revisado pelo usuário antes do commit e do push. Os JSONs entram no build, que valida o schema e falha o deploy se algum estiver inválido.

## Consequências

- Corrigir uma Nota exige o Claude Code. Por isso o app só suspende o Card e copia um comando de correção pronto para colar.
- Cada Nota tem um ID estável atribuído pelo comando, e Lacunas são numeradas explicitamente. Os comandos precisam ler o JSON existente e nunca reatribuir IDs, senão o progresso se perde.
