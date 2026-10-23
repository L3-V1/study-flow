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

  it('lista Temas e Baralhos na inicial', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Computação' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Complexidade de algoritmos' }),
    ).toBeInTheDocument()
  })

  it('mostra os Baralhos do Tema', () => {
    render(
      <MemoryRouter initialEntries={['/tema/computacao']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: 'Computação' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Complexidade de algoritmos' }),
    ).toBeInTheDocument()
  })

  it('mostra as Notas do Baralho com fórmulas renderizadas', () => {
    const { container } = render(
      <MemoryRouter
        initialEntries={['/tema/computacao/complexidade-de-algoritmos']}
      >
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: 'Complexidade de algoritmos' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
    expect(container.querySelector('.katex')).not.toBeNull()
    expect(container.querySelector('pre code.hljs')).not.toBeNull()
  })

  it('redireciona Baralho inexistente para a inicial', () => {
    render(
      <MemoryRouter initialEntries={['/tema/computacao/nao-existe']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: 'Study Flow' }),
    ).toBeInTheDocument()
  })
})
