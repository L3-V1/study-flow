import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { Inicio } from './Inicio.tsx'

vi.mock('../content/load.ts', () => ({ baralhos: [], temas: [] }))

describe('Inicio sem conteúdo', () => {
  it('mostra o estado vazio com a dica do /flashcards', () => {
    render(
      <MemoryRouter>
        <Inicio />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: 'Nenhum Baralho por enquanto.' }),
    ).toBeInTheDocument()
    expect(screen.getByText('/flashcards')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Estudar/ })).toBeNull()
  })
})
