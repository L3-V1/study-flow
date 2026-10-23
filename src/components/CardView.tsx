import type { Card } from '../content/cards.ts'
import { Markdown } from './Markdown.tsx'

// Oculto mostra só a frente. Revelado: a lacuna mostra só a frase revelada;
// a pergunta e resposta mostra frente + verso.
export function CardView({
  card,
  revelado,
}: {
  card: Card
  revelado: boolean
}) {
  return (
    <article className="cartao">
      {(!revelado || card.tipo === 'pergunta-resposta') && (
        <Markdown texto={card.frente} />
      )}
      {revelado && (
        <>
          {card.tipo === 'pergunta-resposta' && <hr />}
          <Markdown texto={card.verso} />
          {card.extra !== undefined && (
            <aside className="extra">
              <Markdown texto={card.extra} />
            </aside>
          )}
        </>
      )}
    </article>
  )
}
