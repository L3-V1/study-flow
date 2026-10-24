import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { derivarCards } from '../content/cards.ts'
import { temas } from '../content/load.ts'
import { db, gravarLimiteNovos } from '../progress/db.ts'

vi.mock('../content/load.ts', () => import('../test/conteudo.ts'))

const baralho = temas
  .find((t) => t.slug === 'computacao')!
  .baralhos.find((b) => b.id === 'complexidade-de-algoritmos')!
const [primeira, segunda] = baralho.notas

function abrirSessao() {
  render(
    <MemoryRouter
      initialEntries={['/estudar/computacao/complexidade-de-algoritmos']}
    >
      <App />
    </MemoryRouter>,
  )
}

// O foco em "Mostrar resposta" vem de um efeito: depois dele, o atalho de
// teclado já enxerga o Card atual.
async function esperarCard() {
  const mostrar = await screen.findByRole('button', {
    name: /Mostrar resposta/,
  })
  await waitFor(() => expect(mostrar).toHaveFocus())
}

describe('Sessao', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Espaço revela, 3 avalia como Bom e grava o progresso', async () => {
    abrirSessao()
    await esperarCard()
    expect(screen.queryByRole('button', { name: /Bom/ })).toBeNull()

    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.getByRole('button', { name: /Bom/ })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: '3' })
    await waitFor(async () => {
      expect(await db.reviewLogs.count()).toBe(1)
    })
    const [estado] = await db.cardStates.toArray()
    expect(estado?.cardId).toBe(primeira!.id)
    expect(
      await screen.findByRole('button', { name: /Mostrar resposta/ }),
    ).toBeInTheDocument()
  })

  it('Erro na Nota suspende os Cards da Nota e copia o comando', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    abrirSessao()

    fireEvent.click(await screen.findByRole('button', { name: 'Erro na Nota' }))
    expect(
      await screen.findByText('Card suspenso. Comando copiado.'),
    ).toBeInTheDocument()
    expect(writeText).toHaveBeenCalledWith(`/flashcards-fix ${primeira!.id} `)
    const estados = await db.cardStates.toArray()
    expect(estados.map((e) => e.cardId)).toEqual(
      derivarCards(primeira!).map((c) => c.id),
    )
    expect(estados.every((e) => e.suspenso)).toBe(true)

    // O próximo Card já é da Nota seguinte.
    fireEvent.click(screen.getByRole('button', { name: 'Erro na Nota' }))
    await waitFor(() => {
      expect(writeText).toHaveBeenLastCalledWith(
        `/flashcards-fix ${segunda!.id} `,
      )
    })
  })

  it('sem nada para estudar mostra o estado vazio', async () => {
    await gravarLimiteNovos(0)
    abrirSessao()
    expect(
      await screen.findByRole('heading', { name: 'Nada para estudar agora' }),
    ).toHaveFocus()
    expect(screen.queryByText('Sessão concluída')).toBeNull()
  })

  it('revelar foca o grupo Avaliação; avaliar devolve o foco', async () => {
    abrirSessao()
    await esperarCard()

    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.getByRole('group', { name: 'Avaliação' })).toHaveFocus()

    fireEvent.keyDown(window, { key: '3' })
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Mostrar resposta/ }),
      ).toHaveFocus()
    })
  })

  it('com o foco em Erro na Nota, Espaço não revela a resposta', async () => {
    abrirSessao()
    await esperarCard()
    const erro = screen.getByRole('button', { name: 'Erro na Nota' })
    erro.focus()
    fireEvent.keyDown(erro, { key: ' ' })
    expect(screen.queryByRole('group', { name: 'Avaliação' })).toBeNull()
    expect(
      screen.getByRole('button', { name: /Mostrar resposta/ }),
    ).toBeInTheDocument()
  })

  it('falha ao gravar a Avaliação avisa e mantém o Card', async () => {
    vi.spyOn(db, 'transaction').mockRejectedValue(new Error('cota'))
    abrirSessao()
    await esperarCard()
    fireEvent.keyDown(window, { key: ' ' })
    fireEvent.keyDown(window, { key: '3' })
    expect(
      await screen.findByText('Não foi possível salvar a Avaliação.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bom/ })).toBeInTheDocument()
  })
})
