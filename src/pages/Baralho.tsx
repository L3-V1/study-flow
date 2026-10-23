import { useLiveQuery } from 'dexie-react-hooks'
import { Link, Navigate, useParams } from 'react-router'
import { BotaoEstudar } from '../components/BotaoEstudar.tsx'
import { Markdown } from '../components/Markdown.tsx'
import { derivarCards } from '../content/cards.ts'
import { revelarLacunas } from '../content/cloze.ts'
import { temas } from '../content/load.ts'
import { lerEstados, reativarNota } from '../progress/db.ts'

// Modo leitura: cada Nota aberta por inteiro, sem agendamento.
export function Baralho() {
  const { temaSlug, baralhoId } = useParams()
  const estados = useLiveQuery(lerEstados)
  const tema = temas.find((t) => t.slug === temaSlug)
  const baralho = tema?.baralhos.find((b) => b.id === baralhoId)
  if (tema === undefined || baralho === undefined) {
    return <Navigate to="/" replace />
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
      <ul className="lista">
        {baralho.notas.map((nota) => {
          const cardIds = derivarCards(nota).map((c) => c.id)
          const suspensa = cardIds.some((id) => estados?.get(id)?.suspenso)
          return (
            <li key={nota.id} className="cartao">
              {suspensa && (
                <div className="suspensa">
                  <span className="marca">Suspensa</span>
                  <button type="button" onClick={() => reativarNota(cardIds)}>
                    Reativar
                  </button>
                </div>
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
          )
        })}
      </ul>
    </main>
  )
}
