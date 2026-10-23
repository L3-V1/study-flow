import { describe, expect, it } from 'vitest'
import {
  numerosDasLacunas,
  renderizarLacuna,
  revelarLacunas,
  temLacunaMalformada,
} from './cloze.ts'

describe('numerosDasLacunas', () => {
  it('retorna os números distintos e ordenados', () => {
    expect(numerosDasLacunas('{{c3::a}} {{c1::b}} {{c3::c}}')).toEqual([1, 3])
  })

  it('retorna vazio sem Lacunas', () => {
    expect(numerosDasLacunas('sem lacunas')).toEqual([])
  })
})

describe('renderizarLacuna', () => {
  const texto = 'O {{c1::TCP}} usa o {{c2::handshake de três vias::processo}}.'

  it('oculta só a Lacuna ativa e mostra as demais', () => {
    expect(renderizarLacuna(texto, 1, false)).toBe(
      'O **[...]** usa o handshake de três vias.',
    )
  })

  it('mostra a dica no lugar de [...]', () => {
    expect(renderizarLacuna(texto, 2, false)).toBe(
      'O TCP usa o **[processo]**.',
    )
  })

  it('revela a Lacuna ativa em negrito', () => {
    expect(renderizarLacuna(texto, 2, true)).toBe(
      'O TCP usa o **handshake de três vias**.',
    )
  })

  it('oculta juntos os trechos do mesmo número', () => {
    const repetido = '{{c1::a}} e {{c2::b}} e {{c1::c}}'
    expect(renderizarLacuna(repetido, 1, false)).toBe(
      '**[...]** e b e **[...]**',
    )
    expect(renderizarLacuna(repetido, 1, true)).toBe('**a** e b e **c**')
  })
})

describe('revelarLacunas', () => {
  it('revela todas as Lacunas em negrito, ignorando a dica', () => {
    expect(
      revelarLacunas('O {{c1::TCP}} usa o {{c2::handshake::processo}}.'),
    ).toBe('O **TCP** usa o **handshake**.')
  })
})

describe('temLacunaMalformada', () => {
  it('detecta Lacuna malformada', () => {
    expect(temLacunaMalformada('{{c1::ok}} e {{c2:x}}')).toBe(true)
    expect(temLacunaMalformada('{{c1::}}')).toBe(true)
  })

  it('aceita Lacunas válidas', () => {
    expect(temLacunaMalformada('{{c1::a}} e {{c2::b::dica}}')).toBe(false)
  })
})
