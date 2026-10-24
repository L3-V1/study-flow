import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { derivarCards } from '../content/cards.ts'
import { CardView } from './CardView.tsx'

const [lacuna1, lacuna2] = derivarCards({
  id: 'tcp-ip-p0q1r2s3',
  tipo: 'lacuna',
  texto: 'O {{c1::TCP}} usa o {{c2::handshake::processo}}.',
})

const [perguntaResposta] = derivarCards({
  id: 'tcp-ip-k3j9x2ab',
  tipo: 'pergunta-resposta',
  frente: 'Quantas camadas?',
  verso: 'Quatro.',
  extra: 'No modelo OSI são sete.',
})

describe('CardView', () => {
  it('lacuna oculta mostra [...] e não o trecho', () => {
    render(<CardView card={lacuna1!} revelado={false} />)
    expect(screen.getByText('[...]')).toBeInTheDocument()
    expect(screen.queryByText('TCP')).toBeNull()
  })

  it('lacuna oculta mostra a dica no lugar de [...]', () => {
    render(<CardView card={lacuna2!} revelado={false} />)
    expect(screen.getByText('[processo]')).toBeInTheDocument()
    expect(screen.queryByText('handshake')).toBeNull()
  })

  it('lacuna revelada mostra o trecho, só uma vez', () => {
    render(<CardView card={lacuna1!} revelado />)
    expect(screen.getByText('TCP')).toBeInTheDocument()
    // A frente segue montada para a animação, mas fora da árvore acessível.
    expect(
      screen.getByText('[...]').closest('[aria-hidden="true"]'),
    ).not.toBeNull()
  })

  it('pergunta e resposta esconde o verso e o extra até revelar', () => {
    const { rerender } = render(
      <CardView card={perguntaResposta!} revelado={false} />,
    )
    expect(screen.getByText('Quantas camadas?')).toBeInTheDocument()
    expect(screen.queryByText('Quatro.')).toBeNull()
    expect(screen.queryByText('No modelo OSI são sete.')).toBeNull()

    rerender(<CardView card={perguntaResposta!} revelado />)
    expect(screen.getByText('Quantas camadas?')).toBeInTheDocument()
    expect(screen.getByText('Quatro.')).toBeInTheDocument()
    expect(screen.getByText('No modelo OSI são sete.')).toBeInTheDocument()
  })
})
