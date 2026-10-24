import type { ReactNode, Ref } from 'react'

// O `ref` vai para o título, que recebe o foco quando a tela muda sozinha.
export function EstadoVazio({
  titulo,
  emoji = '📭',
  children,
  ref,
}: {
  titulo: string
  emoji?: string
  children?: ReactNode
  ref?: Ref<HTMLHeadingElement>
}) {
  return (
    <section className="vazio">
      <span className="emoji-grande" aria-hidden="true">
        {emoji}
      </span>
      <h2 ref={ref} tabIndex={ref === undefined ? undefined : -1}>
        {titulo}
      </h2>
      {children}
    </section>
  )
}
