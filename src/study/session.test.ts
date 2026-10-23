import { type Card as CardFsrs, State, createEmptyCard } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import type { Tema } from '../content/indice.ts'
import type { EstadoCard } from '../progress/db.ts'
import { inicioDoDia, fimDoDia } from './dia.ts'
import { aposAvaliar, cardsDoEscopo, montarSessao } from './session.ts'

const agora = new Date(2026, 9, 23, 10, 0)

const temas: Tema[] = [
  {
    slug: 'redes',
    nome: 'Redes',
    baralhos: [
      {
        id: 'tcp-ip',
        tema: { slug: 'redes', nome: 'Redes' },
        nome: 'TCP/IP',
        notas: [
          { id: 'tcp-a', tipo: 'pergunta-resposta', frente: 'F', verso: 'V' },
          { id: 'tcp-b', tipo: 'lacuna', texto: '{{c2::x}} e {{c1::y}}' },
        ],
      },
      {
        id: 'dns',
        tema: { slug: 'redes', nome: 'Redes' },
        nome: 'DNS',
        notas: [
          { id: 'dns-a', tipo: 'pergunta-resposta', frente: 'F', verso: 'V' },
        ],
      },
    ],
  },
  {
    slug: 'direito',
    nome: 'Direito',
    baralhos: [
      {
        id: 'cf',
        tema: { slug: 'direito', nome: 'Direito' },
        nome: 'CF',
        notas: [
          { id: 'cf-a', tipo: 'pergunta-resposta', frente: 'F', verso: 'V' },
        ],
      },
    ],
  },
]

const ids = (cards: { id: string }[]) => cards.map((c) => c.id)

function estado(
  cardId: string,
  fsrs: Partial<CardFsrs>,
  suspenso = false,
): [string, EstadoCard] {
  return [
    cardId,
    { cardId, fsrs: { ...createEmptyCard(agora), ...fsrs }, suspenso },
  ]
}

const revisao = (due: Date) => ({ state: State.Review, due })

function sessao(
  estados: [string, EstadoCard][] = [],
  { novosHoje = 0, limite = 20, escopo = {} } = {},
) {
  return montarSessao({
    cards: cardsDoEscopo(temas, escopo),
    estados: new Map(estados),
    novosHoje,
    limite,
    agora,
  })
}

describe('cardsDoEscopo', () => {
  it('Tudo: todos os Cards na ordem Tema → Baralho → Nota → Lacuna', () => {
    expect(ids(cardsDoEscopo(temas, {}))).toEqual([
      'tcp-a',
      'tcp-b::c1',
      'tcp-b::c2',
      'dns-a',
      'cf-a',
    ])
  })

  it('Tema: só os Cards do Tema', () => {
    expect(ids(cardsDoEscopo(temas, { temaSlug: 'direito' }))).toEqual(['cf-a'])
  })

  it('Baralho: só os Cards do Baralho', () => {
    expect(
      ids(cardsDoEscopo(temas, { temaSlug: 'redes', baralhoId: 'dns' })),
    ).toEqual(['dns-a'])
  })
})

describe('montarSessao', () => {
  it('sem progresso, tudo é novo', () => {
    const s = sessao()
    expect(s.vencidos).toEqual([])
    expect(s.novos).toHaveLength(5)
  })

  it('limite diário parcial corta os novos', () => {
    expect(ids(sessao([], { novosHoje: 18 }).novos)).toEqual([
      'tcp-a',
      'tcp-b::c1',
    ])
  })

  it('limite diário esgotado não traz novos', () => {
    expect(sessao([], { novosHoje: 20 }).novos).toEqual([])
    expect(sessao([], { novosHoje: 25 }).novos).toEqual([])
  })

  it('vencidos vêm ordenados por due e não contam no limite', () => {
    const s = sessao(
      [
        estado('dns-a', revisao(new Date(2026, 9, 23, 9))),
        estado('tcp-a', revisao(new Date(2026, 9, 20))),
      ],
      { novosHoje: 20 },
    )
    expect(ids(s.vencidos)).toEqual(['tcp-a', 'dns-a'])
    expect(s.novos).toEqual([])
  })

  it('vence ainda hoje conta; vence amanhã fica fora', () => {
    const s = sessao([
      estado('tcp-a', revisao(new Date(2026, 9, 23, 23, 59))),
      estado('dns-a', revisao(fimDoDia(agora))),
    ])
    expect(ids(s.vencidos)).toEqual(['tcp-a'])
    expect(ids(s.novos)).not.toContain('dns-a')
  })

  it('suspensos ficam fora, novos ou não', () => {
    const s = sessao([
      estado('tcp-a', {}, true),
      estado('dns-a', revisao(new Date(2026, 9, 20)), true),
    ])
    expect(s.vencidos).toEqual([])
    expect(ids(s.novos)).toEqual(['tcp-b::c1', 'tcp-b::c2', 'cf-a'])
  })

  it('estado New (ex.: suspenso e reativado) continua novo', () => {
    expect(ids(sessao([estado('cf-a', {})]).novos)).toContain('cf-a')
  })

  it('estado órfão não tem efeito', () => {
    const s = sessao([estado('sumiu', revisao(new Date(2026, 9, 1)))])
    expect(s.vencidos).toEqual([])
    expect(s.novos).toHaveLength(5)
  })
})

describe('aposAvaliar', () => {
  const cards = cardsDoEscopo(temas, { baralhoId: 'tcp-ip' })
  const [a, b, c] = cards as [
    (typeof cards)[0],
    (typeof cards)[0],
    (typeof cards)[0],
  ]

  it('Errei: o Card que vence hoje volta para o fim', () => {
    const novo = {
      ...createEmptyCard(agora),
      due: new Date(agora.getTime() + 6e4),
    }
    expect(ids(aposAvaliar([a, b, c], a, novo, agora))).toEqual([
      b.id,
      c.id,
      a.id,
    ])
  })

  it('o Card que vence amanhã sai da fila', () => {
    const novo = { ...createEmptyCard(agora), due: new Date(2026, 9, 25) }
    expect(ids(aposAvaliar([a, b, c], a, novo, agora))).toEqual([b.id, c.id])
  })

  it('virada do dia: o fim do dia segue o agora da Avaliação', () => {
    const quaseMeiaNoite = new Date(2026, 9, 23, 23, 58)
    const novo = { ...createEmptyCard(agora), due: new Date(2026, 9, 24, 0, 8) }
    expect(ids(aposAvaliar([a], a, novo, quaseMeiaNoite))).toEqual([])
    const depois = new Date(2026, 9, 24, 0, 1)
    expect(ids(aposAvaliar([a], a, novo, depois))).toEqual([a.id])
  })
})

describe('dia', () => {
  it('início e fim são meias-noites locais', () => {
    expect(inicioDoDia(agora)).toEqual(new Date(2026, 9, 23))
    expect(fimDoDia(agora)).toEqual(new Date(2026, 9, 24))
  })
})
