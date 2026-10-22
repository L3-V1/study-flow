import { describe, expect, it } from 'vitest'
import { gerarIdsDeNota } from './ids.ts'
import { idNotaSchema } from './schema.ts'

describe('gerarIdsDeNota', () => {
  it('gera a quantidade pedida no formato do idNotaSchema', () => {
    const ids = gerarIdsDeNota('tcp-ip', 50, new Set())
    expect(ids).toHaveLength(50)
    for (const id of ids) {
      expect(id.startsWith('tcp-ip-')).toBe(true)
      expect(idNotaSchema.safeParse(id).success).toBe(true)
    }
  })

  it('não repete IDs no lote', () => {
    const ids = gerarIdsDeNota('tcp-ip', 500, new Set())
    expect(new Set(ids).size).toBe(500)
  })

  it('não colide com os IDs existentes', () => {
    const existentes = new Set(gerarIdsDeNota('tcp-ip', 200, new Set()))
    const ids = gerarIdsDeNota('tcp-ip', 200, existentes)
    expect(ids.some((id) => existentes.has(id))).toBe(false)
  })
})
