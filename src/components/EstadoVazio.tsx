import type { ReactNode, Ref } from 'react'

// O `ref` vai para o título, que recebe o foco quando a tela muda sozinha.
export function EstadoVazio({
  titulo,
  children,
  ref,
}: {
  titulo: string
  children?: ReactNode
  ref?: Ref<HTMLHeadingElement>
}) {
  return (
    <section className="vazio">
      <svg
        viewBox="0 0 24 24"
        width="48"
        height="48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
      <h2 ref={ref} tabIndex={ref === undefined ? undefined : -1}>
        {titulo}
      </h2>
      {children}
    </section>
  )
}
