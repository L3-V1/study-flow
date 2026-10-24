import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { derivarCards } from './content/cards.ts'
import { temas } from './content/load.ts'
import { suspenderNota } from './progress/db.ts'
import { cardsDoEscopo } from './study/session.ts'

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

  it('o link Progresso do Início leva à tela', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('link', { name: 'Progresso' }))
    expect(
      await screen.findByRole('heading', { name: 'Progresso' }),
    ).toBeInTheDocument()
  })

  it('o botão Estudar do Início mostra os novos com o limite de 20', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    const novos = Math.min(20, cardsDoEscopo(temas, {}).length)
    const [tudo] = await screen.findAllByRole('link', {
      name: `Estudar · 0 vencidos · ${novos} novos`,
    })
    expect(tudo).toHaveAttribute('href', '/estudar')
  })

  it('Nota suspensa mostra Reativar no Baralho, e reativar tira a marca', async () => {
    const baralho = temas[0]!.baralhos[0]!
    const nota = baralho.notas[0]!
    await suspenderNota(derivarCards(nota).map((c) => c.id))
    render(
      <MemoryRouter initialEntries={[`/tema/${temas[0]!.slug}/${baralho.id}`]}>
        <App />
      </MemoryRouter>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Reativar' }))
    await waitFor(() => {
      expect(screen.queryByText('Suspensa')).toBeNull()
    })
  })

  it('o Início mostra o banner de backup, e Exportar agora o faz sumir', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:backup')
    URL.revokeObjectURL = vi.fn()
    const clique = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('button', { name: 'Exportar agora' })).toBeNull()
    await suspenderNota(['qualquer'])
    expect(
      await screen.findByText('Você ainda não fez um backup do seu progresso.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Exportar agora' }))
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Exportar agora' }),
      ).toBeNull()
    })
    expect(clique).toHaveBeenCalledOnce()
    clique.mockRestore()
  })

  it('Baralho todo suspenso avisa no botão e na tela', async () => {
    const baralho = temas[0]!.baralhos[0]!
    for (const nota of baralho.notas) {
      await suspenderNota(derivarCards(nota).map((c) => c.id))
    }
    render(
      <MemoryRouter initialEntries={[`/tema/${temas[0]!.slug}/${baralho.id}`]}>
        <App />
      </MemoryRouter>,
    )
    expect(
      await screen.findByText('Todas as Notas suspensas'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Todas as Notas deste Baralho estão suspensas',
      }),
    ).toBeInTheDocument()
  })

  it('a tela de Tema tem o botão Estudar do Tema', async () => {
    render(
      <MemoryRouter initialEntries={['/tema/computacao']}>
        <App />
      </MemoryRouter>,
    )
    const links = await screen.findAllByRole('link', { name: /^Estudar/ })
    expect(links[0]).toHaveAttribute('href', '/estudar/computacao')
  })
})
