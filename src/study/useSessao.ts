import { useLiveQuery } from 'dexie-react-hooks'
import { temas } from '../content/load.ts'
import { lerEstados, lerLimiteNovos, novosHoje } from '../progress/db.ts'
import { type Escopo, cardsDoEscopo, montarSessao } from './session.ts'

export async function carregarSessao(escopo: Escopo, agora: Date) {
  const estados = await lerEstados()
  const sessao = montarSessao({
    cards: cardsDoEscopo(temas, escopo),
    estados,
    novosHoje: await novosHoje(agora),
    limite: await lerLimiteNovos(),
    agora,
  })
  return { ...sessao, estados }
}

// Reativa ao banco; `undefined` enquanto carrega.
export function useContagem(escopo: Escopo) {
  const { temaSlug, baralhoId } = escopo
  return useLiveQuery(async () => {
    const { vencidos, novos } = await carregarSessao(
      { temaSlug, baralhoId },
      new Date(),
    )
    return { vencidos: vencidos.length, novos: novos.length }
  }, [temaSlug, baralhoId])
}
