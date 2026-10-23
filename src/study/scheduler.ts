import { type Card as CardFsrs, type Grade, Rating, fsrs } from 'ts-fsrs'

// Parâmetros padrão: retenção 0,9, fuzz e passos curtos ligados.
const f = fsrs()

export const avaliacoes: Grade[] = [
  Rating.Again,
  Rating.Hard,
  Rating.Good,
  Rating.Easy,
]

export function proximo(card: CardFsrs, agora: Date, rating: Grade) {
  return f.next(card, agora, rating)
}

// O `due` que cada Avaliação daria ao Card agora.
export function previsoes(card: CardFsrs, agora: Date): Record<Grade, Date> {
  const log = f.repeat(card, agora)
  return {
    [Rating.Again]: log[Rating.Again].card.due,
    [Rating.Hard]: log[Rating.Hard].card.due,
    [Rating.Good]: log[Rating.Good].card.due,
    [Rating.Easy]: log[Rating.Easy].card.due,
  }
}

export function formatarIntervalo(de: Date, ate: Date): string {
  const minutos = Math.max(1, Math.round((ate.getTime() - de.getTime()) / 6e4))
  if (minutos < 60) return `${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `${horas} h`
  const dias = Math.round(horas / 24)
  if (dias < 30) return `${dias} d`
  const meses = Math.round(dias / 30)
  if (meses < 12) return meses === 1 ? '1 mês' : `${meses} meses`
  const anos = Math.round((dias / 365) * 10) / 10
  return `${anos.toLocaleString('pt-BR')} ${anos < 2 ? 'ano' : 'anos'}`
}
