import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../App.tsx'

const texto = 'Progresso de 3 Cards removidos do conteúdo foi apagado.'

describe('AvisoOrfaos', () => {
  it('aparece com Cards removidos e, fechado, não volta ao navegar', () => {
    render(
      <MemoryRouter>
        <App cardsRemovidos={3} />
      </MemoryRouter>,
    )
    expect(screen.getByText(texto)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByText(texto)).toBeNull()
    fireEvent.click(screen.getByRole('link', { name: /Configurações/ }))
    fireEvent.click(screen.getByRole('link', { name: 'Início' }))
    expect(
      screen.getByRole('heading', { name: 'Study Flow' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(texto)).toBeNull()
  })

  it('não aparece sem Cards removidos', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    expect(screen.queryByText(/removido/)).toBeNull()
  })
})
