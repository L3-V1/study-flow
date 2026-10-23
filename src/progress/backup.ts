import { Rating, State } from 'ts-fsrs'
import { z } from 'zod'
import { db } from './db.ts'

const CHAVE_ULTIMO_BACKUP = 'ultimoBackup'
const DIA_MS = 24 * 60 * 60 * 1000
const DIAS_ATE_ATRASAR = 7

const cardFsrsSchema = z.object({
  due: z.coerce.date(),
  stability: z.number(),
  difficulty: z.number(),
  elapsed_days: z.number(),
  scheduled_days: z.number(),
  learning_steps: z.number(),
  reps: z.number(),
  lapses: z.number(),
  state: z.enum(State),
  last_review: z.coerce.date().optional(),
})

const estadoCardSchema = z.object({
  cardId: z.string(),
  fsrs: cardFsrsSchema,
  suspenso: z.boolean(),
})

const registroRevisaoSchema = z.object({
  id: z.number(),
  cardId: z.string(),
  rating: z.enum(Rating),
  state: z.enum(State),
  due: z.coerce.date(),
  stability: z.number(),
  difficulty: z.number(),
  elapsed_days: z.number(),
  last_elapsed_days: z.number(),
  scheduled_days: z.number(),
  learning_steps: z.number(),
  review: z.coerce.date(),
})

const ajusteSchema = z.object({ chave: z.string(), valor: z.number() })

export const backupSchema = z.object({
  versao: z.literal(1),
  exportadoEm: z.coerce.date(),
  cardStates: z.array(estadoCardSchema),
  reviewLogs: z.array(registroRevisaoSchema),
  settings: z.array(ajusteSchema),
})

export type Backup = z.infer<typeof backupSchema>

// O `ultimoBackup` é gravado antes da leitura, então o arquivo já o contém.
export function exportarBackup(agora: Date): Promise<Backup> {
  return db.transaction(
    'rw',
    db.cardStates,
    db.reviewLogs,
    db.settings,
    async () => {
      await db.settings.put({
        chave: CHAVE_ULTIMO_BACKUP,
        valor: agora.getTime(),
      })
      return {
        versao: 1 as const,
        exportadoEm: agora,
        cardStates: await db.cardStates.toArray(),
        reviewLogs: await db.reviewLogs.toArray(),
        settings: await db.settings.toArray(),
      }
    },
  )
}

export function lerBackup(texto: string): Backup | undefined {
  try {
    const resultado = backupSchema.safeParse(JSON.parse(texto))
    return resultado.success ? resultado.data : undefined
  } catch {
    return undefined
  }
}

// Substitui todo o progresso, mantendo os `id` dos logs.
export function importarBackup(backup: Backup): Promise<void> {
  return db.transaction(
    'rw',
    db.cardStates,
    db.reviewLogs,
    db.settings,
    async () => {
      await Promise.all([
        db.cardStates.clear(),
        db.reviewLogs.clear(),
        db.settings.clear(),
      ])
      await db.cardStates.bulkAdd(backup.cardStates)
      await db.reviewLogs.bulkAdd(backup.reviewLogs)
      await db.settings.bulkAdd(backup.settings)
    },
  )
}

export function nomeDoArquivo(agora: Date): string {
  const dois = (n: number) => String(n).padStart(2, '0')
  const data = `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`
  return `study-flow-backup-${data}.json`
}

// `undefined` se o backup está em dia; `dias` ausente se nunca houve backup.
export async function atrasoDoBackup(
  agora: Date,
): Promise<{ dias?: number } | undefined> {
  const ultimo = await db.settings.get(CHAVE_ULTIMO_BACKUP)
  if (ultimo === undefined) {
    const temProgresso =
      (await db.cardStates.count()) + (await db.reviewLogs.count()) > 0
    return temProgresso ? {} : undefined
  }
  const decorrido = agora.getTime() - ultimo.valor
  if (decorrido <= DIAS_ATE_ATRASAR * DIA_MS) return undefined
  return { dias: Math.floor(decorrido / DIA_MS) }
}

export async function backupAtrasado(agora: Date): Promise<boolean> {
  return (await atrasoDoBackup(agora)) !== undefined
}

export async function baixarBackup(agora: Date): Promise<void> {
  const backup = await exportarBackup(agora)
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeDoArquivo(agora)
  link.click()
  URL.revokeObjectURL(url)
}
