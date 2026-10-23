import { Rating, State } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import {
  avaliar,
  db,
  lerLimiteNovos,
  novosHoje,
  reativarNota,
  suspenderNota,
} from './db.ts'

const agora = new Date(2026, 9, 23, 10, 0)

describe('progresso', () => {
  it('avaliar grava o estado e um log com o estado anterior', async () => {
    const card = await avaliar('n1', Rating.Good, agora)
    expect(card.state).not.toBe(State.New)
    expect(await db.cardStates.get('n1')).toMatchObject({
      cardId: 'n1',
      suspenso: false,
      fsrs: { reps: 1 },
    })
    const logs = await db.reviewLogs.toArray()
    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({ cardId: 'n1', state: State.New })
  })

  it('suspender um Card novo grava um estado New suspenso', async () => {
    await suspenderNota(['n1::c1', 'n1::c2'])
    const estados = await db.cardStates.toArray()
    expect(estados).toHaveLength(2)
    for (const e of estados) {
      expect(e.suspenso).toBe(true)
      expect(e.fsrs.state).toBe(State.New)
    }
  })

  it('suspender e reativar mantém o progresso', async () => {
    await avaliar('n1', Rating.Good, agora)
    await suspenderNota(['n1'])
    expect((await db.cardStates.get('n1'))?.fsrs.reps).toBe(1)
    await reativarNota(['n1'])
    expect(await db.cardStates.get('n1')).toMatchObject({
      suspenso: false,
      fsrs: { reps: 1 },
    })
  })

  it('reativar não cria estado para Card sem progresso', async () => {
    await reativarNota(['nada'])
    expect(await db.cardStates.count()).toBe(0)
  })

  it('novosHoje conta Cards distintos introduzidos desde a meia-noite', async () => {
    await avaliar('ontem', Rating.Good, new Date(2026, 9, 22, 23, 0))
    await avaliar('a', Rating.Again, agora)
    await avaliar('a', Rating.Good, new Date(agora.getTime() + 6e4))
    await avaliar('b', Rating.Easy, agora)
    expect(await novosHoje(agora)).toBe(2)
  })

  it('limite de novos: 20 por padrão, ou o valor gravado', async () => {
    expect(await lerLimiteNovos()).toBe(20)
    await db.settings.put({ chave: 'limiteNovosPorDia', valor: 5 })
    expect(await lerLimiteNovos()).toBe(5)
  })
})
