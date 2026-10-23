import { Link, Navigate, useParams } from 'react-router'
import { temas } from '../content/load.ts'

export function Tema() {
  const { temaSlug } = useParams()
  const tema = temas.find((t) => t.slug === temaSlug)
  if (tema === undefined) return <Navigate to="/" replace />

  return (
    <main>
      <nav className="trilha">
        <Link to="/">Início</Link>
      </nav>
      <h1>{tema.nome}</h1>
      <ul className="lista">
        {tema.baralhos.map((baralho) => (
          <li key={baralho.id} className="cartao">
            <Link to={`/tema/${tema.slug}/${baralho.id}`}>{baralho.nome}</Link>
            {baralho.descricao !== undefined && <p>{baralho.descricao}</p>}
            <span className="contagem">
              {baralho.notas.length}{' '}
              {baralho.notas.length === 1 ? 'Nota' : 'Notas'}
            </span>
          </li>
        ))}
      </ul>
    </main>
  )
}
