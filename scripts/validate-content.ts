import { readdirSync, readFileSync } from 'node:fs'
import { join, sep } from 'node:path'
import { derivarCards } from '../src/content/cards.ts'
import { baralhoSchema } from '../src/content/schema.ts'
import {
  type ArquivoDeConteudo,
  validarConteudo,
} from '../src/content/validate.ts'

const raiz = join(import.meta.dirname, '..', 'content')

const caminhos = readdirSync(raiz, { recursive: true, encoding: 'utf8' })
  .map((caminho) => caminho.split(sep).join('/'))
  .filter((caminho) => caminho.endsWith('.json'))
  .sort()

const erros: string[] = []
const arquivos: ArquivoDeConteudo[] = []
for (const caminho of caminhos) {
  try {
    const dados: unknown = JSON.parse(readFileSync(join(raiz, caminho), 'utf8'))
    arquivos.push({ caminho, dados })
  } catch (e) {
    erros.push(`${caminho}: JSON inválido (${(e as Error).message})`)
  }
}
erros.push(...validarConteudo(arquivos))

if (erros.length > 0) {
  for (const erro of erros) console.error(erro)
  console.error(`\n${erros.length} erro(s) no conteúdo`)
  process.exit(1)
}

const baralhos = arquivos.map(({ dados }) => baralhoSchema.parse(dados))
const notas = baralhos.flatMap((b) => b.notas)
const cards = notas.flatMap(derivarCards)
console.log(
  `${baralhos.length} Baralhos, ${notas.length} Notas, ${cards.length} Cards válidos`,
)
