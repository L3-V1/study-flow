// Sintaxe do Anki: {{cN::trecho}} ou {{cN::trecho::dica}}, sem aninhamento.
const LACUNA = /\{\{c(\d+)::(.+?)(?:::(.+?))?\}\}/g

export function numerosDasLacunas(texto: string): number[] {
  const numeros = new Set<number>()
  for (const m of texto.matchAll(LACUNA)) numeros.add(Number(m[1]))
  return [...numeros].sort((a, b) => a - b)
}

// A Lacuna ativa vira **[...]** (ou **[dica]**) na frente e **trecho** no
// verso; as demais Lacunas mostram o trecho puro.
export function renderizarLacuna(
  texto: string,
  numero: number,
  revelada: boolean,
): string {
  return texto.replace(
    LACUNA,
    (_, n: string, trecho: string, dica: string | undefined) => {
      if (Number(n) !== numero) return trecho
      return revelada ? `**${trecho}**` : `**[${dica ?? '...'}]**`
    },
  )
}

export function temLacunaMalformada(texto: string): boolean {
  return texto.replace(LACUNA, '').includes('{{c')
}
