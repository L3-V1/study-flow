import { Link } from 'react-router'
import { AvisoBackup } from '../components/AvisoBackup.tsx'
import { BotaoEstudar } from '../components/BotaoEstudar.tsx'
import { EstadoVazio } from '../components/EstadoVazio.tsx'
import { temas } from '../content/load.ts'

export function Inicio() {
  return (
    <main>
      <AvisoBackup />
      <header className="abertura">
        <span className="logo" aria-hidden="true">
          🗂️
        </span>
        <h1>Study Flow</h1>
        <p>Seu fluxo de estudos, um passo de cada vez.</p>
      </header>
      {temas.length > 0 && <BotaoEstudar escopo={{}} />}
      {temas.length === 0 && (
        <EstadoVazio titulo="Nenhum Baralho por enquanto.">
          <p>
            Gere Notas com <code>/flashcards</code>.
          </p>
        </EstadoVazio>
      )}
      {temas.map((tema) => (
        <section key={tema.slug} className="tema">
          <h2>
            <Link to={`/tema/${tema.slug}`}>{tema.nome}</Link>
          </h2>
          <BotaoEstudar escopo={{ temaSlug: tema.slug }} />
          <ul className="lista">
            {tema.baralhos.map((baralho) => (
              <li key={baralho.id} className="cartao maco">
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
      <nav className="rodape" aria-label="Outras telas">
        <Link to="/progresso">
          <span aria-hidden="true">📈</span> Progresso
        </Link>
        <Link to="/configuracoes">
          <span aria-hidden="true">⚙️</span> Configurações
        </Link>
      </nav>
    </main>
  )
}
