import { Rating, createEmptyCard } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import { formatarIntervalo, previsoes, proximo } from './scheduler.ts'

const agora = new Date(2026, 9, 23, 10, 0)
const depois = (ms: number) => new Date(agora.getTime() + ms)
const MIN = 6e4
const H = 60 * MIN
const D = 24 * H

describe('formatarIntervalo', () => {
  it.each([
    [0, '1 min'],
    [MIN, '1 min'],
    [10 * MIN, '10 min'],
    [3 * H, '3 h'],
    [4 * D, '4 d'],
    [30 * D, '1 mês'],
    [60 * D, '2 meses'],
    [350 * D, '12 meses'],
    [365 * D, '1 ano'],
    [438 * D, '1,2 ano'],
    [800 * D, '2,2 anos'],
  ])('%i ms vira "%s"', (ms, texto) => {
    expect(formatarIntervalo(agora, depois(ms))).toBe(texto)
  })
})

describe('agendamento', () => {
  it('Card novo: Errei volta antes de Bom, que volta antes de Fácil', () => {
    const p = previsoes(createEmptyCard(agora), agora)
    expect(p[Rating.Again].getTime()).toBeLessThan(p[Rating.Good].getTime())
    expect(p[Rating.Good].getTime()).toBeLessThan(p[Rating.Easy].getTime())
  })

  it('proximo devolve o novo estado e o log com o estado anterior', () => {
    const { card, log } = proximo(createEmptyCard(agora), agora, Rating.Good)
    expect(card.reps).toBe(1)
    expect(log.state).toBe(0)
    expect(log.review).toEqual(agora)
  })
})
