import { numerosDasLacunas, renderizarLacuna } from './cloze.ts'
import type { Nota } from './schema.ts'

// Frente, verso e extra já são strings Markdown prontas para exibir.
export type Card = {
  id: string
  notaId: string
  tipo: Nota['tipo']
  frente: string
  verso: string
  extra?: string
}

export function derivarCards(nota: Nota): Card[] {
  const extra = nota.extra === undefined ? {} : { extra: nota.extra }
  if (nota.tipo === 'pergunta-resposta') {
    return [
      {
        id: nota.id,
        notaId: nota.id,
        tipo: nota.tipo,
        frente: nota.frente,
        verso: nota.verso,
        ...extra,
      },
    ]
  }
  return numerosDasLacunas(nota.texto).map((n) => ({
    id: `${nota.id}::c${n}`,
    notaId: nota.id,
    tipo: nota.tipo,
    frente: renderizarLacuna(nota.texto, n, false),
    verso: renderizarLacuna(nota.texto, n, true),
    ...extra,
  }))
}
