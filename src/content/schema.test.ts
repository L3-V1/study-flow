import { describe, expect, it } from 'vitest'
import { baralhoSchema, notaSchema } from './schema.ts'

const perguntaResposta = {
  id: 'tcp-ip-k3j9x2ab',
  tipo: 'pergunta-resposta',
  frente: 'Quantas camadas tem o modelo TCP/IP?',
  verso: 'Quatro.',
}

const lacuna = {
  id: 'tcp-ip-p0q1r2s3',
  tipo: 'lacuna',
  texto: 'O {{c1::TCP}} garante entrega ordenada.',
  extra: 'O UDP não garante.',
}

const baralho = {
  id: 'tcp-ip',
  tema: { slug: 'redes', nome: 'Redes' },
  nome: 'TCP/IP',
  notas: [perguntaResposta, lacuna],
}

describe('notaSchema', () => {
  it('aceita Nota de pergunta e resposta e Nota de lacuna', () => {
    expect(notaSchema.safeParse(perguntaResposta).success).toBe(true)
    expect(notaSchema.safeParse(lacuna).success).toBe(true)
  })

  it('rejeita tipo desconhecido', () => {
    expect(notaSchema.safeParse({ ...lacuna, tipo: 'basica' }).success).toBe(
      false,
    )
  })

  it('rejeita campo extra', () => {
    expect(
      notaSchema.safeParse({ ...perguntaResposta, dica: 'x' }).success,
    ).toBe(false)
  })

  it('rejeita texto vazio', () => {
    expect(
      notaSchema.safeParse({ ...perguntaResposta, verso: '' }).success,
    ).toBe(false)
  })

  it('rejeita ID fora do formato', () => {
    for (const id of ['tcp-ip', 'tcp-ip-abc', 'TCP-IP-k3j9x2ab', 'k3j9x2ab']) {
      expect(notaSchema.safeParse({ ...lacuna, id }).success).toBe(false)
    }
  })
})

describe('baralhoSchema', () => {
  it('aceita um Baralho válido', () => {
    expect(baralhoSchema.safeParse(baralho).success).toBe(true)
  })

  it('rejeita Baralho sem Notas', () => {
    expect(baralhoSchema.safeParse({ ...baralho, notas: [] }).success).toBe(
      false,
    )
  })

  it('rejeita campo extra no Baralho e no Tema', () => {
    expect(baralhoSchema.safeParse({ ...baralho, autor: 'x' }).success).toBe(
      false,
    )
    expect(
      baralhoSchema.safeParse({
        ...baralho,
        tema: { ...baralho.tema, cor: 'azul' },
      }).success,
    ).toBe(false)
  })
})
