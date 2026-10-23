import { Rating } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import {
  backupAtrasado,
  exportarBackup,
  importarBackup,
  lerBackup,
  nomeDoArquivo,
} from './backup.ts'
import { avaliar, db, gravarLimiteNovos, suspenderNota } from './db.ts'

const agora = new Date(2026, 9, 23, 10, 0)
const DIA_MS = 24 * 60 * 60 * 1000

async function tabelas() {
  return {
    cardStates: await db.cardStates.toArray(),
    reviewLogs: await db.reviewLogs.toArray(),
    settings: await db.settings.toArray(),
  }
}

describe('backup', () => {
  it('ida e volta pelo JSON devolve as três tabelas iguais', async () => {
    await avaliar('a', Rating.Good, agora)
    await avaliar('a', Rating.Again, new Date(agora.getTime() + 6e4))
    await avaliar('b', Rating.Easy, agora)
    await suspenderNota(['b', 'c::c1'])
    await gravarLimiteNovos(5)

    const backup = await exportarBackup(agora)
    const antes = await tabelas()
    const lido = lerBackup(JSON.stringify(backup))
    expect(lido).toBeDefined()

    await Promise.all(db.tables.map((t) => t.clear()))
    await importarBackup(lido!)

    const depois = await tabelas()
    expect(depois).toEqual(antes)
    expect(depois.reviewLogs.map((l) => l.id)).toEqual(
      antes.reviewLogs.map((l) => l.id),
    )
    expect(depois.reviewLogs[0]!.review).toBeInstanceOf(Date)
    expect(depois.cardStates[0]!.fsrs.due).toBeInstanceOf(Date)
  })

  it('importar substitui o progresso atual', async () => {
    await avaliar('a', Rating.Good, agora)
    const backup = await exportarBackup(agora)
    await avaliar('so-antes', Rating.Good, agora)
    await importarBackup(backup)
    expect(await db.cardStates.get('so-antes')).toBeUndefined()
    expect(await db.cardStates.get('a')).toBeDefined()
  })

  it('lerBackup rejeita JSON quebrado, outra versão e estado sem fsrs', async () => {
    await avaliar('a', Rating.Good, agora)
    const valido = JSON.parse(JSON.stringify(await exportarBackup(agora)))
    expect(lerBackup(JSON.stringify(valido))).toBeDefined()
    expect(lerBackup('{ quebrado')).toBeUndefined()
    expect(lerBackup(JSON.stringify({ ...valido, versao: 2 }))).toBeUndefined()
    const semFsrs = {
      ...valido,
      cardStates: [{ cardId: 'a', suspenso: false }],
    }
    expect(lerBackup(JSON.stringify(semFsrs))).toBeUndefined()
  })

  it('exportar grava o último backup, que vai junto no arquivo', async () => {
    const backup = await exportarBackup(agora)
    const ultimo = { chave: 'ultimoBackup', valor: agora.getTime() }
    expect(await db.settings.get('ultimoBackup')).toEqual(ultimo)
    expect(backup.settings).toContainEqual(ultimo)
  })

  it('nomeDoArquivo usa a data local', () => {
    expect(nomeDoArquivo(new Date(2026, 0, 5, 23, 59))).toBe(
      'study-flow-backup-2026-01-05.json',
    )
  })

  it('backupAtrasado', async () => {
    expect(await backupAtrasado(agora)).toBe(false)
    await avaliar('a', Rating.Good, agora)
    expect(await backupAtrasado(agora)).toBe(true)
    await exportarBackup(agora)
    const seteDias = new Date(agora.getTime() + 7 * DIA_MS)
    expect(await backupAtrasado(seteDias)).toBe(false)
    expect(await backupAtrasado(new Date(seteDias.getTime() + 6e4))).toBe(true)
  })
})
