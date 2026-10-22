import { describe, expect, it } from 'vitest'
import { baralhos } from './load.ts'

describe('baralhos', () => {
  it('carrega o Baralho de exemplo do conteúdo real', () => {
    const exemplo = baralhos.find((b) => b.id === 'complexidade-de-algoritmos')
    expect(exemplo?.tema.slug).toBe('computacao')
    expect(exemplo?.notas.length).toBeGreaterThan(0)
  })
})
