import { numerosDasLacunas, temLacunaMalformada } from './cloze.ts'
import { baralhoSchema } from './schema.ts'

// Validação pura de todo o conteúdo, sem acesso a disco: usada pelo script
// `validate` e pelos testes. `caminho` é relativo a `content/`
// (ex.: `redes/tcp-ip.json`).
export type ArquivoDeConteudo = { caminho: string; dados: unknown }

export function validarConteudo(arquivos: ArquivoDeConteudo[]): string[] {
  const erros: string[] = []
  const arquivoDaNota = new Map<string, string>()
  const nomeDoTema = new Map<string, { nome: string; caminho: string }>()

  for (const { caminho, dados } of arquivos) {
    const erro = (mensagem: string, notaId?: string) =>
      erros.push(
        notaId === undefined
          ? `${caminho}: ${mensagem}`
          : `${caminho} [${notaId}]: ${mensagem}`,
      )

    const partes = caminho.split('/')
    const caminhoValido = partes.length === 2 && partes[1]!.endsWith('.json')
    if (!caminhoValido) {
      erro('o arquivo deve ficar em <tema>/<baralho>.json')
    }

    const resultado = baralhoSchema.safeParse(dados)
    if (!resultado.success) {
      for (const issue of resultado.error.issues) {
        const campo = issue.path.join('.') || '(raiz)'
        erro(`${campo}: ${issue.message}`, idDaNotaNoPath(dados, issue.path))
      }
      continue
    }
    const baralho = resultado.data

    if (caminhoValido) {
      const [pasta, arquivo] = partes as [string, string]
      if (baralho.tema.slug !== pasta) {
        erro(`tema.slug "${baralho.tema.slug}" difere da pasta "${pasta}"`)
      }
      const nomeDoArquivo = arquivo.slice(0, -'.json'.length)
      if (baralho.id !== nomeDoArquivo) {
        erro(`id "${baralho.id}" difere do nome do arquivo "${nomeDoArquivo}"`)
      }
    }

    const tema = nomeDoTema.get(baralho.tema.slug)
    if (tema === undefined) {
      nomeDoTema.set(baralho.tema.slug, { nome: baralho.tema.nome, caminho })
    } else if (tema.nome !== baralho.tema.nome) {
      erro(
        `tema.nome "${baralho.tema.nome}" difere de "${tema.nome}" em ${tema.caminho}`,
      )
    }

    for (const nota of baralho.notas) {
      const outro = arquivoDaNota.get(nota.id)
      if (outro === undefined) {
        arquivoDaNota.set(nota.id, caminho)
      } else {
        erro(`ID de Nota duplicado (também em ${outro})`, nota.id)
      }

      if (nota.tipo === 'lacuna') {
        const numeros = numerosDasLacunas(nota.texto)
        if (numeros.length === 0) {
          erro('Nota de lacuna sem nenhuma Lacuna {{cN::...}}', nota.id)
        }
        if (numeros.some((n) => n < 1)) {
          erro('número de Lacuna deve ser 1 ou maior', nota.id)
        }
        if (temLacunaMalformada(nota.texto)) {
          erro('Lacuna malformada (use {{cN::trecho}})', nota.id)
        }
      }
    }
  }

  return erros
}

// Para erros do schema dentro de `notas.<i>`, recupera o ID da Nota, se houver.
function idDaNotaNoPath(
  dados: unknown,
  path: readonly PropertyKey[],
): string | undefined {
  if (path[0] !== 'notas' || typeof path[1] !== 'number') return undefined
  const notas = (dados as { notas?: unknown }).notas
  if (!Array.isArray(notas)) return undefined
  const id = (notas[path[1]] as { id?: unknown } | undefined)?.id
  return typeof id === 'string' ? id : undefined
}
