import { describe, expect, it } from 'vitest'
import { type ArquivoDeConteudo, validarConteudo } from './validate.ts'

function baralho(id: string, notas: unknown[], tema = 'redes', nome = 'Redes') {
  return { id, tema: { slug: tema, nome }, nome: id, notas }
}

function nota(id: string, texto = 'O {{c1::TCP}} garante entrega.') {
  return { id, tipo: 'lacuna', texto }
}

const valido: ArquivoDeConteudo = {
  caminho: 'redes/tcp-ip.json',
  dados: baralho('tcp-ip', [
    nota('tcp-ip-aaaaaaaa'),
    {
      id: 'tcp-ip-bbbbbbbb',
      tipo: 'pergunta-resposta',
      frente: 'Frente',
      verso: 'Verso',
    },
  ]),
}

describe('validarConteudo', () => {
  it('aceita conteúdo válido', () => {
    expect(validarConteudo([valido])).toEqual([])
  })

  it('aceita o conteúdo real do repositório', () => {
    const arquivos = import.meta.glob('/content/**/*.json', {
      eager: true,
      import: 'default',
    })
    const conteudo = Object.entries(arquivos).map(([caminho, dados]) => ({
      caminho: caminho.slice('/content/'.length),
      dados,
    }))
    expect(conteudo.length).toBeGreaterThan(0)
    expect(validarConteudo(conteudo)).toEqual([])
  })

  it('aponta ID de Nota duplicado entre arquivos', () => {
    const erros = validarConteudo([
      valido,
      {
        caminho: 'redes/udp.json',
        dados: baralho('udp', [nota('tcp-ip-aaaaaaaa')]),
      },
    ])
    expect(erros).toEqual([
      'redes/udp.json [tcp-ip-aaaaaaaa]: ID de Nota duplicado (também em redes/tcp-ip.json)',
    ])
  })

  it('aponta Nota de lacuna sem Lacuna', () => {
    const erros = validarConteudo([
      {
        caminho: 'redes/udp.json',
        dados: baralho('udp', [nota('udp-aaaaaaaa', 'sem lacuna')]),
      },
    ])
    expect(erros).toEqual([
      'redes/udp.json [udp-aaaaaaaa]: Nota de lacuna sem nenhuma Lacuna {{cN::...}}',
    ])
  })

  it('aponta Lacuna malformada e número zero', () => {
    const erros = validarConteudo([
      {
        caminho: 'redes/udp.json',
        dados: baralho('udp', [
          nota('udp-aaaaaaaa', '{{c1::ok}} e {{c2:x}}'),
          nota('udp-bbbbbbbb', '{{c0::zero}}'),
        ]),
      },
    ])
    expect(erros).toEqual([
      'redes/udp.json [udp-aaaaaaaa]: Lacuna malformada (use {{cN::trecho}})',
      'redes/udp.json [udp-bbbbbbbb]: número de Lacuna deve ser 1 ou maior',
    ])
  })

  it('aponta tema.slug diferente da pasta', () => {
    const erros = validarConteudo([
      { caminho: 'computacao/tcp-ip.json', dados: valido.dados },
    ])
    expect(erros).toEqual([
      'computacao/tcp-ip.json: tema.slug "redes" difere da pasta "computacao"',
    ])
  })

  it('aponta id diferente do nome do arquivo', () => {
    const erros = validarConteudo([
      { caminho: 'redes/udp.json', dados: valido.dados },
    ])
    expect(erros).toEqual([
      'redes/udp.json: id "tcp-ip" difere do nome do arquivo "udp"',
    ])
  })

  it('aponta caminho com profundidade errada', () => {
    for (const caminho of ['tcp-ip.json', 'redes/sub/tcp-ip.json']) {
      expect(validarConteudo([{ caminho, dados: valido.dados }])).toEqual([
        `${caminho}: o arquivo deve ficar em <tema>/<baralho>.json`,
      ])
    }
  })

  it('aponta tema.nome divergente no mesmo Tema', () => {
    const erros = validarConteudo([
      valido,
      {
        caminho: 'redes/udp.json',
        dados: baralho('udp', [nota('udp-aaaaaaaa')], 'redes', 'Redes de PC'),
      },
    ])
    expect(erros).toEqual([
      'redes/udp.json: tema.nome "Redes de PC" difere de "Redes" em redes/tcp-ip.json',
    ])
  })

  it('aponta JSON fora do schema com o campo e o ID da Nota', () => {
    const erros = validarConteudo([
      {
        caminho: 'redes/udp.json',
        dados: baralho('udp', [{ ...nota('udp-aaaaaaaa'), dica: 'x' }]),
      },
    ])
    expect(erros).toHaveLength(1)
    expect(erros[0]).toMatch(/^redes\/udp\.json \[udp-aaaaaaaa\]: notas\.0: /)
    expect(erros[0]).toContain('dica')
  })
})
