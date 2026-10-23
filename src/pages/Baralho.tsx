import { Link, Navigate, useParams } from 'react-router'
import { Markdown } from '../components/Markdown.tsx'
import { revelarLacunas } from '../content/cloze.ts'
import { temas } from '../content/load.ts'

// Modo leitura: cada Nota aberta por inteiro, sem agendamento.
export function Baralho() {
  const { temaSlug, baralhoId } = useParams()
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
      <ul className="lista">
        {baralho.notas.map((nota) => (
          <li key={nota.id} className="cartao">
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
