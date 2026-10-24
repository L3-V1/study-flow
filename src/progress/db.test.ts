import { Rating, State } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import {
  apagarDados,
  avaliar,
  db,
  gravarLimiteNovos,
  lerLimiteNovos,
  limparOrfaos,
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

describe('apagarDados', () => {
  async function popular() {
    await avaliar('n1', Rating.Good, agora)
    await gravarLimiteNovos(5)
    await db.settings.put({ chave: 'ultimoBackup', valor: agora.getTime() })
  }

  it('só progresso apaga estados e logs e mantém os ajustes', async () => {
    await popular()
    await apagarDados({ progresso: true, ajustes: false })
    expect(await db.cardStates.count()).toBe(0)
    expect(await db.reviewLogs.count()).toBe(0)
    expect(await lerLimiteNovos()).toBe(5)
  })

  it('só ajustes volta o limite a 20 e mantém o progresso', async () => {
    await popular()
    await apagarDados({ progresso: false, ajustes: true })
    expect(await lerLimiteNovos()).toBe(20)
    expect(await db.cardStates.count()).toBe(1)
    expect(await db.reviewLogs.count()).toBe(1)
  })

  it('ambos apagam tudo, menos o ultimoBackup', async () => {
    await popular()
    await apagarDados({ progresso: true, ajustes: true })
    expect(await db.cardStates.count()).toBe(0)
    expect(await db.reviewLogs.count()).toBe(0)
    expect(await lerLimiteNovos()).toBe(20)
    expect(await db.settings.get('ultimoBackup')).toEqual({
      chave: 'ultimoBackup',
      valor: agora.getTime(),
    })
  })
})

describe('limparOrfaos', () => {
  it('apaga estados e logs dos órfãos e conta Cards distintos', async () => {
    await avaliar('fica', Rating.Good, agora)
    await avaliar('sai', Rating.Good, agora)
    await avaliar('sai', Rating.Good, new Date(agora.getTime() + 6e4))
    await avaliar('lac::c1', Rating.Good, agora)
    await avaliar('lac::c2', Rating.Good, agora)
    await suspenderNota(['suspensa'])
    // Log sem estado também é órfão.
    await db.cardStates.delete('lac::c2')

    expect(await limparOrfaos(new Set(['fica', 'lac::c1']))).toBe(3)
    expect((await db.cardStates.toArray()).map((e) => e.cardId).sort()).toEqual(
      ['fica', 'lac::c1'],
    )
    expect(
      [...new Set((await db.reviewLogs.toArray()).map((l) => l.cardId))].sort(),
    ).toEqual(['fica', 'lac::c1'])
  })

  it('sem órfãos não apaga nada e retorna 0', async () => {
    await avaliar('fica', Rating.Good, agora)
    expect(await limparOrfaos(new Set(['fica']))).toBe(0)
    expect(await db.cardStates.count()).toBe(1)
    expect(await db.reviewLogs.count()).toBe(1)
  })
})
