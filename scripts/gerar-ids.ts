import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gerarIdsDeNota } from '../src/content/ids.ts'
import { slugSchema } from '../src/content/schema.ts'

// Uso: npm run id -- <baralho-slug> [qtd=1]
const [slug, qtdTexto = '1'] = process.argv.slice(2)
const qtd = Number(qtdTexto)

if (!slugSchema.safeParse(slug).success) {
  console.error('Uso: npm run id -- <baralho-slug> [qtd=1] (slug como tcp-ip)')
  process.exit(1)
}
if (!Number.isInteger(qtd) || qtd < 1) {
  console.error(`qtd deve ser um inteiro maior que 0 (recebido "${qtdTexto}")`)
  process.exit(1)
}

const raiz = join(import.meta.dirname, '..', 'content')
const existentes = new Set<string>()
for (const caminho of readdirSync(raiz, {
  recursive: true,
  encoding: 'utf8',
})) {
  if (!caminho.endsWith('.json')) continue
  try {
    const dados = JSON.parse(readFileSync(join(raiz, caminho), 'utf8'))
    for (const nota of dados?.notas ?? []) {
      if (typeof nota?.id === 'string') existentes.add(nota.id)
    }
  } catch {
    // JSON inválido é problema do `npm run validate`, não deste script.
  }
}

for (const id of gerarIdsDeNota(slug!, qtd, existentes)) console.log(id)
