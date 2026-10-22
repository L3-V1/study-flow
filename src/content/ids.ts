const BASE36 = '0123456789abcdefghijklmnopqrstuvwxyz'

// IDs de Nota no formato <slug>-<8 base36>, sem repetir os já existentes nem
// os do próprio lote.
export function gerarIdsDeNota(
  baralhoSlug: string,
  qtd: number,
  existentes: Set<string>,
): string[] {
  const usados = new Set(existentes)
  const ids: string[] = []
  while (ids.length < qtd) {
    const id = `${baralhoSlug}-${sufixoAleatorio()}`
    if (usados.has(id)) continue
    usados.add(id)
    ids.push(id)
  }
  return ids
}

function sufixoAleatorio(): string {
  let sufixo = ''
  while (sufixo.length < 8) {
    const [byte] = crypto.getRandomValues(new Uint8Array(1))
    // Descarta 252..255 para não enviesar o resto da divisão por 36.
    if (byte! < 252) sufixo += BASE36[byte! % 36]
  }
  return sufixo
}
