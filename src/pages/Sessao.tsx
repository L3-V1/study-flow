import { type Ref, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { type Grade, Rating, createEmptyCard } from 'ts-fsrs'
import { CardView } from '../components/CardView.tsx'
import { EstadoVazio } from '../components/EstadoVazio.tsx'
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

const EMOJIS: Record<Grade, string> = {
  [Rating.Again]: '😵',
  [Rating.Hard]: '😬',
  [Rating.Good]: '🙂',
  [Rating.Easy]: '😎',
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

// Com Espaço, o navegador já aciona o botão focado (link só com Enter).
function botao(alvo: EventTarget | null): boolean {
  return alvo instanceof HTMLButtonElement
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
  // Suspender a última Nota no meio da Sessão ainda termina em "concluída".
  const [vaziaAoAbrir, setVaziaAoAbrir] = useState(false)
  const [estados, setEstados] = useState(new Map<string, EstadoCard>())
  // O instante da revelação é o `agora` das previsões de intervalo.
  const [reveladoEm, setReveladoEm] = useState<Date>()
  const revelado = reveladoEm !== undefined
  const [revisados, setRevisados] = useState(0)
  const [aviso, setAviso] = useState<string>()
  const ocupado = useRef(false)
  const mostrar = useRef<HTMLButtonElement>(null)
  const grupoAvaliacoes = useRef<HTMLDivElement>(null)
  const tituloFim = useRef<HTMLHeadingElement>(null)

  const { temaSlug, baralhoId } = escopo
  useEffect(() => {
    let ativo = true
    void carregarSessao({ temaSlug, baralhoId }, new Date()).then((s) => {
      if (!ativo) return
      setFila([...s.vencidos, ...s.novos])
      setVaziaAoAbrir(s.vencidos.length + s.novos.length === 0)
      setEstados(s.estados)
    })
    return () => {
      ativo = false
    }
  }, [temaSlug, baralhoId])

  const atual = fila?.[0]
  const carregando = fila === undefined
  const idAtual = atual?.id

  // O botão focado some ao revelar e ao avaliar; o foco não cai no `body`.
  useEffect(() => {
    if (carregando) return
    if (idAtual === undefined) tituloFim.current?.focus()
    else if (revelado) grupoAvaliacoes.current?.focus()
    // Sem rolar: num Card longo, o início da pergunta continua à vista.
    else mostrar.current?.focus({ preventScroll: true })
  }, [revelado, idAtual, carregando])

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
    } catch {
      setAviso('Não foi possível salvar a Avaliação.')
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
      try {
        await suspenderNota(ids)
      } catch {
        setAviso('Não foi possível suspender a Nota.')
        return
      }
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
      // Tecla segurada não repete a Avaliação.
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
      if (campoDeTexto(e.target) || atual === undefined) return
      if (e.key === ' ' && !revelado && !botao(e.target)) {
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
      ) : atual === undefined && vaziaAoAbrir ? (
        <EstadoVazio
          titulo="Nada para estudar agora"
          emoji="☕"
          ref={tituloFim}
        >
          <p>
            <Link to={voltar.para}>Voltar para {voltar.rotulo}</Link>
          </p>
        </EstadoVazio>
      ) : atual === undefined ? (
        <section className="fim-sessao">
          <span className="emoji-grande" aria-hidden="true">
            🎉
          </span>
          <h2 ref={tituloFim} tabIndex={-1}>
            Sessão concluída
          </h2>
          <p>
            {revisados} {revisados === 1 ? 'Card revisado' : 'Cards revisados'}.
          </p>
          <Link className="botao" to={voltar.para}>
            Voltar para {voltar.rotulo}
          </Link>
        </section>
      ) : (
        <>
          <p className="contagem">Restam {fila.length}</p>
          {/* A `key` faz cada Card chegar como uma ficha nova, sem desvirar. */}
          <div className="pilha" data-restam={Math.min(fila.length, 3)}>
            <CardView key={atual.id} card={atual} revelado={revelado} />
          </div>
          {reveladoEm !== undefined ? (
            <BotoesAvaliacao
              ref={grupoAvaliacoes}
              agora={reveladoEm}
              fsrs={estados.get(atual.id)?.fsrs}
              aoAvaliar={(r) => void avaliarAtual(r)}
            />
          ) : (
            <button
              ref={mostrar}
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
  ref,
  agora,
  fsrs,
  aoAvaliar,
}: {
  ref: Ref<HTMLDivElement>
  agora: Date
  fsrs: EstadoCard['fsrs'] | undefined
  aoAvaliar: (rating: Grade) => void
}) {
  const dues = previsoes(fsrs ?? createEmptyCard(agora), agora)
  return (
    <div
      ref={ref}
      className="avaliacoes"
      tabIndex={-1}
      role="group"
      aria-label="Avaliação"
    >
      {avaliacoes.map((rating, i) => (
        <button
          key={rating}
          type="button"
          className={`avaliacao ${CLASSES[rating]}`}
          onClick={() => aoAvaliar(rating)}
        >
          <span className="avaliacao-emoji" aria-hidden="true">
            {EMOJIS[rating]}
          </span>
          <span>
            {ROTULOS[rating]} <kbd>{i + 1}</kbd>
          </span>
          <small>{formatarIntervalo(agora, dues[rating])}</small>
        </button>
      ))}
    </div>
  )
}
