import type { Baralho } from './schema.ts'

export type Tema = { slug: string; nome: string; baralhos: Baralho[] }

const porNome = (a: { nome: string }, b: { nome: string }) =>
  a.nome.localeCompare(b.nome, 'pt-BR')

// Temas e Baralhos em ordem alfabética do nome; Notas ficam na ordem do JSON.
export function agruparPorTema(baralhos: Baralho[]): Tema[] {
  const temas = new Map<string, Tema>()
  for (const baralho of baralhos) {
    const { slug, nome } = baralho.tema
    const tema = temas.get(slug) ?? { slug, nome, baralhos: [] }
    tema.baralhos.push(baralho)
    temas.set(slug, tema)
  }
  const ordenados = [...temas.values()].sort(porNome)
  for (const tema of ordenados) tema.baralhos.sort(porNome)
  return ordenados
}
