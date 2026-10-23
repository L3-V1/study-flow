import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Rating } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import App from '../App.tsx'
import { derivarCards } from '../content/cards.ts'
import { temas } from '../content/load.ts'
import { avaliar, suspenderNota } from '../progress/db.ts'
import { cardsDoEscopo } from '../study/session.ts'

const baralho = temas
  .find((t) => t.slug === 'computacao')!
  .baralhos.find((b) => b.id === 'complexidade-de-algoritmos')!
const [primeira, segunda] = baralho.notas

function abrir() {
  render(
    <MemoryRouter initialEntries={['/progresso']}>
      <App />
    </MemoryRouter>,
  )
}

describe('Progresso', () => {
  it('sem revisões, a sequência é 0 e o heatmap fica vazio', async () => {
    abrir()
    expect(
      await screen.findByText('Sequência: 0 dias seguidos'),
    ).toBeInTheDocument()
    expect(screen.getByText('0 revisões no último ano')).toBeInTheDocument()
  })

  it('mostra a sequência, a revisão de hoje e as contagens do Baralho', async () => {
    const agora = new Date()
    // Fácil num Card novo dá um intervalo de dias: em aprendizado, não vencido.
    await avaliar(derivarCards(primeira!)[0]!.id, Rating.Easy, agora)
    await suspenderNota(derivarCards(segunda!).map((c) => c.id))
    abrir()

    expect(
      await screen.findByText('Sequência: 1 dia seguido'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: `1 revisão em ${agora.toLocaleDateString('pt-BR')}`,
      }),
    ).toBeInTheDocument()

    const total = cardsDoEscopo(temas, {
      temaSlug: 'computacao',
      baralhoId: baralho.id,
    }).length
    const linha = screen.getByRole('row', { name: new RegExp(baralho.nome) })
    expect(
      within(linha)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual([String(total - 2), '1', '0', '0', '1'])
  })
})
