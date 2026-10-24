import { agruparPorTema } from '../content/indice.ts'
import { type Baralho, baralhoSchema } from '../content/schema.ts'

// Conteúdo fixo dos testes, para não depender dos Baralhos de `content/`,
// que mudam a cada /flashcards ou /flashcards-remove.
// Use com: vi.mock('../content/load.ts', () => import('../test/conteudo.ts'))
export const baralhos: Baralho[] = [
  baralhoSchema.parse({
    id: 'complexidade-de-algoritmos',
    tema: { slug: 'computacao', nome: 'Computação' },
    nome: 'Complexidade de algoritmos',
    descricao:
      'Notação assintótica, custo de buscas e ordenações e recorrências.',
    notas: [
      {
        id: 'complexidade-de-algoritmos-brvvq0ie',
        tipo: 'pergunta-resposta',
        frente:
          'Qual é a complexidade de tempo da busca binária abaixo?\n\n```ts\nfunction buscaBinaria(v: number[], alvo: number): number {\n  let ini = 0\n  let fim = v.length - 1\n  while (ini <= fim) {\n    const meio = Math.floor((ini + fim) / 2)\n    if (v[meio] === alvo) return meio\n    if (v[meio] < alvo) ini = meio + 1\n    else fim = meio - 1\n  }\n  return -1\n}\n```',
        verso:
          '$O(\\log n)$: a cada iteração o intervalo de busca cai pela metade.',
        extra: 'Exige que o vetor esteja ordenado.',
      },
      {
        id: 'complexidade-de-algoritmos-x8ah4ci6',
        tipo: 'pergunta-resposta',
        frente:
          'Qual recorrência descreve o tempo do merge sort e qual é a sua solução?',
        verso:
          '$$T(n) = 2T(n/2) + O(n)$$\n\nque resolve para $O(n \\log n)$ pelo Teorema Mestre.',
      },
      {
        id: 'complexidade-de-algoritmos-ou9az3k0',
        tipo: 'lacuna',
        texto:
          'A busca linear em um vetor de $n$ elementos tem complexidade de pior caso {{c1::$O(n)$}}.',
      },
      {
        id: 'complexidade-de-algoritmos-x4u5y547',
        tipo: 'lacuna',
        texto:
          'O quicksort tem complexidade média {{c1::$O(n \\log n)$}}, mas no pior caso chega a {{c2::$O(n^2)$::polinomial}}.',
      },
      {
        id: 'complexidade-de-algoritmos-rzsrg7nv',
        tipo: 'lacuna',
        texto:
          'Uma função é {{c1::$\\Theta(g(n))$}} quando é ao mesmo tempo {{c2::$O(g(n))$}} e {{c2::$\\Omega(g(n))$}}.',
      },
      {
        id: 'complexidade-de-algoritmos-9thz02tt',
        tipo: 'pergunta-resposta',
        frente:
          'Qual é a complexidade de acesso a um elemento de um vetor pelo índice?',
        verso: '$O(1)$, tempo constante.',
        extra: 'Em uma lista encadeada, o mesmo acesso custa $O(n)$.',
      },
    ],
  }),
]

export const temas = agruparPorTema(baralhos)
