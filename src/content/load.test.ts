import { describe, expect, it } from 'vitest'
import { baralhos } from './load.ts'

describe('baralhos', () => {
  it('carrega os Baralhos do conteúdo real', () => {
    expect(baralhos.length).toBeGreaterThan(0)
    for (const b of baralhos) expect(b.notas.length).toBeGreaterThan(0)
  })
})
