import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { BotaoEstudar } from '../components/BotaoEstudar.tsx'
import { EstadoVazio } from '../components/EstadoVazio.tsx'
import { Markdown } from '../components/Markdown.tsx'
import { derivarCards } from '../content/cards.ts'
import { revelarLacunas } from '../content/cloze.ts'
import { temas } from '../content/load.ts'
import { lerEstados, reativarNota } from '../progress/db.ts'

// Modo leitura: cada Nota aberta por inteiro, sem agendamento.
export function Baralho() {
  const { temaSlug, baralhoId } = useParams()
  const estados = useLiveQuery(lerEstados)
  // O retorno aparece na própria Nota, que pode estar longe do topo.
  const [aviso, setAviso] = useState<{ notaId: string; texto: string }>()
  const tema = temas.find((t) => t.slug === temaSlug)
  const baralho = tema?.baralhos.find((b) => b.id === baralhoId)
  if (tema === undefined || baralho === undefined) {
    return <Navigate to="/" replace />
  }
  const notas = baralho.notas.map((nota) => {
    const cardIds = derivarCards(nota).map((c) => c.id)
    const suspensa = cardIds.some((id) => estados?.get(id)?.suspenso)
    return { nota, cardIds, suspensa }
  })
  // Mesmo critério do BotaoEstudar: todos os Cards, não só um por Nota.
  const tudoSuspenso = notas.every(({ cardIds }) =>
    cardIds.every((id) => estados?.get(id)?.suspenso),
  )

  async function reativar(notaId: string, cardIds: string[]) {
    try {
      await reativarNota(cardIds)
      setAviso({ notaId, texto: 'Nota reativada.' })
    } catch {
      setAviso({ notaId, texto: 'Não foi possível reativar a Nota.' })
    }
  }

  return (
    <main>
      <nav className="trilha">
        <Link to="/">Início</Link> ›{' '}
        <Link to={`/tema/${tema.slug}`}>{tema.nome}</Link>
      </nav>
      <h1>{baralho.nome}</h1>
      {baralho.descricao !== undefined && <p>{baralho.descricao}</p>}
      <BotaoEstudar escopo={{ temaSlug: tema.slug, baralhoId: baralho.id }} />
      {tudoSuspenso && (
        <EstadoVazio
          titulo="Todas as Notas deste Baralho estão suspensas"
          emoji="⏸️"
        >
          <p>Reative as Notas abaixo depois de corrigi-las.</p>
        </EstadoVazio>
      )}
      <ul className="lista">
        {notas.map(({ nota, cardIds, suspensa }) => (
          <li key={nota.id} className="cartao ficha-leitura">
            {suspensa && (
              <div className="suspensa">
                <span className="marca">Suspensa</span>
                <button
                  type="button"
                  onClick={() => void reativar(nota.id, cardIds)}
                >
                  Reativar
                </button>
              </div>
            )}
            {aviso?.notaId === nota.id && (
              <p className="aviso" role="status">
                {aviso.texto}
              </p>
            )}
            {nota.tipo === 'pergunta-resposta' ? (
              <>
                <Markdown texto={nota.frente} />
                <hr />
                <Markdown texto={nota.verso} />
              </>
            ) : (
              <Markdown texto={revelarLacunas(nota.texto)} />
            )}
            {nota.extra !== undefined && (
              <aside className="extra">
                <Markdown texto={nota.extra} />
              </aside>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
