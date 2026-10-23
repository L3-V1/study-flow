import { Link } from 'react-router'
import { temas } from '../content/load.ts'

export function Inicio() {
  return (
    <main>
      <h1>Study Flow</h1>
      <p>Seu fluxo de estudos, um passo de cada vez.</p>
      {temas.length === 0 && <p>Nenhum Baralho por enquanto.</p>}
      {temas.map((tema) => (
        <section key={tema.slug}>
          <h2>
            <Link to={`/tema/${tema.slug}`}>{tema.nome}</Link>
          </h2>
          <ul className="lista">
            {tema.baralhos.map((baralho) => (
              <li key={baralho.id} className="cartao">
                <Link to={`/tema/${tema.slug}/${baralho.id}`}>
                  {baralho.nome}
                </Link>
                <span className="contagem">
                  {baralho.notas.length}{' '}
                  {baralho.notas.length === 1 ? 'Nota' : 'Notas'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
