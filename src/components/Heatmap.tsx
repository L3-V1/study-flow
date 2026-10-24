import { useEffect, useRef } from 'react'
import { semanasDoHeatmap } from '../progress/stats.ts'

const plural = (n: number) => (n === 1 ? 'revisão' : 'revisões')

export function Heatmap({
  porDia,
  agora,
}: {
  porDia: Map<string, number>
  agora: Date
}) {
  const rolagem = useRef<HTMLDivElement>(null)
  const semanas = semanasDoHeatmap(porDia, agora)
  const total = semanas
    .flat()
    .reduce((soma, dia) => soma + (dia?.total ?? 0), 0)

  // No celular, abre na semana atual.
  useEffect(() => {
    const el = rolagem.current
    if (el !== null) el.scrollLeft = el.scrollWidth
  }, [])

  return (
    <div className="heatmap">
      <p>
        {total} {plural(total)} no último ano
      </p>
      <div
        className="heatmap-rolagem"
        ref={rolagem}
        tabIndex={0}
        role="region"
        aria-label="Revisões por dia"
      >
        <div className="heatmap-grade">
          {semanas
            .flat()
            .map((dia, i) =>
              dia === null ? (
                <span key={i} />
              ) : (
                <span
                  key={i}
                  role="img"
                  className={`nivel-${dia.nivel}`}
                  title={`${dia.total} ${plural(dia.total)} em ${dia.data.toLocaleDateString('pt-BR')}`}
                  aria-label={`${dia.total} ${plural(dia.total)} em ${dia.data.toLocaleDateString('pt-BR')}`}
                />
              ),
            )}
        </div>
      </div>
      <p className="heatmap-legenda" aria-hidden="true">
        Menos
        {[0, 1, 2, 3, 4].map((n) => (
          <span key={n} className={`nivel-${n}`} />
        ))}
        Mais
      </p>
    </div>
  )
}
