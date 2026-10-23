import { type Card as CardFsrs, State } from 'ts-fsrs'
import { type Card, derivarCards } from '../content/cards.ts'
import type { Tema } from '../content/indice.ts'
import type { EstadoCard } from '../progress/db.ts'
import { fimDoDia } from './dia.ts'

// Sem nada: todos os Temas. Só `temaSlug`: um Tema. Os dois: um Baralho.
export type Escopo = { temaSlug?: string; baralhoId?: string }

export function cardsDoEscopo(temas: Tema[], escopo: Escopo): Card[] {
  return temas
    .filter((t) => escopo.temaSlug === undefined || t.slug === escopo.temaSlug)
    .flatMap((t) => t.baralhos)
    .filter((b) => escopo.baralhoId === undefined || b.id === escopo.baralhoId)
    .flatMap((b) => b.notas.flatMap(derivarCards))
}

// A iteração parte dos Cards do conteúdo, então estados órfãos não contam.
export function montarSessao({
  cards,
  estados,
  novosHoje,
  limite,
  agora,
}: {
  cards: Card[]
  estados: Map<string, EstadoCard>
  novosHoje: number
  limite: number
  agora: Date
}): { vencidos: Card[]; novos: Card[] } {
  const fim = fimDoDia(agora)
  const vencidos: { card: Card; due: Date }[] = []
  const novos: Card[] = []
  for (const card of cards) {
    const estado = estados.get(card.id)
    if (estado?.suspenso) continue
    if (estado === undefined || estado.fsrs.state === State.New) {
      novos.push(card)
    } else if (estado.fsrs.due < fim) {
      vencidos.push({ card, due: estado.fsrs.due })
    }
  }
  vencidos.sort((a, b) => a.due.getTime() - b.due.getTime())
  return {
    vencidos: vencidos.map((v) => v.card),
    novos: novos.slice(0, Math.max(0, limite - novosHoje)),
  }
}

// Se o Card ainda vence hoje (Errei, passos de aprendizado), volta no fim.
export function aposAvaliar(
  fila: Card[],
  card: Card,
  novoEstado: CardFsrs,
  agora: Date,
): Card[] {
  const resto = fila.filter((c) => c.id !== card.id)
  return novoEstado.due < fimDoDia(agora) ? [...resto, card] : resto
}
