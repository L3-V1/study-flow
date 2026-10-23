import { type Card as CardFsrs, State, createEmptyCard } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import type { Card } from '../content/cards.ts'
import type { Tema } from '../content/indice.ts'
import type { EstadoCard } from './db.ts'
import {
  contagemDoEscopo,
  contarCards,
  revisoesPorDia,
  semanasDoHeatmap,
  sequencia,
} from './stats.ts'

const agora = new Date(2026, 9, 23, 10, 0)
const amanha = new Date(2026, 9, 24, 0, 0)
const ontem = new Date(2026, 9, 22, 10, 0)

function card(id: string): Card {
  return {
    id,
    notaId: id,
    tipo: 'pergunta-resposta',
    frente: 'F',
    verso: 'V',
  }
}

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

const revisado = (scheduled_days: number, due: Date) => ({
  state: State.Review,
  scheduled_days,
  due,
})

describe('contarCards', () => {
  it('conta um Card de cada estado', () => {
    const cards = [
      'novo',
      'novo-new',
      'aprendendo',
      'aprendendo-vencido',
      'maduro',
      'maduro-vencido',
      'suspenso',
    ].map(card)
    const estados = new Map([
      estado('novo-new', { state: State.New }),
      estado('aprendendo', revisado(5, amanha)),
      estado('aprendendo-vencido', revisado(5, ontem)),
      estado('maduro', revisado(21, amanha)),
      estado('maduro-vencido', revisado(30, ontem)),
      estado('suspenso', revisado(5, ontem), true),
      estado('orfao', revisado(5, ontem)),
    ])
    expect(contarCards(cards, estados, agora)).toEqual({
      novos: 2,
      aprendizado: 2,
      maduros: 2,
      vencidos: 2,
      suspensos: 1,
    })
  })

  it('maduro a partir de 21 dias de intervalo', () => {
    const estados = new Map([
      estado('a', revisado(20, amanha)),
      estado('b', revisado(21, amanha)),
    ])
    expect(contarCards([card('a'), card('b')], estados, agora)).toMatchObject({
      aprendizado: 1,
      maduros: 1,
    })
  })

  it('vence até as 23:59 de hoje, não amanhã às 00:00', () => {
    const estados = new Map([
      estado('a', revisado(5, new Date(2026, 9, 23, 23, 59))),
      estado('b', revisado(5, amanha)),
    ])
    expect(contarCards([card('a'), card('b')], estados, agora).vencidos).toBe(1)
  })
})

describe('contagemDoEscopo', () => {
  const baralho = (id: string, ids: string[]) => ({
    id,
    tema: { slug: 'redes', nome: 'Redes' },
    nome: id,
    notas: ids.map((n) => ({
      id: n,
      tipo: 'pergunta-resposta' as const,
      frente: 'F',
      verso: 'V',
    })),
  })
  const temas: Tema[] = [
    {
      slug: 'redes',
      nome: 'Redes',
      baralhos: [baralho('tcp', ['t1', 't2']), baralho('dns', ['d1'])],
    },
  ]

  it('o total do Tema é a soma dos Baralhos', () => {
    const estados = new Map([
      estado('t1', revisado(30, ontem)),
      estado('d1', revisado(5, amanha), true),
    ])
    const tcp = contagemDoEscopo(
      temas,
      { temaSlug: 'redes', baralhoId: 'tcp' },
      estados,
      agora,
    )
    const dns = contagemDoEscopo(
      temas,
      { temaSlug: 'redes', baralhoId: 'dns' },
      estados,
      agora,
    )
    const total = contagemDoEscopo(temas, { temaSlug: 'redes' }, estados, agora)
    expect(total).toEqual({
      novos: tcp.novos + dns.novos,
      aprendizado: tcp.aprendizado + dns.aprendizado,
      maduros: tcp.maduros + dns.maduros,
      vencidos: tcp.vencidos + dns.vencidos,
      suspensos: tcp.suspensos + dns.suspensos,
    })
    expect(total).toEqual({
      novos: 1,
      aprendizado: 0,
      maduros: 1,
      vencidos: 1,
      suspensos: 1,
    })
  })
})

describe('revisoesPorDia', () => {
  it('agrupa por dia local', () => {
    const porDia = revisoesPorDia([
      new Date(2026, 9, 22, 23, 59),
      new Date(2026, 9, 23, 0, 1),
      new Date(2026, 9, 23, 10, 0),
    ])
    expect(porDia).toEqual(
      new Map([
        ['2026-10-22', 1],
        ['2026-10-23', 2],
      ]),
    )
  })
})

describe('sequencia', () => {
  const dias = (...datas: [number, number][]) =>
    revisoesPorDia(datas.map(([m, d]) => new Date(2026, m, d, 12)))

  it('0 sem revisões', () => {
    expect(sequencia(new Map(), agora)).toBe(0)
  })

  it('conta hoje e os dias anteriores seguidos', () => {
    expect(sequencia(dias([9, 23], [9, 22], [9, 21]), agora)).toBe(3)
  })

  it('sem revisão hoje, parte de ontem', () => {
    expect(sequencia(dias([9, 22], [9, 21]), agora)).toBe(2)
  })

  it('um buraco quebra a contagem', () => {
    expect(sequencia(dias([9, 23], [9, 21], [9, 20]), agora)).toBe(1)
  })

  it('atravessa a virada do mês', () => {
    const porDia = dias([10, 1], [9, 31])
    expect(sequencia(porDia, new Date(2026, 10, 1, 9))).toBe(2)
  })
})

describe('semanasDoHeatmap', () => {
  const porDia = revisoesPorDia([
    new Date(2026, 9, 23, 10),
    new Date(2026, 9, 23, 11),
    new Date(2026, 9, 23, 12),
    new Date(2026, 9, 23, 13),
    new Date(2026, 9, 22, 10),
  ])
  const semanas = semanasDoHeatmap(porDia, agora)

  it('53 semanas de domingo a sábado, terminando na semana de hoje', () => {
    expect(semanas).toHaveLength(53)
    for (const semana of semanas) expect(semana).toHaveLength(7)
    expect(semanas[0]![0]!.data.getDay()).toBe(0)
    expect(semanas[0]![0]!.data).toEqual(new Date(2025, 9, 19))
    const ultima = semanas.at(-1)!
    // 23/10/2026 é uma sexta-feira.
    expect(ultima[5]!.data).toEqual(new Date(2026, 9, 23))
    expect(ultima[6]).toBeNull()
  })

  it('níveis: 0 para zero e 4 para o máximo', () => {
    const ultima = semanas.at(-1)!
    expect(ultima[5]).toMatchObject({ total: 4, nivel: 4 })
    expect(ultima[4]).toMatchObject({ total: 1, nivel: 1 })
    expect(ultima[3]).toMatchObject({ total: 0, nivel: 0 })
  })

  it('sem revisões, tudo no nível 0', () => {
    const vazias = semanasDoHeatmap(new Map(), agora).flat()
    expect(vazias.every((dia) => dia === null || dia.nivel === 0)).toBe(true)
  })
})
