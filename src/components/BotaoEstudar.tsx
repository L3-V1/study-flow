import { Link } from 'react-router'
import type { Escopo } from '../study/session.ts'
import { useContagem } from '../study/useSessao.ts'

function rotaDoEscopo({ temaSlug, baralhoId }: Escopo): string {
  return ['/estudar', temaSlug, baralhoId].filter(Boolean).join('/')
}

export function BotaoEstudar({ escopo }: { escopo: Escopo }) {
  const contagem = useContagem(escopo)
  if (contagem === undefined) {
    return (
      <span className="botao-estudar" aria-disabled="true">
        Estudar
      </span>
    )
  }
  const { vencidos, novos } = contagem
  const texto = `Estudar · ${vencidos} ${vencidos === 1 ? 'vencido' : 'vencidos'} · ${novos} ${novos === 1 ? 'novo' : 'novos'}`
  if (vencidos + novos === 0) {
    return (
      <span className="botao-estudar" aria-disabled="true">
        {texto}
      </span>
    )
  }
  return (
    <Link className="botao-estudar" to={rotaDoEscopo(escopo)}>
      {texto}
    </Link>
  )
}
