import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { type Grade, Rating, createEmptyCard } from 'ts-fsrs'
import { CardView } from '../components/CardView.tsx'
import { type Card, derivarCards } from '../content/cards.ts'
import { baralhos, temas } from '../content/load.ts'
import { type EstadoCard, avaliar, suspenderNota } from '../progress/db.ts'
import { avaliacoes, formatarIntervalo, previsoes } from '../study/scheduler.ts'
import { type Escopo, aposAvaliar } from '../study/session.ts'
import { carregarSessao } from '../study/useSessao.ts'

const ROTULOS: Record<Grade, string> = {
  [Rating.Again]: 'Errei',
  [Rating.Hard]: 'Difícil',
  [Rating.Good]: 'Bom',
  [Rating.Easy]: 'Fácil',
}

const CLASSES: Record<Grade, string> = {
  [Rating.Again]: 'errei',
  [Rating.Hard]: 'dificil',
  [Rating.Good]: 'bom',
  [Rating.Easy]: 'facil',
}

type Trilha = { rotulo: string; para: string }[]

export function Sessao() {
  const { temaSlug, baralhoId } = useParams()
  const tema = temas.find((t) => t.slug === temaSlug)
  const baralho = tema?.baralhos.find((b) => b.id === baralhoId)
  if (temaSlug !== undefined && tema === undefined) {
    return <Navigate to="/" replace />
  }
  if (baralhoId !== undefined && baralho === undefined) {
    return <Navigate to="/" replace />
  }

  const trilha: Trilha = [{ rotulo: 'Início', para: '/' }]
  if (tema !== undefined) {
    trilha.push({ rotulo: tema.nome, para: `/tema/${tema.slug}` })
  }
  if (tema !== undefined && baralho !== undefined) {
    trilha.push({
      rotulo: baralho.nome,
      para: `/tema/${tema.slug}/${baralho.id}`,
    })
  }

  return (
    <SessaoAtiva
      key={`${temaSlug}/${baralhoId}`}
      escopo={{ temaSlug, baralhoId }}
      titulo={baralho?.nome ?? tema?.nome ?? 'Todos os Temas'}
      trilha={trilha}
    />
  )
}

function campoDeTexto(alvo: EventTarget | null): boolean {
  return (
    alvo instanceof HTMLElement &&
    (alvo.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName))
  )
}

function SessaoAtiva({
  escopo,
  titulo,
  trilha,
}: {
  escopo: Escopo
  titulo: string
  trilha: Trilha
}) {
  // A fila é um snapshot montado ao abrir; as Avaliações só mexem nela.
  const [fila, setFila] = useState<Card[]>()
  const [estados, setEstados] = useState(new Map<string, EstadoCard>())
  // O instante da revelação é o `agora` das previsões de intervalo.
  const [reveladoEm, setReveladoEm] = useState<Date>()
  const revelado = reveladoEm !== undefined
  const [revisados, setRevisados] = useState(0)
  const [aviso, setAviso] = useState<string>()
  const ocupado = useRef(false)

  const { temaSlug, baralhoId } = escopo
  useEffect(() => {
    let ativo = true
    void carregarSessao({ temaSlug, baralhoId }, new Date()).then((s) => {
      if (!ativo) return
      setFila([...s.vencidos, ...s.novos])
      setEstados(s.estados)
    })
    return () => {
      ativo = false
    }
  }, [temaSlug, baralhoId])

  const atual = fila?.[0]

  async function avaliarAtual(rating: Grade) {
    if (atual === undefined || ocupado.current) return
    ocupado.current = true
    try {
      const agora = new Date()
      const fsrs = await avaliar(atual.id, rating, agora)
      setEstados((m) =>
        new Map(m).set(atual.id, {
          cardId: atual.id,
          fsrs,
          suspenso: false,
        }),
      )
      setFila((f) => aposAvaliar(f ?? [], atual, fsrs, agora))
      setReveladoEm(undefined)
      setRevisados((n) => n + 1)
      setAviso(undefined)
    } finally {
      ocupado.current = false
    }
  }

  async function erroNaNota() {
    if (atual === undefined || ocupado.current) return
    ocupado.current = true
    try {
      const { notaId } = atual
      const nota = baralhos.flatMap((b) => b.notas).find((n) => n.id === notaId)
      const ids =
        nota === undefined ? [atual.id] : derivarCards(nota).map((c) => c.id)
      await suspenderNota(ids)
      setFila((f) => (f ?? []).filter((c) => c.notaId !== notaId))
      setReveladoEm(undefined)
      try {
        await navigator.clipboard.writeText(`/flashcards-fix ${notaId} `)
        setAviso('Card suspenso. Comando copiado.')
      } catch {
        setAviso('Card suspenso. Não foi possível copiar o comando.')
      }
    } finally {
      ocupado.current = false
    }
  }

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      if (campoDeTexto(e.target) || atual === undefined) return
      if (e.key === ' ' && !revelado) {
        e.preventDefault()
        setReveladoEm(new Date())
        return
      }
      const rating = avaliacoes[Number(e.key) - 1]
      if (revelado && rating !== undefined) {
        e.preventDefault()
        void avaliarAtual(rating)
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  })

  const voltar = trilha[trilha.length - 1]!

  return (
    <main className="sessao">
      <nav className="trilha">
        {trilha.map((t, i) => (
          <span key={t.para}>
            {i > 0 && ' › '}
            <Link to={t.para}>{t.rotulo}</Link>
          </span>
        ))}
      </nav>
      <h1>{titulo}</h1>
      {aviso !== undefined && (
        <p className="aviso" role="status">
          {aviso}
        </p>
      )}
      {fila === undefined ? (
        <p>Carregando…</p>
      ) : atual === undefined ? (
        <section className="fim-sessao">
          <h2>Sessão concluída</h2>
          <p>
            {revisados} {revisados === 1 ? 'Card revisado' : 'Cards revisados'}.
          </p>
          <Link to={voltar.para}>Voltar para {voltar.rotulo}</Link>
        </section>
      ) : (
        <>
          <p className="contagem">Restam {fila.length}</p>
          <CardView card={atual} revelado={revelado} />
          {reveladoEm !== undefined ? (
            <BotoesAvaliacao
              agora={reveladoEm}
              fsrs={estados.get(atual.id)?.fsrs}
              aoAvaliar={(r) => void avaliarAtual(r)}
            />
          ) : (
            <button
              type="button"
              className="botao-principal"
              onClick={() => setReveladoEm(new Date())}
            >
              Mostrar resposta <kbd>Espaço</kbd>
            </button>
          )}
          <button
            type="button"
            className="botao-erro"
            onClick={() => void erroNaNota()}
          >
            Erro na Nota
          </button>
        </>
      )}
    </main>
  )
}

function BotoesAvaliacao({
  agora,
  fsrs,
  aoAvaliar,
}: {
  agora: Date
  fsrs: EstadoCard['fsrs'] | undefined
  aoAvaliar: (rating: Grade) => void
}) {
  const dues = previsoes(fsrs ?? createEmptyCard(agora), agora)
  return (
    <div className="avaliacoes">
      {avaliacoes.map((rating, i) => (
        <button
          key={rating}
          type="button"
          className={`avaliacao ${CLASSES[rating]}`}
          onClick={() => aoAvaliar(rating)}
        >
          <span>
            {ROTULOS[rating]} <kbd>{i + 1}</kbd>
          </span>
          <small>{formatarIntervalo(agora, dues[rating])}</small>
        </button>
      ))}
    </div>
  )
}
