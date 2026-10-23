import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { derivarCards } from '../content/cards.ts'
import { temas } from '../content/load.ts'
import { db } from '../progress/db.ts'

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

describe('Sessao', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Espaço revela, 3 avalia como Bom e grava o progresso', async () => {
    abrirSessao()
    expect(
      await screen.findByRole('button', { name: /Mostrar resposta/ }),
    ).toBeInTheDocument()
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
})
