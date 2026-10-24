import type { Card } from '../content/cards.ts'
import { Markdown } from './Markdown.tsx'

// Uma ficha de duas faces que vira ao revelar. O verso só entra no DOM
// revelado. A frente continua montada para a animação; na lacuna ela fica
// oculta do leitor de tela, porque o verso repete a frase inteira.
export function CardView({
  card,
  revelado,
}: {
  card: Card
  revelado: boolean
}) {
  return (
    <article className="ficha">
      <div className={revelado ? 'ficha-interior virada' : 'ficha-interior'}>
        <div
          className="ficha-face"
          aria-hidden={revelado && card.tipo === 'lacuna' ? true : undefined}
        >
          <p className="ficha-cabecalho">
            <span aria-hidden="true">
              {card.tipo === 'lacuna' ? '✏️' : '🤔'}
            </span>{' '}
            {card.tipo === 'lacuna' ? 'Complete a lacuna' : 'Pergunta'}
          </p>
          <div className="ficha-corpo">
            <Markdown texto={card.frente} />
          </div>
        </div>
        {revelado && (
          <div className="ficha-face ficha-verso">
            <p className="ficha-cabecalho">
              <span aria-hidden="true">💡</span> Resposta
            </p>
            <div className="ficha-corpo">
              <Markdown texto={card.verso} />
              {card.extra !== undefined && (
                <aside className="extra">
                  <Markdown texto={card.extra} />
                </aside>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
