import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Rating } from 'ts-fsrs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { exportarBackup } from '../progress/backup.ts'
import { avaliar, db, gravarLimiteNovos } from '../progress/db.ts'

const agora = new Date(2026, 9, 23, 10, 0)

function abrir() {
  render(
    <MemoryRouter initialEntries={['/configuracoes']}>
      <App />
    </MemoryRouter>,
  )
}

function escolherArquivo(conteudo: string) {
  const input = screen.getByLabelText('Arquivo de backup')
  const arquivo = new File([conteudo], 'backup.json', {
    type: 'application/json',
  })
  fireEvent.change(input, { target: { files: [arquivo] } })
}

async function backupDeA() {
  await avaliar('a', Rating.Good, agora)
  await gravarLimiteNovos(7)
  const texto = JSON.stringify(await exportarBackup(agora))
  await Promise.all(db.tables.map((t) => t.clear()))
  return texto
}

describe('Configuracoes', () => {
  let clique: ReturnType<typeof vi.fn<() => void>>

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:backup')
    URL.revokeObjectURL = vi.fn()
    clique = vi.fn<() => void>()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clique)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('salvar o limite grava em settings e avisa', async () => {
    abrir()
    const campo = await screen.findByLabelText('Cards novos por dia')
    await waitFor(() => expect(campo).toHaveValue(20))
    fireEvent.change(campo, { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Limite salvo.')).toBeInTheDocument()
    expect(await db.settings.get('limiteNovosPorDia')).toEqual({
      chave: 'limiteNovosPorDia',
      valor: 5,
    })
  })

  it('exportar baixa o arquivo e avisa', async () => {
    abrir()
    fireEvent.click(screen.getByRole('button', { name: 'Exportar backup' }))
    expect(await screen.findByText('Backup exportado.')).toBeInTheDocument()
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
    expect(clique).toHaveBeenCalledOnce()
  })

  it('importar abre o modal, e Cancelar não muda nada', async () => {
    const texto = await backupDeA()
    await avaliar('b', Rating.Good, agora)
    abrir()
    escolherArquivo(texto)
    const dialogo = await screen.findByRole('dialog')
    expect(dialogo).toHaveTextContent('1 Card com progresso e 1 revisão.')
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect((await db.cardStates.toArray()).map((e) => e.cardId)).toEqual(['b'])
  })

  it('Substituir troca os dados e avisa', async () => {
    const texto = await backupDeA()
    await avaliar('b', Rating.Good, agora)
    abrir()
    escolherArquivo(texto)
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Substituir' }))
    expect(await screen.findByText('Backup importado.')).toBeInTheDocument()
    expect((await db.cardStates.toArray()).map((e) => e.cardId)).toEqual(['a'])
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() =>
      expect(screen.getByLabelText('Cards novos por dia')).toHaveValue(7),
    )
  })

  it('arquivo inválido mostra o erro sem abrir o modal', async () => {
    abrir()
    escolherArquivo('{"qualquer": true}')
    expect(
      await screen.findByText(
        'Arquivo inválido: não é um backup do Study Flow.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  describe('apagar dados', () => {
    it('o botão fica desabilitado sem seleção', () => {
      abrir()
      expect(screen.getByRole('button', { name: 'Apagar…' })).toBeDisabled()
      fireEvent.click(screen.getByLabelText('Progresso e histórico'))
      expect(screen.getByRole('button', { name: 'Apagar…' })).toBeEnabled()
    })

    it('apagar o progresso esvazia as tabelas e avisa', async () => {
      await avaliar('a', Rating.Good, agora)
      abrir()
      fireEvent.click(screen.getByLabelText('Progresso e histórico'))
      fireEvent.click(screen.getByRole('button', { name: 'Apagar…' }))
      expect(await screen.findByRole('dialog')).toHaveTextContent(
        'Isso apaga o progresso e o histórico de revisões.',
      )
      fireEvent.click(screen.getByRole('button', { name: 'Apagar' }))
      expect(await screen.findByText('Dados apagados.')).toBeInTheDocument()
      expect(await db.cardStates.count()).toBe(0)
      expect(await db.reviewLogs.count()).toBe(0)
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('apagar os ajustes volta o limite a 20', async () => {
      await gravarLimiteNovos(7)
      abrir()
      const campo = await screen.findByLabelText('Cards novos por dia')
      await waitFor(() => expect(campo).toHaveValue(7))
      fireEvent.click(screen.getByLabelText('Ajustes (limite de Cards novos)'))
      fireEvent.click(screen.getByRole('button', { name: 'Apagar…' }))
      await screen.findByRole('dialog')
      fireEvent.click(screen.getByRole('button', { name: 'Apagar' }))
      expect(await screen.findByText('Dados apagados.')).toBeInTheDocument()
      await waitFor(() =>
        expect(screen.getByLabelText('Cards novos por dia')).toHaveValue(20),
      )
    })

    it('Cancelar não apaga nada', async () => {
      await avaliar('a', Rating.Good, agora)
      abrir()
      fireEvent.click(screen.getByLabelText('Progresso e histórico'))
      fireEvent.click(screen.getByRole('button', { name: 'Apagar…' }))
      await screen.findByRole('dialog')
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(await db.cardStates.count()).toBe(1)
      expect(screen.queryByText('Dados apagados.')).toBeNull()
    })

    it('exportar antes baixa o backup sem fechar o modal', async () => {
      abrir()
      fireEvent.click(screen.getByLabelText('Progresso e histórico'))
      fireEvent.click(screen.getByRole('button', { name: 'Apagar…' }))
      await screen.findByRole('dialog')
      fireEvent.click(
        screen.getByRole('button', { name: 'Exportar backup antes' }),
      )
      expect(await screen.findByText('Backup exportado.')).toBeInTheDocument()
      expect(clique).toHaveBeenCalledOnce()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})
