import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router'
import {
  type Backup,
  baixarBackup,
  importarBackup,
  lerBackup,
} from '../progress/backup.ts'
import { gravarLimiteNovos, lerLimiteNovos } from '../progress/db.ts'

type Aviso = { texto: string; erro?: boolean }

function MensagemAviso({ aviso }: { aviso: Aviso | undefined }) {
  if (aviso === undefined) return null
  return (
    <p className="aviso" role={aviso.erro ? 'alert' : 'status'}>
      {aviso.texto}
    </p>
  )
}

export function Configuracoes() {
  // Remonta o formulário do limite para reler o valor importado.
  const [importacoes, setImportacoes] = useState(0)
  return (
    <main className="configuracoes">
      <nav className="trilha">
        <Link to="/">Início</Link> ›{' '}
        <Link to="/configuracoes">Configurações</Link>
      </nav>
      <h1>Configurações</h1>
      <LimiteNovos key={importacoes} />
      <Exportar />
      <Importar aoImportar={() => setImportacoes((n) => n + 1)} />
    </main>
  )
}

function LimiteNovos() {
  const [valor, setValor] = useState<string>()
  const [aviso, setAviso] = useState<Aviso>()

  useEffect(() => {
    let ativo = true
    void lerLimiteNovos().then((n) => {
      if (ativo) setValor(String(n))
    })
    return () => {
      ativo = false
    }
  }, [])

  async function salvar(e: FormEvent) {
    e.preventDefault()
    try {
      await gravarLimiteNovos(Number(valor))
      setAviso({ texto: 'Limite salvo.' })
    } catch {
      setAviso({ texto: 'Não foi possível salvar o limite.', erro: true })
    }
  }

  return (
    <section>
      <h2>Limite de Cards novos por dia</h2>
      <form className="formulario" onSubmit={(e) => void salvar(e)}>
        <label htmlFor="limite-novos">Cards novos por dia</label>
        <div className="linha">
          <input
            id="limite-novos"
            type="number"
            inputMode="numeric"
            min={0}
            max={999}
            step={1}
            required
            disabled={valor === undefined}
            value={valor ?? ''}
            onChange={(e) => {
              e.currentTarget.setCustomValidity('')
              setValor(e.currentTarget.value)
              setAviso(undefined)
            }}
            onInvalid={(e) =>
              e.currentTarget.setCustomValidity(
                'Digite um número inteiro de 0 a 999.',
              )
            }
          />
          <button type="submit" disabled={valor === undefined}>
            Salvar
          </button>
        </div>
      </form>
      <MensagemAviso aviso={aviso} />
    </section>
  )
}

function Exportar() {
  const [aviso, setAviso] = useState<Aviso>()

  async function exportar() {
    try {
      await baixarBackup(new Date())
      setAviso({ texto: 'Backup exportado.' })
    } catch {
      setAviso({ texto: 'Não foi possível exportar o backup.', erro: true })
    }
  }

  return (
    <section>
      <h2>Exportar</h2>
      <p>Baixa um arquivo JSON com todo o seu progresso.</p>
      <button type="button" onClick={() => void exportar()}>
        Exportar backup
      </button>
      <MensagemAviso aviso={aviso} />
    </section>
  )
}

function Importar({ aoImportar }: { aoImportar: () => void }) {
  const [pendente, setPendente] = useState<Backup>()
  const [aviso, setAviso] = useState<Aviso>()
  const dialogo = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (pendente !== undefined && !dialogo.current?.open) {
      dialogo.current?.showModal()
    }
  }, [pendente])

  async function escolher(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget
    const arquivo = input.files?.[0]
    setAviso(undefined)
    if (arquivo === undefined) return
    const backup = lerBackup(await arquivo.text())
    // Permite escolher o mesmo arquivo de novo.
    input.value = ''
    if (backup === undefined) {
      setAviso({
        texto: 'Arquivo inválido: não é um backup do Study Flow.',
        erro: true,
      })
      return
    }
    setPendente(backup)
  }

  async function substituir() {
    if (pendente === undefined) return
    try {
      await importarBackup(pendente)
      setAviso({ texto: 'Backup importado.' })
      aoImportar()
    } catch {
      setAviso({ texto: 'Não foi possível importar o backup.', erro: true })
    }
    dialogo.current?.close()
  }

  return (
    <section>
      <h2>Importar</h2>
      <label htmlFor="arquivo-backup">Arquivo de backup</label>
      <input
        id="arquivo-backup"
        type="file"
        accept="application/json,.json"
        onChange={(e) => void escolher(e)}
      />
      <MensagemAviso aviso={aviso} />
      <dialog
        ref={dialogo}
        aria-labelledby="titulo-importar"
        onClose={() => setPendente(undefined)}
      >
        {pendente !== undefined && (
          <>
            <h2 id="titulo-importar">Importar backup?</h2>
            <p>
              Backup de{' '}
              {pendente.exportadoEm.toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
              .
            </p>
            <p>
              {pendente.cardStates.length}{' '}
              {pendente.cardStates.length === 1 ? 'Card' : 'Cards'} com
              progresso e {pendente.reviewLogs.length}{' '}
              {pendente.reviewLogs.length === 1 ? 'revisão' : 'revisões'}. Isso
              substitui todo o progresso atual.
            </p>
            <div className="acoes">
              <button type="button" onClick={() => dialogo.current?.close()}>
                Cancelar
              </button>
              <button
                type="button"
                className="perigo"
                onClick={() => void substituir()}
              >
                Substituir
              </button>
            </div>
          </>
        )}
      </dialog>
    </section>
  )
}
