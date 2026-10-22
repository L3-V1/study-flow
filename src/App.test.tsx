import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('mostra o título Study Flow', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: 'Study Flow' }),
    ).toBeInTheDocument()
  })

  it('redireciona rotas inexistentes para a inicial', () => {
    render(
      <MemoryRouter initialEntries={['/rota-inexistente']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: 'Study Flow' }),
    ).toBeInTheDocument()
  })
})
