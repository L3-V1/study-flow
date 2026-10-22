# Site estático no GitHub Pages com progresso no IndexedDB

O app é publicado como site estático no GitHub Pages, em repositório público, e tem um único usuário de fato. O progresso de cada Card (estado FSRS, histórico de revisões, suspensões) fica no IndexedDB do navegador, com exportação e importação manuais em JSON para backup e para levar entre dispositivos. Descartamos as alternativas que sincronizam: um Gist privado exigiria um token em cada dispositivo, gravar no repo exporia o progresso publicamente e um backend como o Supabase seria trabalho demais para um único usuário.

## Consequências

- Não há sincronização automática entre dispositivos. Limpar os dados do site apaga o progresso que não tiver backup. Para reduzir esse risco, o app avisa quando passam 7 dias sem uma exportação.
- O progresso de Notas removidas continua no IndexedDB e é ignorado. Se a Nota voltar com o mesmo ID, o progresso volta junto.
