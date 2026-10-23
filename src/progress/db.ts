import { Dexie, type EntityTable } from 'dexie'
import {
  type Card as CardFsrs,
  type Grade,
  type ReviewLog,
  State,
  createEmptyCard,
} from 'ts-fsrs'
import { inicioDoDia } from '../study/dia.ts'
import { proximo } from '../study/scheduler.ts'

// O progresso fica preso ao ID do Card (`notaId` ou `notaId::cN`).
export type EstadoCard = { cardId: string; fsrs: CardFsrs; suspenso: boolean }

// `state` é o estado de antes da Avaliação: New marca um Card novo.
export type RegistroRevisao = ReviewLog & { id: number; cardId: string }

type Ajuste = { chave: string; valor: number }

const LIMITE_NOVOS_PADRAO = 20

export const db = new Dexie('study-flow') as Dexie & {
  cardStates: EntityTable<EstadoCard, 'cardId'>
  reviewLogs: EntityTable<RegistroRevisao, 'id'>
  settings: EntityTable<Ajuste, 'chave'>
}

db.version(1).stores({
  cardStates: 'cardId',
  reviewLogs: '++id, cardId, review',
  settings: 'chave',
})

export async function lerEstados(): Promise<Map<string, EstadoCard>> {
  const estados = await db.cardStates.toArray()
  return new Map(estados.map((e) => [e.cardId, e]))
}

export function avaliar(
  cardId: string,
  rating: Grade,
  agora: Date,
): Promise<CardFsrs> {
  return db.transaction('rw', db.cardStates, db.reviewLogs, async () => {
    const atual = await db.cardStates.get(cardId)
    const { card, log } = proximo(
      atual?.fsrs ?? createEmptyCard(agora),
      agora,
      rating,
    )
    await db.cardStates.put({
      cardId,
      fsrs: card,
      suspenso: atual?.suspenso ?? false,
    })
    await db.reviewLogs.add({ ...log, cardId })
    return card
  })
}

export function suspenderNota(cardIds: string[]): Promise<void> {
  return db.transaction('rw', db.cardStates, async () => {
    const atuais = await db.cardStates.bulkGet(cardIds)
    await db.cardStates.bulkPut(
      cardIds.map((cardId, i) => ({
        cardId,
        fsrs: atuais[i]?.fsrs ?? createEmptyCard(),
        suspenso: true,
      })),
    )
  })
}

export function reativarNota(cardIds: string[]): Promise<void> {
  return db.transaction('rw', db.cardStates, async () => {
    const atuais = await db.cardStates.bulkGet(cardIds)
    await db.cardStates.bulkPut(
      atuais.flatMap((e) =>
        e === undefined ? [] : [{ ...e, suspenso: false }],
      ),
    )
  })
}

// Cards distintos que receberam a primeira Avaliação desde a meia-noite.
export async function novosHoje(agora: Date): Promise<number> {
  const logs = await db.reviewLogs
    .where('review')
    .aboveOrEqual(inicioDoDia(agora))
    .toArray()
  return new Set(logs.filter((l) => l.state === State.New).map((l) => l.cardId))
    .size
}

export async function lerLimiteNovos(): Promise<number> {
  const ajuste = await db.settings.get('limiteNovosPorDia')
  return ajuste?.valor ?? LIMITE_NOVOS_PADRAO
}
