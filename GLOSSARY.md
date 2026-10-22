# Study Flow

App pessoal para estudar flashcards de qualquer assunto com repetição espaçada. O conteúdo é gerado fora do app, pelo Claude Code; o app exibe os cards e acompanha o progresso.

## Linguagem

### Organização

**Tema**:
Uma área ampla de estudo que agrupa Baralhos relacionados, como "Redes" ou "Direito Constitucional".
_Evitar_: Matéria, categoria, assunto

**Baralho**:
Um conjunto de cards sobre um tópico específico dentro de um Tema, como "TCP/IP" dentro de "Redes".
_Evitar_: Deck, coleção, lista

### Notas e Cards

**Nota**:
A unidade de conteúdo escrita pelo Claude Code em um Baralho. Gera um ou mais Cards.
_Evitar_: Flashcard, pergunta, entrada

**Nota de pergunta e resposta**:
Uma Nota com frente e verso, que gera exatamente um Card.
_Evitar_: Nota básica, Q&A

**Nota de lacuna**:
Uma Nota formada por uma frase com uma ou mais Lacunas, que gera um Card por Lacuna.
_Evitar_: Nota cloze

**Card**:
A unidade que o estudante revisa e que tem progresso próprio. Um Card sempre pertence a uma Nota.
_Evitar_: Flashcard, item de revisão, pergunta

**Lacuna**:
Um trecho de uma frase que fica oculto durante a revisão e que o estudante precisa lembrar. Trechos com o mesmo número formam uma única Lacuna e ficam ocultos juntos.
_Evitar_: Cloze, omissão, espaço em branco

### Estudo

**Sessão**:
Uma rodada de estudo sobre um Baralho, um Tema ou todos os Temas, com os Cards vencidos e os Cards novos permitidos no dia.
_Evitar_: Estudo, rodada, treino

**Card novo**:
Um Card que nunca foi revisado. Entram por dia, no máximo, tantos Cards novos quanto o limite diário permite.
_Evitar_: Card não visto

**Card vencido**:
Um Card já revisado cuja próxima revisão agendada chegou.
_Evitar_: Card pendente, Card atrasado

**Card em aprendizado**:
Um Card já revisado que ainda não chegou a ser maduro.
_Evitar_: Card jovem

**Card maduro**:
Um Card cujo intervalo até a próxima revisão chegou a 21 dias ou mais, o que indica uma lembrança consolidada.
_Evitar_: Card dominado, Card aprendido

**Card suspenso**:
Um Card retirado das Sessões pelo estudante, normalmente porque a Nota dele tem um erro. Ele mantém o progresso.
_Evitar_: Card ignorado, Card desativado

**Avaliação**:
A nota que o estudante dá à própria lembrança de um Card: Errei, Difícil, Bom ou Fácil. É ela que determina quando o Card volta.
_Evitar_: Resposta, nota, classificação
