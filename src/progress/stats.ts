import { State } from 'ts-fsrs'
import type { Card } from '../content/cards.ts'
import type { Tema } from '../content/indice.ts'
import { fimDoDia, inicioDoDia } from '../study/dia.ts'
import { type Escopo, cardsDoEscopo } from '../study/session.ts'
import type { EstadoCard } from './db.ts'

// `vencidos` é um subconjunto de `aprendizado` + `maduros`; as outras somam o total.
export type Contagem = {
  novos: number
  aprendizado: number
  maduros: number
  vencidos: number
  suspensos: number
}

export type Dia = { data: Date; total: number; nivel: 0 | 1 | 2 | 3 | 4 }

const DIAS_PARA_MADURO = 21
const SEMANAS_DO_HEATMAP = 53

// A iteração parte dos Cards do conteúdo, então estados órfãos não contam.
export function contarCards(
  cards: Card[],
  estados: Map<string, EstadoCard>,
  agora: Date,
): Contagem {
  const fim = fimDoDia(agora)
  const contagem = {
    novos: 0,
    aprendizado: 0,
    maduros: 0,
    vencidos: 0,
    suspensos: 0,
  }
  for (const card of cards) {
    const estado = estados.get(card.id)
    if (estado?.suspenso) {
      contagem.suspensos++
      continue
    }
    if (estado === undefined || estado.fsrs.state === State.New) {
      contagem.novos++
      continue
    }
    if (estado.fsrs.scheduled_days >= DIAS_PARA_MADURO) contagem.maduros++
    else contagem.aprendizado++
    if (estado.fsrs.due < fim) contagem.vencidos++
  }
  return contagem
}

export function contagemDoEscopo(
  temas: Tema[],
  escopo: Escopo,
  estados: Map<string, EstadoCard>,
  agora: Date,
): Contagem {
  return contarCards(cardsDoEscopo(temas, escopo), estados, agora)
}

// Data local, não UTC.
export function chaveDoDia(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

export function revisoesPorDia(datas: Date[]): Map<string, number> {
  const porDia = new Map<string, number>()
  for (const data of datas) {
    const chave = chaveDoDia(data)
    porDia.set(chave, (porDia.get(chave) ?? 0) + 1)
  }
  return porDia
}

// Sem revisão hoje, a contagem parte de ontem: o dia ainda não acabou.
export function sequencia(porDia: Map<string, number>, agora: Date): number {
  const dia = inicioDoDia(agora)
  if (!porDia.has(chaveDoDia(dia))) dia.setDate(dia.getDate() - 1)
  let dias = 0
  while (porDia.has(chaveDoDia(dia))) {
    dias++
    dia.setDate(dia.getDate() - 1)
  }
  return dias
}

// Colunas de domingo a sábado, terminando na semana de hoje; dias futuros são `null`.
export function semanasDoHeatmap(
  porDia: Map<string, number>,
  agora: Date,
): (Dia | null)[][] {
  const hoje = inicioDoDia(agora)
  const inicio = new Date(hoje)
  inicio.setDate(hoje.getDate() - hoje.getDay() - 7 * (SEMANAS_DO_HEATMAP - 1))

  const semanas: (Omit<Dia, 'nivel'> | null)[][] = []
  for (let s = 0; s < SEMANAS_DO_HEATMAP; s++) {
    const semana: (Omit<Dia, 'nivel'> | null)[] = []
    for (let d = 0; d < 7; d++) {
      const data = new Date(inicio)
      data.setDate(inicio.getDate() + 7 * s + d)
      semana.push(
        data > hoje ? null : { data, total: porDia.get(chaveDoDia(data)) ?? 0 },
      )
    }
    semanas.push(semana)
  }

  const maximo = Math.max(0, ...semanas.flat().map((dia) => dia?.total ?? 0))
  return semanas.map((semana) =>
    semana.map((dia) =>
      dia === null
        ? null
        : {
            ...dia,
            nivel: (dia.total === 0
              ? 0
              : Math.ceil((4 * dia.total) / maximo)) as Dia['nivel'],
          },
    ),
  )
}
