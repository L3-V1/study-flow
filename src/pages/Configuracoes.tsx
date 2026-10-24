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
import {
  apagarDados,
  gravarLimiteNovos,
  lerLimiteNovos,
} from '../progress/db.ts'

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
  // Remonta o formulário do limite para reler o valor importado ou apagado.
  const [recargas, setRecargas] = useState(0)
  const recarregar = () => setRecargas((n) => n + 1)
  return (
    <main className="configuracoes">
      <nav className="trilha">
        <Link to="/">Início</Link> ›{' '}
        <Link to="/configuracoes">Configurações</Link>
      </nav>
      <h1>Configurações</h1>
      <LimiteNovos key={recargas} />
      <Exportar />
      <Importar aoImportar={recarregar} />
      <ApagarDados aoApagar={recarregar} />
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

function ApagarDados({ aoApagar }: { aoApagar: () => void }) {
  const [progresso, setProgresso] = useState(false)
  const [ajustes, setAjustes] = useState(false)
  const [aviso, setAviso] = useState<Aviso>()
  const [avisoBackup, setAvisoBackup] = useState<Aviso>()
  const dialogo = useRef<HTMLDialogElement>(null)

  function abrir() {
    setAviso(undefined)
    setAvisoBackup(undefined)
    dialogo.current?.showModal()
  }

  async function exportar() {
    try {
      await baixarBackup(new Date())
      setAvisoBackup({ texto: 'Backup exportado.' })
    } catch {
      setAvisoBackup({
        texto: 'Não foi possível exportar o backup.',
        erro: true,
      })
    }
  }

  async function apagar() {
    try {
      await apagarDados({ progresso, ajustes })
      setAviso({ texto: 'Dados apagados.' })
      setProgresso(false)
      setAjustes(false)
      aoApagar()
    } catch {
      setAviso({ texto: 'Não foi possível apagar os dados.', erro: true })
    }
    dialogo.current?.close()
  }

  const itens = [
    progresso && 'o progresso e o histórico de revisões',
    ajustes && 'o limite de Cards novos, que volta ao padrão',
  ].filter(Boolean)

  return (
    <section>
      <h2>Apagar dados</h2>
      <p>Apaga do navegador o que estiver marcado.</p>
      <div className="opcoes">
        <label className="opcao">
          <input
            type="checkbox"
            checked={progresso}
            onChange={(e) => setProgresso(e.currentTarget.checked)}
          />
          Progresso e histórico
        </label>
        <label className="opcao">
          <input
            type="checkbox"
            checked={ajustes}
            onChange={(e) => setAjustes(e.currentTarget.checked)}
          />
          Ajustes (limite de Cards novos)
        </label>
      </div>
      <button type="button" disabled={!progresso && !ajustes} onClick={abrir}>
        Apagar…
      </button>
      <MensagemAviso aviso={aviso} />
      <dialog ref={dialogo} aria-labelledby="titulo-apagar">
        <h2 id="titulo-apagar">Apagar dados?</h2>
        <p>Isso apaga {itens.join(' e ')}.</p>
        <p>Não dá para desfazer sem um backup.</p>
        <MensagemAviso aviso={avisoBackup} />
        <div className="acoes">
          <button type="button" onClick={() => void exportar()}>
            Exportar backup antes
          </button>
          <button type="button" onClick={() => dialogo.current?.close()}>
            Cancelar
          </button>
          <button
            type="button"
            className="perigo"
            onClick={() => void apagar()}
          >
            Apagar
          </button>
        </div>
      </dialog>
    </section>
  )
}
