import { describe, expect, it } from 'vitest'
import { derivarCards } from './cards.ts'

describe('derivarCards', () => {
  it('gera um Card com o ID da Nota para pergunta e resposta', () => {
    expect(
      derivarCards({
        id: 'tcp-ip-k3j9x2ab',
        tipo: 'pergunta-resposta',
        frente: 'Frente',
        verso: 'Verso',
        extra: 'Extra',
      }),
    ).toEqual([
      {
        id: 'tcp-ip-k3j9x2ab',
        notaId: 'tcp-ip-k3j9x2ab',
        frente: 'Frente',
        verso: 'Verso',
        extra: 'Extra',
      },
    ])
  })

  it('gera um Card por número de Lacuna, com ID notaId::cN', () => {
    const cards = derivarCards({
      id: 'tcp-ip-p0q1r2s3',
      tipo: 'lacuna',
      texto: '{{c1::a}}, {{c3::b}} e {{c1::c}}',
    })
    expect(cards).toEqual([
      {
        id: 'tcp-ip-p0q1r2s3::c1',
        notaId: 'tcp-ip-p0q1r2s3',
        frente: '**[...]**, b e **[...]**',
        verso: '**a**, b e **c**',
      },
      {
        id: 'tcp-ip-p0q1r2s3::c3',
        notaId: 'tcp-ip-p0q1r2s3',
        frente: 'a, **[...]** e c',
        verso: 'a, **b** e c',
      },
    ])
  })
})
