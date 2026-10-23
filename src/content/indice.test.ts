import { describe, expect, it } from 'vitest'
import { agruparPorTema } from './indice.ts'
import type { Baralho } from './schema.ts'

function baralho(id: string, nome: string, tema: string, temaNome: string) {
  return {
    id,
    tema: { slug: tema, nome: temaNome },
    nome,
    notas: [{ id: `${id}-aaaaaaaa`, tipo: 'lacuna', texto: '{{c1::a}}' }],
  } satisfies Baralho
}

describe('agruparPorTema', () => {
  it('agrupa os Baralhos por Tema, em ordem alfabética do nome', () => {
    const udp = baralho('udp', 'UDP', 'redes', 'Redes')
    const tcp = baralho('tcp-ip', 'TCP/IP', 'redes', 'Redes')
    const algebra = baralho('algebra', 'Álgebra', 'matematica', 'Matemática')
    const calculo = baralho('calculo', 'Cálculo', 'matematica', 'Matemática')

    const temas = agruparPorTema([udp, calculo, tcp, algebra])

    expect(temas).toEqual([
      { slug: 'matematica', nome: 'Matemática', baralhos: [algebra, calculo] },
      { slug: 'redes', nome: 'Redes', baralhos: [tcp, udp] },
    ])
  })

  it('retorna vazio sem Baralhos', () => {
    expect(agruparPorTema([])).toEqual([])
  })
})
